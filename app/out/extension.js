"use strict";
/**
 * @file extension.ts
 * @description Jira Lens — VS Code Extension Host
 *
 * ARCHITECTURE
 * ────────────
 * This file runs in the VS Code Extension Host (Node.js context).
 * It is compiled separately from the Vite/React Webview bundle.
 *
 *   Extension Host (this file)
 *     ↕ vscode.postMessage / onDidReceiveMessage
 *   Webview (dist/index.html — Vite-built React app)
 *     ↕ transport.ts abstraction
 *   Jira Cloud REST API (via lib/jira-client.ts)
 *
 * MESSAGE PROTOCOL
 * ────────────────
 * Request-response (Webview → Host → Webview):
 *   Webview sends:  { id: string, type: MessageType, ...params }
 *   Host replies:   { id: string, result?: unknown, error?: string }
 *
 * Push (Host → Webview, no id):
 *   { type: 'CONNECT_PROGRESS', stage: 'validating'|'fetching'|'done'|'error', message?: string }
 *
 * CREDENTIALS
 * ───────────
 *   JIRA_DOMAIN, JIRA_EMAIL → VS Code settings (jira-lens.domain / jira-lens.email)
 *   JIRA_TOKEN              → VS Code SecretStorage ('jira-lens.token')
 *
 * BUILD
 * ─────
 *   npm run build:extension  →  tsc -p tsconfig.extension.json  →  out/extension.js
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ide_adapters_1 = require("./ide-adapters");
const jira_client_1 = require("./lib/jira-client");
// ── Credential management ─────────────────────────────────────────────────────
async function loadCredentials(context) {
    const token = await context.secrets.get('jira-lens.token');
    const config = vscode.workspace.getConfiguration('jira-lens');
    const domain = config.get('domain') ?? '';
    const email = config.get('email') ?? '';
    if (token && domain && email)
        return { domain, email, token };
    return null;
}
async function saveCredentials(context, domain, email, token) {
    await context.secrets.store('jira-lens.token', token);
    const config = vscode.workspace.getConfiguration('jira-lens');
    await config.update('domain', domain, vscode.ConfigurationTarget.Global);
    await config.update('email', email, vscode.ConfigurationTarget.Global);
}
// ── MCP server registration ──────────────────────────────────────────────────
const MCP_CRED_FILENAME = 'mcp-credentials.json';
function getCredFilePath(context) {
    return path.join(context.globalStorageUri.fsPath, MCP_CRED_FILENAME);
}
function getMcpServerJsPath(context) {
    return path.join(context.extensionPath, 'out', 'mcp', 'mcp', 'server.js');
}
function writeCredentialFile(credPath, creds) {
    fs.mkdirSync(path.dirname(credPath), { recursive: true });
    fs.writeFileSync(credPath, JSON.stringify({ domain: creds.domain, email: creds.email, token: creds.token }));
    fs.chmodSync(credPath, 0o600);
}
async function registerMcpServer(context, creds) {
    const credPath = getCredFilePath(context);
    writeCredentialFile(credPath, creds);
    await (0, ide_adapters_1.getIdeAdapter)().registerMcp(credPath, getMcpServerJsPath(context));
}
async function unregisterMcpServer(context) {
    const credPath = getCredFilePath(context);
    if (fs.existsSync(credPath))
        fs.unlinkSync(credPath);
    await (0, ide_adapters_1.getIdeAdapter)().unregisterMcp();
}
// ── Step detection ────────────────────────────────────────────────────────────
async function detectInitialStep(context) {
    const creds = await loadCredentials(context);
    if (!creds)
        return 0;
    return 1;
}
// ── WebviewPanel ──────────────────────────────────────────────────────────────
class JiraLensPanel {
    static current;
    panel;
    extensionUri;
    context;
    initialStep = 0;
    static async createOrShow(context) {
        if (JiraLensPanel.current) {
            JiraLensPanel.current.panel.reveal();
            return;
        }
        const step = await detectInitialStep(context);
        new JiraLensPanel(context, step);
    }
    constructor(context, initialStep) {
        this.context = context;
        this.extensionUri = context.extensionUri;
        this.initialStep = initialStep;
        this.panel = vscode.window.createWebviewPanel('jiraLens', 'Jira Lens', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
            retainContextWhenHidden: true,
        });
        this.panel.webview.html = this.buildHtml();
        this.panel.onDidDispose(() => { JiraLensPanel.current = undefined; });
        JiraLensPanel.current = this;
        this.panel.webview.onDidReceiveMessage(async (msg) => {
            await this.handleMessage(msg);
        });
        if (initialStep === 1) {
            setTimeout(() => { void this.runConnectionFlow(); }, 500);
        }
    }
    // ── HTML builder ───────────────────────────────────────────────────────────
    buildHtml() {
        const distPath = vscode.Uri.joinPath(this.extensionUri, 'dist');
        const indexPath = vscode.Uri.joinPath(distPath, 'index.html');
        if (!fs.existsSync(indexPath.fsPath)) {
            return this.buildFallbackHtml();
        }
        let html = fs.readFileSync(indexPath.fsPath, 'utf-8');
        const distUri = this.panel.webview.asWebviewUri(distPath).toString();
        html = html.replace(/(src|href)="\.\//g, `$1="${distUri}/`);
        const cspSource = this.panel.webview.cspSource;
        const cspMeta = [
            `<meta http-equiv="Content-Security-Policy" content="`,
            `default-src 'none'; `,
            `script-src 'unsafe-inline' ${cspSource}; `,
            `style-src 'unsafe-inline' ${cspSource} https://fonts.googleapis.com; `,
            `img-src ${cspSource} https: data:; `,
            `font-src ${cspSource} https://fonts.gstatic.com; `,
            `connect-src 'none';`,
            `">`,
        ].join('');
        const flags = [
            `<script>window.__IS_VSCODE__ = true; window.__INITIAL_STEP__ = ${this.initialStep};</script>`,
        ].join('');
        html = html.replace('</head>', `${cspMeta}\n  ${flags}\n</head>`);
        return html;
    }
    buildFallbackHtml() {
        return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Jira Lens</title></head>
<body style="font-family:sans-serif;padding:2rem;color:#ccc;background:#1e1e1e;">
  <h2>Jira Lens</h2>
  <p>Webview bundle not found. Run <code>npm run build:webview</code> first.</p>
</body>
</html>`;
    }
    // ── Push messages ──────────────────────────────────────────────────────────
    sendPush(msg) {
        void this.panel.webview.postMessage(msg);
    }
    // ── Connection flow ────────────────────────────────────────────────────────
    async runConnectionFlow() {
        try {
            this.sendPush({ type: 'CONNECT_PROGRESS', stage: 'validating' });
            const creds = await loadCredentials(this.context);
            if (!creds) {
                this.sendPush({ type: 'CONNECT_PROGRESS', stage: 'error', message: 'Credentials not found. Please re-enter your Jira details.' });
                return;
            }
            this.sendPush({ type: 'CONNECT_PROGRESS', stage: 'fetching' });
            await (0, jira_client_1.fetchProjects)(creds);
            await registerMcpServer(this.context, creds);
            this.sendPush({ type: 'CONNECT_PROGRESS', stage: 'done' });
        }
        catch (err) {
            this.sendPush({
                type: 'CONNECT_PROGRESS',
                stage: 'error',
                message: err.message ?? 'Connection failed',
            });
        }
    }
    // ── Message handler ────────────────────────────────────────────────────────
    async handleMessage(msg) {
        try {
            let result;
            switch (msg.type) {
                // ── Read operations ─────────────────────────────────────────────────
                case 'GET_PROJECTS': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.fetchProjects)(creds);
                    break;
                }
                case 'GET_ISSUES': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.fetchIssuesForProject)(creds, msg.project, msg.jql);
                    break;
                }
                case 'GET_ISSUE': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.fetchIssueRaw)(creds, msg.key);
                    break;
                }
                // ── Onboarding ───────────────────────────────────────────────────────
                case 'SAVE_CREDENTIALS': {
                    await saveCredentials(this.context, msg.domain, msg.email, msg.token);
                    result = { ok: true };
                    void this.panel.webview.postMessage({ id: msg.id, result });
                    void this.runConnectionFlow();
                    return;
                }
                case 'RESET_CREDENTIALS': {
                    await unregisterMcpServer(this.context);
                    await this.context.secrets.delete('jira-lens.token');
                    result = { ok: true };
                    break;
                }
                // ── Write operations (Phase 2) ───────────────────────────────────────
                case 'GET_TRANSITIONS': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.getTransitions)(creds, msg.key);
                    break;
                }
                case 'TRANSITION_ISSUE': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.transitionIssue)(creds, msg.key, msg.transitionId, msg.comment);
                    break;
                }
                case 'ASSIGN_ISSUE': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.assignIssue)(creds, msg.key, msg.accountId);
                    break;
                }
                case 'SEARCH_USERS': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.searchUsers)(creds, msg.query, msg.maxResults);
                    break;
                }
                case 'ADD_COMMENT': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.addComment)(creds, msg.key, msg.body);
                    break;
                }
                case 'UPDATE_ISSUE': {
                    const creds = await this.requireCreds();
                    const m = msg;
                    result = await (0, jira_client_1.updateIssue)(creds, m.key, m.updates);
                    break;
                }
                case 'CREATE_ISSUE': {
                    const creds = await this.requireCreds();
                    const m = msg;
                    result = await (0, jira_client_1.createIssue)(creds, m.opts);
                    break;
                }
                case 'FETCH_LINK_TYPES': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.fetchLinkTypes)(creds);
                    break;
                }
                case 'LINK_ISSUES': {
                    const creds = await this.requireCreds();
                    result = await (0, jira_client_1.linkIssues)(creds, msg.sourceKey, msg.targetKey, msg.linkTypeName);
                    break;
                }
                default:
                    throw new Error(`Unknown message type: ${msg.type}`);
            }
            void this.panel.webview.postMessage({ id: msg.id, result });
        }
        catch (err) {
            void this.panel.webview.postMessage({ id: msg.id, error: err.message });
        }
    }
    async requireCreds() {
        const creds = await loadCredentials(this.context);
        if (!creds)
            throw new Error('Not connected. Please complete setup first.');
        return creds;
    }
}
// ── Extension lifecycle ───────────────────────────────────────────────────────
function activate(context) {
    const cmd = vscode.commands.registerCommand('jira-lens.open', () => {
        void JiraLensPanel.createOrShow(context);
    });
    context.subscriptions.push(cmd);
}
function deactivate() {
    // nothing to clean up
}
//# sourceMappingURL=extension.js.map