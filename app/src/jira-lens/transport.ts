/**
 * @file transport.ts
 * @description Jira API transport abstraction for the Jira Lens Webview
 *
 * Detects runtime environment and routes API calls accordingly:
 *
 *   VS Code Webview  →  vscode.postMessage  →  extension.ts  →  Jira Cloud
 *   Browser (dev)    →  fetch()             →  server.js proxy  →  Jira Cloud
 *
 * PUSH MESSAGES
 * ─────────────
 * The extension can send unsolicited messages (no id) to the Webview.
 * Subscribe with: onPush(handler)
 * Currently used for: CONNECT_PROGRESS stages during connection flow.
 *
 * INITIAL STEP
 * ────────────
 * The extension injects window.__INITIAL_STEP__ = N before the Webview loads.
 * Import `initialStep` to read it. Defaults to 2 in browser dev mode.
 *
 * STEPS:  0 = credentials form · 1 = connecting · 2 = main interface
 */

// ── Environment detection ─────────────────────────────────────────────────────

declare const acquireVsCodeApi: () => { postMessage: (msg: unknown) => void };

const isVSCode: boolean =
  typeof (window as unknown as Record<string, unknown>).__IS_VSCODE__ === 'boolean' &&
  (window as unknown as Record<string, unknown>).__IS_VSCODE__ === true;

// ── Initial step (injected by extension host) ─────────────────────────────────

export const initialStep: number = isVSCode
  ? (((window as unknown as Record<string, unknown>).__INITIAL_STEP__ as number) ?? 0)
  : 2;

// ── VS Code postMessage channel ───────────────────────────────────────────────

let vscodeApi: ReturnType<typeof acquireVsCodeApi> | null = null;

if (isVSCode) {
  vscodeApi = acquireVsCodeApi();
}

let _messageId = 0;
const pending = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}>();

// ── Push message types ────────────────────────────────────────────────────────

export type ConnectStage = 'validating' | 'fetching' | 'done' | 'error';

export interface ConnectProgressMessage {
  type: 'CONNECT_PROGRESS';
  stage: ConnectStage;
  message?: string;
}

export type PushMessage = ConnectProgressMessage;

// ── Push message registry ─────────────────────────────────────────────────────

type PushHandler = (msg: PushMessage) => void;
const pushHandlers: PushHandler[] = [];

export function onPush(handler: PushHandler): () => void {
  pushHandlers.push(handler);
  return () => {
    const idx = pushHandlers.indexOf(handler);
    if (idx !== -1) pushHandlers.splice(idx, 1);
  };
}

// ── Message listener ──────────────────────────────────────────────────────────

if (isVSCode) {
  window.addEventListener('message', (
    event: MessageEvent<{ id?: string; result?: unknown; error?: string; type?: string }>
  ) => {
    const data = event.data;

    if (!data.id && data.type) {
      const push = data as unknown as PushMessage;
      for (const handler of pushHandlers) {
        handler(push);
      }
      return;
    }

    if (data.id) {
      const p = pending.get(data.id);
      if (!p) return;
      pending.delete(data.id);
      if (data.error !== undefined) {
        p.reject(new Error(data.error));
      } else {
        p.resolve(data.result);
      }
    }
  });
}

function callExtension(type: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const id = String(++_messageId);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    vscodeApi!.postMessage({ id, type, ...params });
  });
}

// ── Browser fallback ──────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:3001';

async function browserFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function browserPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Onboarding actions (VS Code only) ─────────────────────────────────────────

export async function saveCredentials(domain: string, email: string, token: string): Promise<void> {
  if (!isVSCode) return;
  await callExtension('SAVE_CREDENTIALS', { domain, email, token });
}

export async function resetCredentials(): Promise<void> {
  if (!isVSCode) return;
  await callExtension('RESET_CREDENTIALS');
}

// ── Public Jira API — Read ────────────────────────────────────────────────────

export interface JiraProject {
  key: string;
  name: string;
}

export async function getProjects(): Promise<JiraProject[]> {
  if (isVSCode) {
    return callExtension('GET_PROJECTS') as Promise<JiraProject[]>;
  }
  return browserFetch<JiraProject[]>('/api/projects');
}

export interface JiraIssueSummary {
  key: string;
  fields?: {
    summary?: string;
    status?: { name?: string };
    assignee?: { displayName?: string };
    issuetype?: { name?: string; iconUrl?: string };
    priority?: { name?: string; iconUrl?: string };
  };
}

export async function getIssues(project: string, jql?: string): Promise<{ issues: JiraIssueSummary[] }> {
  if (isVSCode) {
    return callExtension('GET_ISSUES', { project, ...(jql ? { jql } : {}) }) as Promise<{ issues: JiraIssueSummary[] }>;
  }
  if (jql) {
    return browserPost<{ issues: JiraIssueSummary[] }>('/api/issues', { project, jql });
  }
  return browserFetch<{ issues: JiraIssueSummary[] }>(`/api/issues?project=${encodeURIComponent(project)}`);
}

export interface JiraIssueDetail {
  key: string;
  fields: {
    summary: string;
    description?: unknown;
    status: { name: string };
    priority?: { name: string; iconUrl?: string };
    issuetype: { name: string; iconUrl?: string };
    assignee?: { displayName: string; accountId?: string } | null;
    reporter?: { displayName: string };
    created?: string;
    updated?: string;
    duedate?: string | null;
    labels?: string[];
    story_points?: number | null;
    sprint?: unknown;
    epic?: { key: string; fields?: { summary?: string } } | null;
    subtasks?: { key: string; fields: { summary?: string; status?: { name?: string } } }[];
    issuelinks?: {
      type?: { name?: string };
      inwardIssue?: { key: string };
      outwardIssue?: { key: string };
    }[];
    attachment?: { filename: string; content: string }[];
    comment?: {
      comments?: {
        author?: { displayName: string };
        body?: unknown;
        created?: string;
      }[];
    };
    fixVersions?: { name: string }[];
  };
}

export async function getIssue(key: string): Promise<JiraIssueDetail> {
  if (isVSCode) {
    return callExtension('GET_ISSUE', { key }) as Promise<JiraIssueDetail>;
  }
  return browserFetch<JiraIssueDetail>(`/api/issue/${key}`);
}

// ── Public Jira API — Write ───────────────────────────────────────────────────

export interface JiraTransition {
  id: string;
  name: string;
  to: string;
}

export async function getTransitions(key: string): Promise<JiraTransition[]> {
  if (!isVSCode) return [];
  return callExtension('GET_TRANSITIONS', { key }) as Promise<JiraTransition[]>;
}

export async function transitionIssue(key: string, transitionId: string, comment?: string): Promise<{ ok: true; key: string }> {
  return callExtension('TRANSITION_ISSUE', { key, transitionId, ...(comment ? { comment } : {}) }) as Promise<{ ok: true; key: string }>;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  email: string | null;
  active: boolean;
}

export async function searchUsers(query: string, maxResults?: number): Promise<JiraUser[]> {
  if (!isVSCode) return [];
  return callExtension('SEARCH_USERS', { query, ...(maxResults ? { maxResults } : {}) }) as Promise<JiraUser[]>;
}

export async function assignIssue(key: string, accountId: string | null): Promise<{ ok: true; key: string }> {
  return callExtension('ASSIGN_ISSUE', { key, accountId }) as Promise<{ ok: true; key: string }>;
}

export async function addComment(key: string, body: string): Promise<{ ok: true; key: string }> {
  return callExtension('ADD_COMMENT', { key, body }) as Promise<{ ok: true; key: string }>;
}

export async function updateIssue(key: string, updates: Record<string, unknown>): Promise<{ ok: true; key: string; url: string }> {
  return callExtension('UPDATE_ISSUE', { key, updates }) as Promise<{ ok: true; key: string; url: string }>;
}

export async function createIssue(opts: Record<string, unknown>): Promise<{ key: string; id: string; url: string }> {
  return callExtension('CREATE_ISSUE', { opts }) as Promise<{ key: string; id: string; url: string }>;
}

export interface JiraLinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
}

export async function fetchLinkTypes(): Promise<JiraLinkType[]> {
  if (!isVSCode) return [];
  return callExtension('FETCH_LINK_TYPES') as Promise<JiraLinkType[]>;
}

export async function linkIssues(sourceKey: string, targetKey: string, linkTypeName?: string): Promise<unknown> {
  return callExtension('LINK_ISSUES', { sourceKey, targetKey, ...(linkTypeName ? { linkTypeName } : {}) });
}
