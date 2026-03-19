"use strict";
/**
 * @file ide-adapters/vscode.ts
 * @description IdeAdapter stub for VS Code.
 *
 * VS Code is not adapted for now: MCP auto-registration is not implemented;
 * this file serves as a placeholder and reference.
 *
 * MCP auto-registration for VS Code is NOT YET IMPLEMENTED.
 * The structure is preserved so this can be filled in when needed.
 *
 * When implementing:
 *   - Use vscode.workspace.getConfiguration('mcp') to read/write mcp.servers
 *   - Entry format: { "jira-lens": { type: "stdio", command, args, env } }
 *   - See cursor.ts for reference.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VsCodeAdapter = void 0;
class VsCodeAdapter {
    name = 'VS Code';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async registerMcp(_credPath, _serverPath) {
        console.warn('Jira Lens: MCP auto-registration is not yet supported for VS Code. ' +
            'Register the MCP server manually in your settings.json under mcp.servers.');
    }
    async unregisterMcp() {
        // no-op — nothing was registered
    }
}
exports.VsCodeAdapter = VsCodeAdapter;
//# sourceMappingURL=vscode.js.map