# ide-adapters

This directory contains all IDE-specific adaptation code for Jira Lens.

**Every piece of code that behaves differently per IDE must live here.**
Do not add IDE-specific branches (`if appName === 'cursor'`, `isTrae()`, etc.) anywhere else in the codebase.

---

## Why this exists

Jira Lens runs in multiple IDEs (Cursor, VS Code, Trae, ...). Each IDE has its own:
- MCP server registration format and file path
- AI chat injection API (future)
- Other IDE-specific behaviors (future)

Centralizing this code makes it easy to see at a glance what is adapted, and makes adding a new IDE a contained, well-defined task.

---

## Current adapters

| File | IDE | Status |
|------|-----|--------|
| `cursor.ts` | Cursor | Implemented |
| `vscode.ts` | VS Code | Stub (not yet implemented) |

---

## How to add a new IDE adapter

1. Create `{ide-name}.ts` in this directory implementing the `IdeAdapter` interface from `types.ts`.

```typescript
import type { IdeAdapter } from './types';

export class TraeAdapter implements IdeAdapter {
  readonly name = 'Trae';

  async registerMcp(credPath: string, serverPath: string): Promise<void> {
    // Write to Trae's MCP config location
  }

  async unregisterMcp(): Promise<void> {
    // Remove from Trae's MCP config
  }
}
```

2. Register it in `index.ts` — add one `if` branch:

```typescript
if (appName.includes('trae')) return new TraeAdapter();
```

3. Update this README's adapter table.

That's it. `extension.ts` and the rest of the codebase need no changes.

---

## How to add a new capability

1. Add an optional method to `IdeAdapter` in `types.ts`.
2. Implement it in each adapter file (or leave it unimplemented as a no-op).
3. Call it from `extension.ts` via `getIdeAdapter()`.

---

## IdeAdapter interface (types.ts)

```typescript
export interface IdeAdapter {
  readonly name: string;
  registerMcp(credPath: string, serverPath: string): Promise<void>;
  unregisterMcp(): Promise<void>;
  // Future: injectPrompt?(prompt: string): Promise<void>;
}
```

---

## IDE detection

Detection is done in `index.ts` via `vscode.env.appName`:

| IDE | appName contains |
|-----|-----------------|
| Cursor | `"cursor"` |
| VS Code | (default fallback) |
| Trae | `"trae"` (to be confirmed) |
