"use strict";
/**
 * @file ide-adapters/cursor.ts
 * @description IdeAdapter implementation for Cursor IDE.
 *
 * MCP config location: ~/.cursor/mcp.json
 * Format: { mcpServers: { "jira-lens": { command, args, env } } }
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
exports.CursorAdapter = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const MCP_SERVER_KEY = 'jira-lens';
function getMcpJsonPath() {
    return path.join(os.homedir(), '.cursor', 'mcp.json');
}
function buildEntry(credPath, serverPath) {
    return {
        command: 'node',
        args: [serverPath],
        env: { JIRA_LENS_CONFIG: credPath },
    };
}
class CursorAdapter {
    name = 'Cursor';
    async registerMcp(credPath, serverPath) {
        const mcpJsonPath = getMcpJsonPath();
        let config = {};
        if (fs.existsSync(mcpJsonPath)) {
            try {
                config = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
            }
            catch { /* start fresh */ }
        }
        const servers = (config.mcpServers ?? {});
        servers[MCP_SERVER_KEY] = buildEntry(credPath, serverPath);
        config.mcpServers = servers;
        fs.mkdirSync(path.dirname(mcpJsonPath), { recursive: true });
        fs.writeFileSync(mcpJsonPath, JSON.stringify(config, null, 2) + '\n');
    }
    async unregisterMcp() {
        const mcpJsonPath = getMcpJsonPath();
        if (!fs.existsSync(mcpJsonPath))
            return;
        try {
            const config = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
            const servers = (config.mcpServers ?? {});
            delete servers[MCP_SERVER_KEY];
            config.mcpServers = servers;
            fs.writeFileSync(mcpJsonPath, JSON.stringify(config, null, 2) + '\n');
        }
        catch { /* file corrupt or missing — nothing to clean */ }
    }
}
exports.CursorAdapter = CursorAdapter;
//# sourceMappingURL=cursor.js.map