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

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { getIdeAdapter } from './ide-adapters';

import {
  type Credentials,
  fetchProjects,
  fetchIssuesForProject,
  fetchIssueRaw,
  getTransitions as jiraGetTransitions,
  transitionIssue as jiraTransitionIssue,
  assignIssue as jiraAssignIssue,
  searchUsers as jiraSearchUsers,
  addComment as jiraAddComment,
  updateIssue as jiraUpdateIssue,
  createIssue as jiraCreateIssue,
  fetchLinkTypes as jiraFetchLinkTypes,
  linkIssues as jiraLinkIssues,
} from './lib/jira-client';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2;

type InboundMessage =
  // Read operations
  | { id: string; type: 'GET_PROJECTS' }
  | { id: string; type: 'GET_ISSUES'; project: string; jql?: string }
  | { id: string; type: 'GET_ISSUE'; key: string }
  // Onboarding
  | { id: string; type: 'SAVE_CREDENTIALS'; domain: string; email: string; token: string }
  | { id: string; type: 'RESET_CREDENTIALS' }
  // Write operations (Phase 2)
  | { id: string; type: 'GET_TRANSITIONS'; key: string }
  | { id: string; type: 'TRANSITION_ISSUE'; key: string; transitionId: string; comment?: string }
  | { id: string; type: 'ASSIGN_ISSUE'; key: string; accountId: string | null }
  | { id: string; type: 'SEARCH_USERS'; query: string; maxResults?: number }
  | { id: string; type: 'ADD_COMMENT'; key: string; body: string }
  | { id: string; type: 'UPDATE_ISSUE'; key: string; updates: Record<string, unknown> }
  | { id: string; type: 'CREATE_ISSUE'; opts: Record<string, unknown> }
  | { id: string; type: 'FETCH_LINK_TYPES' }
  | { id: string; type: 'LINK_ISSUES'; sourceKey: string; targetKey: string; linkTypeName?: string };

type PushMessage =
  | { type: 'CONNECT_PROGRESS'; stage: 'validating' | 'fetching' | 'done' | 'error'; message?: string };

// ── Credential management ─────────────────────────────────────────────────────

async function loadCredentials(context: vscode.ExtensionContext): Promise<Credentials | null> {
  const token = await context.secrets.get('jira-lens.token');
  const config = vscode.workspace.getConfiguration('jira-lens');
  const domain = config.get<string>('domain') ?? '';
  const email = config.get<string>('email') ?? '';
  if (token && domain && email) return { domain, email, token };
  return null;
}

async function saveCredentials(
  context: vscode.ExtensionContext,
  domain: string,
  email: string,
  token: string,
): Promise<void> {
  await context.secrets.store('jira-lens.token', token);
  const config = vscode.workspace.getConfiguration('jira-lens');
  await config.update('domain', domain, vscode.ConfigurationTarget.Global);
  await config.update('email', email, vscode.ConfigurationTarget.Global);
}

// ── MCP server registration ──────────────────────────────────────────────────

const MCP_CRED_FILENAME = 'mcp-credentials.json';

function getCredFilePath(context: vscode.ExtensionContext): string {
  return path.join(context.globalStorageUri.fsPath, MCP_CRED_FILENAME);
}

function getMcpServerJsPath(context: vscode.ExtensionContext): string {
  return path.join(context.extensionPath, 'out', 'mcp', 'mcp', 'server.js');
}

function writeCredentialFile(credPath: string, creds: Credentials): void {
  fs.mkdirSync(path.dirname(credPath), { recursive: true });
  fs.writeFileSync(
    credPath,
    JSON.stringify({ domain: creds.domain, email: creds.email, token: creds.token }),
  );
  fs.chmodSync(credPath, 0o600);
}

async function registerMcpServer(context: vscode.ExtensionContext, creds: Credentials): Promise<void> {
  const credPath = getCredFilePath(context);
  writeCredentialFile(credPath, creds);
  await getIdeAdapter().registerMcp(credPath, getMcpServerJsPath(context));
}

async function unregisterMcpServer(context: vscode.ExtensionContext): Promise<void> {
  const credPath = getCredFilePath(context);
  if (fs.existsSync(credPath)) fs.unlinkSync(credPath);
  await getIdeAdapter().unregisterMcp();
}

// ── Step detection ────────────────────────────────────────────────────────────

async function detectInitialStep(context: vscode.ExtensionContext): Promise<Step> {
  const creds = await loadCredentials(context);
  if (!creds) return 0;
  return 1;
}

// ── WebviewPanel ──────────────────────────────────────────────────────────────

class JiraLensPanel {
  static current: JiraLensPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly context: vscode.ExtensionContext;
  private initialStep: Step = 0;

  static async createOrShow(context: vscode.ExtensionContext): Promise<void> {
    if (JiraLensPanel.current) {
      JiraLensPanel.current.panel.reveal();
      return;
    }
    const step = await detectInitialStep(context);
    new JiraLensPanel(context, step);
  }

  constructor(context: vscode.ExtensionContext, initialStep: Step) {
    this.context = context;
    this.extensionUri = context.extensionUri;
    this.initialStep = initialStep;

    this.panel = vscode.window.createWebviewPanel(
      'jiraLens',
      'Jira Lens',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.buildHtml();
    this.panel.onDidDispose(() => { JiraLensPanel.current = undefined; });
    JiraLensPanel.current = this;

    this.panel.webview.onDidReceiveMessage(async (msg: InboundMessage) => {
      await this.handleMessage(msg);
    });

    if (initialStep === 1) {
      setTimeout(() => { void this.runConnectionFlow(); }, 500);
    }
  }

  // ── HTML builder ───────────────────────────────────────────────────────────

  private buildHtml(): string {
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

  private buildFallbackHtml(): string {
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

  private sendPush(msg: PushMessage): void {
    void this.panel.webview.postMessage(msg);
  }

  // ── Connection flow ────────────────────────────────────────────────────────

  private async runConnectionFlow(): Promise<void> {
    try {
      this.sendPush({ type: 'CONNECT_PROGRESS', stage: 'validating' });
      const creds = await loadCredentials(this.context);
      if (!creds) {
        this.sendPush({ type: 'CONNECT_PROGRESS', stage: 'error', message: 'Credentials not found. Please re-enter your Jira details.' });
        return;
      }

      this.sendPush({ type: 'CONNECT_PROGRESS', stage: 'fetching' });
      await fetchProjects(creds);

      await registerMcpServer(this.context, creds);

      this.sendPush({ type: 'CONNECT_PROGRESS', stage: 'done' });
    } catch (err) {
      this.sendPush({
        type: 'CONNECT_PROGRESS',
        stage: 'error',
        message: (err as Error).message ?? 'Connection failed',
      });
    }
  }

  // ── Message handler ────────────────────────────────────────────────────────

  private async handleMessage(msg: InboundMessage): Promise<void> {
    try {
      let result: unknown;

      switch (msg.type) {

        // ── Read operations ─────────────────────────────────────────────────
        case 'GET_PROJECTS': {
          const creds = await this.requireCreds();
          result = await fetchProjects(creds);
          break;
        }
        case 'GET_ISSUES': {
          const creds = await this.requireCreds();
          result = await fetchIssuesForProject(creds, msg.project, msg.jql);
          break;
        }
        case 'GET_ISSUE': {
          const creds = await this.requireCreds();
          result = await fetchIssueRaw(creds, msg.key);
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
          result = await jiraGetTransitions(creds, msg.key);
          break;
        }
        case 'TRANSITION_ISSUE': {
          const creds = await this.requireCreds();
          result = await jiraTransitionIssue(creds, msg.key, msg.transitionId, msg.comment);
          break;
        }
        case 'ASSIGN_ISSUE': {
          const creds = await this.requireCreds();
          result = await jiraAssignIssue(creds, msg.key, msg.accountId);
          break;
        }
        case 'SEARCH_USERS': {
          const creds = await this.requireCreds();
          result = await jiraSearchUsers(creds, msg.query, msg.maxResults);
          break;
        }
        case 'ADD_COMMENT': {
          const creds = await this.requireCreds();
          result = await jiraAddComment(creds, msg.key, msg.body);
          break;
        }
        case 'UPDATE_ISSUE': {
          const creds = await this.requireCreds();
          const m = msg as { key: string; updates: Record<string, unknown> };
          result = await jiraUpdateIssue(creds, m.key, m.updates as Parameters<typeof jiraUpdateIssue>[2]);
          break;
        }
        case 'CREATE_ISSUE': {
          const creds = await this.requireCreds();
          const m = msg as { opts: Record<string, unknown> };
          result = await jiraCreateIssue(creds, m.opts as Parameters<typeof jiraCreateIssue>[1]);
          break;
        }
        case 'FETCH_LINK_TYPES': {
          const creds = await this.requireCreds();
          result = await jiraFetchLinkTypes(creds);
          break;
        }
        case 'LINK_ISSUES': {
          const creds = await this.requireCreds();
          result = await jiraLinkIssues(creds, msg.sourceKey, msg.targetKey, msg.linkTypeName);
          break;
        }

        default:
          throw new Error(`Unknown message type: ${(msg as { type: string }).type}`);
      }

      void this.panel.webview.postMessage({ id: msg.id, result });
    } catch (err) {
      void this.panel.webview.postMessage({ id: msg.id, error: (err as Error).message });
    }
  }

  private async requireCreds(): Promise<Credentials> {
    const creds = await loadCredentials(this.context);
    if (!creds) throw new Error('Not connected. Please complete setup first.');
    return creds;
  }
}

// ── Extension lifecycle ───────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  const cmd = vscode.commands.registerCommand('jira-lens.open', () => {
    void JiraLensPanel.createOrShow(context);
  });
  context.subscriptions.push(cmd);
}

export function deactivate(): void {
  // nothing to clean up
}
