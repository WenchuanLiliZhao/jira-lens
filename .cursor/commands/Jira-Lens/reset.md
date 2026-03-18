# /Jira-Lens/reset — Reset Jira Lens credentials

Wipe all Jira Lens configuration from this machine so it returns to a first-run state. Run this when you need a clean slate for testing.

---

## What this command clears

| Store | Keys / Files |
|-------|------|
| Cursor/VS Code user settings.json | `jira-lens.domain`, `jira-lens.email` |
| Electron safeStorage (SecretStorage) | `jira-lens.token` |
| MCP credential file | `globalStorage/wenchuanlilizhao.jira-lens/mcp-credentials.json` |
| Cursor MCP config | `~/.cursor/mcp.json` → `mcpServers["jira-lens"]` entry |
| VS Code MCP config | `settings.json` → `mcp.servers["jira-lens"]` entry |

---

## Steps

Run the following commands in sequence. Confirm each step succeeded before proceeding.

### 1 — Remove `jira-lens` MCP server from Cursor's mcp.json

```bash
node -e "
const fs = require('fs');
const p = require('os').homedir() + '/.cursor/mcp.json';
if (!fs.existsSync(p)) { console.log('~/.cursor/mcp.json not found — nothing to do'); process.exit(0); }
const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
if (cfg.mcpServers && cfg.mcpServers['jira-lens']) {
  delete cfg.mcpServers['jira-lens'];
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2) + '\n');
  console.log('Removed jira-lens from mcp.json ✓');
} else {
  console.log('jira-lens not in mcp.json — nothing to do');
}
"
```

### 2 — Delete the MCP credential file

```bash
node -e "
const fs = require('fs');
['Cursor', 'Code'].forEach(app => {
  const p = require('os').homedir() + '/Library/Application Support/' + app + '/User/globalStorage/wenchuanlilizhao.jira-lens/mcp-credentials.json';
  if (fs.existsSync(p)) { fs.unlinkSync(p); console.log(app + ': deleted mcp-credentials.json ✓'); }
  else { console.log(app + ': no credential file found'); }
});
"
```

### 3 — Remove settings from Cursor's user settings.json

```bash
node -e "
const fs = require('fs');
const path = require('os').homedir() + '/Library/Application Support/Cursor/User/settings.json';
if (!fs.existsSync(path)) { console.log('settings.json not found — nothing to do'); process.exit(0); }
const raw = fs.readFileSync(path, 'utf8');
const cfg = JSON.parse(raw);
let changed = false;
['jira-lens.domain', 'jira-lens.email'].forEach(k => {
  if (k in cfg) { delete cfg[k]; changed = true; console.log('Removed: ' + k); }
  else { console.log('Not present: ' + k); }
});
if (changed) fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
console.log('Done.');
"
```

Also clear from VS Code if installed:

```bash
node -e "
const fs = require('fs');
const path = require('os').homedir() + '/Library/Application Support/Code/User/settings.json';
if (!fs.existsSync(path)) { console.log('VS Code settings.json not found — skipping'); process.exit(0); }
const raw = fs.readFileSync(path, 'utf8');
const cfg = JSON.parse(raw);
let changed = false;
['jira-lens.domain', 'jira-lens.email', 'mcp.servers'].forEach(k => {
  if (k === 'mcp.servers') {
    const mcp = cfg.mcp;
    if (mcp && mcp.servers && mcp.servers['jira-lens']) {
      delete mcp.servers['jira-lens'];
      changed = true;
      console.log('Removed: mcp.servers.jira-lens');
    }
  } else if (k in cfg) { delete cfg[k]; changed = true; console.log('Removed: ' + k); }
  else { console.log('Not present: ' + k); }
});
if (changed) fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
console.log('Done.');
"
```

### 4 — Delete the API token from SecretStorage

Cursor (and VS Code) store extension secrets via Electron's `safeStorage`, which writes an encrypted blob into the extension's globalStorage SQLite DB — **not** directly in the macOS Keychain. The safest way to clear this is through the extension's own UI:

1. Open Jira Lens in Cursor/VS Code.
2. Click **"Reset Jira connection"** in the top-right toolbar.  
   This calls `context.secrets.delete('jira-lens.token')` and also removes the MCP registration automatically.

Alternatively, delete the whole extension storage directory (nuclear option):

```bash
# Cursor
rm -rf ~/Library/Application\ Support/Cursor/User/globalStorage/wenchuanlilizhao.jira-lens/
# VS Code
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/wenchuanlilizhao.jira-lens/
```

> The nuclear option deletes all extension state, including the MCP credential file and the token.
> Use the UI button unless you specifically need to wipe everything.

### 5 — Verify

```bash
node -e "
const fs = require('fs');
['Cursor', 'Code'].forEach(app => {
  const p = require('os').homedir() + '/Library/Application Support/' + app + '/User/settings.json';
  if (!fs.existsSync(p)) return;
  const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
  const keys = ['jira-lens.domain', 'jira-lens.email'].filter(k => k in cfg);
  const hasMcp = cfg.mcp && cfg.mcp.servers && cfg.mcp.servers['jira-lens'];
  const issues = [...keys, ...(hasMcp ? ['mcp.servers.jira-lens'] : [])];
  console.log(app + ':', issues.length === 0 ? 'clean ✓' : 'still has: ' + issues.join(', '));
});
const mcpJson = require('os').homedir() + '/.cursor/mcp.json';
if (fs.existsSync(mcpJson)) {
  const cfg = JSON.parse(fs.readFileSync(mcpJson, 'utf8'));
  const has = cfg.mcpServers && cfg.mcpServers['jira-lens'];
  console.log('mcp.json:', has ? 'still has jira-lens' : 'clean ✓');
}
['Cursor', 'Code'].forEach(app => {
  const p = require('os').homedir() + '/Library/Application Support/' + app + '/User/globalStorage/wenchuanlilizhao.jira-lens/mcp-credentials.json';
  console.log(app + ' cred file:', fs.existsSync(p) ? 'still exists' : 'clean ✓');
});
"
```

If all outputs are `clean ✓` and you've clicked Reset in the UI (or deleted globalStorage), Jira Lens will start from step 0 (credential setup screen) on next open.
