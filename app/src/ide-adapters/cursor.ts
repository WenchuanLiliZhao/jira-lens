/**
 * @file ide-adapters/cursor.ts
 * @description IdeAdapter implementation for Cursor IDE.
 *
 * MCP config location: ~/.cursor/mcp.json
 * Format: { mcpServers: { "jira-lens": { command, args, env } } }
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { IdeAdapter } from './types';

const MCP_SERVER_KEY = 'jira-lens';

function getMcpJsonPath(): string {
  return path.join(os.homedir(), '.cursor', 'mcp.json');
}

function buildEntry(credPath: string, serverPath: string): Record<string, unknown> {
  return {
    command: 'node',
    args: [serverPath],
    env: { JIRA_LENS_CONFIG: credPath },
  };
}

export class CursorAdapter implements IdeAdapter {
  readonly name = 'Cursor';

  async registerMcp(credPath: string, serverPath: string): Promise<void> {
    const mcpJsonPath = getMcpJsonPath();
    let config: Record<string, unknown> = {};
    if (fs.existsSync(mcpJsonPath)) {
      try { config = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8')); } catch { /* start fresh */ }
    }
    const servers = (config.mcpServers ?? {}) as Record<string, unknown>;
    servers[MCP_SERVER_KEY] = buildEntry(credPath, serverPath);
    config.mcpServers = servers;
    fs.mkdirSync(path.dirname(mcpJsonPath), { recursive: true });
    fs.writeFileSync(mcpJsonPath, JSON.stringify(config, null, 2) + '\n');
  }

  async unregisterMcp(): Promise<void> {
    const mcpJsonPath = getMcpJsonPath();
    if (!fs.existsSync(mcpJsonPath)) return;
    try {
      const config = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8')) as Record<string, unknown>;
      const servers = (config.mcpServers ?? {}) as Record<string, unknown>;
      delete servers[MCP_SERVER_KEY];
      config.mcpServers = servers;
      fs.writeFileSync(mcpJsonPath, JSON.stringify(config, null, 2) + '\n');
    } catch { /* file corrupt or missing — nothing to clean */ }
  }
}
