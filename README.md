# Jira Lens

A VS Code / Cursor extension that brings Jira into your IDE — not as a notification panel, but as a proper **observation layer** for your engineering workflow.

> **Status:** Early-stage prototyping. Core interaction patterns are being defined.

---

## The Problem

Existing Jira integrations in the IDE (e.g. Atlascode) are built around individual issue management. They replicate the Jira web UI inside a sidebar. This works for simple ticket updates, but falls short when you need to:

- Track work **across multiple projects** without switching context
- See the **state of a sprint or epic at a glance**, not issue by issue
- Interact with Jira data the way you interact with a **document** — fluidly, in-place

Jira Lens takes a different approach.

---

## Core Concept: The Observation Layer

The **Observation Layer** is a structured view of your Jira data that lives alongside your code. Instead of opening Jira in a browser or navigating a tree of issues, you work with a composable view that shows exactly what you care about — across projects, sprints, and epics — without leaving the editor.

Key properties:

- **Cross-project** — issues from multiple projects rendered in a single, unified view
- **View-switching** — switch between board, list, timeline, or custom layouts
- **Notion-style interactions** — edit summaries, statuses, and fields inline, without modals
- **Composable** — define what you observe; save and reuse observation scenarios

---

## Relationship to `jira-mcp`

`jira-mcp` is a **separate, optional** MCP server that connects **Cursor AI Chat** to Jira. Jira Lens does **not** depend on it — the extension has its own built-in Jira API client and manages credentials independently via VS Code SecretStorage.

```
Jira Lens Extension ──── own Jira API client ──── Jira Cloud API
                                                       ↑
jira-mcp (optional) ──── MCP server ─────────────── Jira Cloud API
  └── used by Cursor AI Chat
```

**Credential sync:** When you enter credentials in Jira Lens, the extension also writes them to `~/Jira-MCP/config/secrets.json` (if the directory exists). This means installing jira-mcp later requires no extra credential setup.

**Recommendation flow:** After connecting, Jira Lens shows a dismissable banner suggesting jira-mcp installation for users who want Jira access in Cursor AI Chat. Clicking "Install via AI" opens Cursor Chat with an automated setup prompt.

---

## Planned Features

| Feature | Status |
|---|---|
| Observation Layer — cross-project view | 🔲 Prototyping |
| Notion-style inline editing | 🔲 Prototyping |
| View switching (board / list / timeline) | 🔲 Prototyping |
| Credential onboarding flow | ✅ Done |
| Optional jira-mcp recommendation | ✅ Done |
| Unified data model | 🔲 In definition |
| Extension scaffold | ✅ Done |

---

## Tech Stack

- **Extension:** VS Code Extension API (TypeScript)
- **UI components:** React + TypeScript + SCSS (in `app/`)
- **Jira layer:** `jira-mcp` (Node.js, Jira Cloud REST API) — optional companion MCP server

---

## Requirements

- VS Code or Cursor
- Node.js 18+
- A Jira Cloud account with an API token
- `jira-mcp` *(optional — for Cursor AI Chat integration; install from your MCP server source)*

---

## Docs

- **[Technical discussions (AI Portal, Webview sync, local cache)](docs/jira-lens-technical-discussions.md)** — architecture notes from internal exploration.
- **Publish that doc to Confluence:** set `JIRA_DOMAIN`, `JIRA_EMAIL`, `JIRA_TOKEN`, then from `app/` run `npm run confluence:publish-discussion`. See [docs/CONFLUENCE-PUBLISH.md](docs/CONFLUENCE-PUBLISH.md).

---

## Development Tracking

Issues and exploration are tracked in a private Jira project (URLs omitted in this public README).

Current focus: define the Observation Layer (see project board in your Jira instance).
