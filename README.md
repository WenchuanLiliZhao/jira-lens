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

[`jira-mcp`](https://github.com/WenchuanLiliZhao/jira-mcp) is the companion MCP server that connects **Cursor AI** to Jira. It remains a standalone tool.

Jira Lens uses `jira-mcp` as its Jira data layer during setup:

- The extension's onboarding flow guides you through installing and configuring `jira-mcp`
- Once configured, Jira Lens reads from the same credentials
- You can use both independently or together

```
Jira Lens (Extension UI)
        │
        └── jira-mcp (MCP Server)  ← also used by Cursor AI chat
                │
                └── Jira Cloud API
```

---

## Planned Features

| Feature | Status |
|---|---|
| Observation Layer — cross-project view | 🔲 Prototyping |
| Notion-style inline editing | 🔲 Prototyping |
| View switching (board / list / timeline) | 🔲 Prototyping |
| MCP onboarding flow | ✅ Designed |
| Unified data model | 🔲 In definition |
| Extension scaffold | 🔲 Planned |

---

## Tech Stack

- **Extension:** VS Code Extension API (TypeScript)
- **UI components:** [UI-304](https://github.com/WenchuanLiliZhao/ai-workflows-all-in-one) — React + TypeScript + SCSS
- **Jira layer:** [`jira-mcp`](https://github.com/WenchuanLiliZhao/jira-mcp) (Node.js, Jira Cloud REST API)

---

## Requirements

- VS Code or Cursor
- Node.js 18+
- A Jira Cloud account with an API token
- [`jira-mcp`](https://github.com/WenchuanLiliZhao/jira-mcp) installed and configured

---

## Development Tracking

Issues and exploration are tracked in the [JL Jira project](https://zhaowenchuan.atlassian.net/jira/software/projects/JL/boards).

Current focus: [JL-1 — Define the Observation Layer](https://zhaowenchuan.atlassian.net/browse/JL-1)
