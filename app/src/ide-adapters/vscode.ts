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

import type { IdeAdapter } from './types';

export class VsCodeAdapter implements IdeAdapter {
  readonly name = 'VS Code';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async registerMcp(_credPath: string, _serverPath: string): Promise<void> {
    console.warn(
      'Jira Lens: MCP auto-registration is not yet supported for VS Code. ' +
      'Register the MCP server manually in your settings.json under mcp.servers.',
    );
  }

  async unregisterMcp(): Promise<void> {
    // no-op — nothing was registered
  }
}
