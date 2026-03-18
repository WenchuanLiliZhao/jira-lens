/**
 * @file lib/jira-client.ts
 * @description Shared Jira & Confluence API client (vscode-agnostic).
 *
 * Ported from jira-mcp's lib/jira-client.js with full TypeScript types.
 * All functions receive credentials as arguments — never import from `vscode`.
 * This allows three consumers to share the same code:
 *   1. Extension host (credentials from SecretStorage)
 *   2. MCP server     (credentials from env vars or IPC)
 *   3. CLI scripts    (credentials from env vars)
 */

import markdownToAdf from 'md-to-adf';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Credentials {
  domain: string;
  email: string;
  token: string;
}

export interface IssueSummary {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  issuetype: string;
  priority: string;
  created: string;
  updated: string;
  labels: string[];
  fixVersions: string[];
}

export interface IssueDetail {
  key: string;
  summary: string;
  status: string;
  issuetype: string;
  priority: string;
  assignee: string;
  reporter: string;
  created: string;
  updated: string;
  duedate: string | null;
  story_points: number | null;
  labels: string[];
  fixVersions: string[];
  components: string[];
  resolution: string | null;
  resolutiondate: string | null;
  timetracking: { original: string | null; remaining: string | null; spent: string | null } | null;
  attachments: { filename: string; url: string; mimeType: string; size: number }[];
  sprint: { id: number; name: string; state: string; startDate: string | null; endDate: string | null } | null;
  description: string;
  subtasks: { key: string; summary: string; status: string }[];
  issuelinks: { type: string; issue: string }[];
  comments: { author: string; created: string; body: string }[];
}

export interface Board {
  id: number;
  name: string;
  type: string;
}

export interface Sprint {
  id: number;
  name: string;
  state: string;
  startDate: string | null;
  endDate: string | null;
  completeDate?: string | null;
  goal: string;
}

export interface Transition {
  id: string;
  name: string;
  to: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  email: string | null;
  active: boolean;
}

export interface LinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
}

export interface ProjectWithIssueTypes {
  id: string;
  key: string;
  name: string;
  issueTypes: { id: string; name: string }[];
}

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  type: string;
}

export interface ConfluencePage {
  id: string;
  title: string;
  spaceId: string;
  url: string;
  body?: string;
  version?: number;
}

// ── Authenticated fetch wrappers ─────────────────────────────────────────────

export async function jiraFetch(creds: Credentials, path: string, opts: RequestInit = {}): Promise<unknown> {
  const auth = Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
  const res = await fetch(`https://${creds.domain}${path}`, {
    ...opts,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...(opts.headers as Record<string, string> ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { errorMessages?: string[]; message?: string };
      msg = parsed.errorMessages?.[0] ?? parsed.message ?? text;
    } catch { /* use default msg */ }
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : null;
}

export async function confluenceFetch(creds: Credentials, path: string, opts: RequestInit = {}): Promise<unknown> {
  const auth = Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
  const res = await fetch(`https://${creds.domain}/wiki${path}`, {
    ...opts,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...(opts.headers as Record<string, string> ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      msg = parsed.message ?? text;
    } catch { /* use default msg */ }
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : null;
}

// ── Field constants ──────────────────────────────────────────────────────────

export const ISSUE_LIST_FIELDS = [
  'summary', 'status', 'assignee', 'issuetype', 'priority',
  'created', 'updated', 'labels', 'fixVersions',
];

export const ISSUE_DETAIL_FIELDS = [
  'summary', 'description', 'status', 'priority', 'issuetype',
  'assignee', 'reporter', 'created', 'updated', 'duedate',
  'labels', 'fixVersions', 'components',
  'resolution', 'resolutiondate',
  'timetracking', 'attachment',
  'subtasks', 'issuelinks', 'comment',
  'customfield_10016', 'customfield_10020', 'parent',
];

// ── Data formatters ──────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

export function formatIssueSummary(issue: any): IssueSummary {
  const f = issue.fields ?? {};
  return {
    key:         issue.key,
    summary:     f.summary ?? '',
    status:      f.status?.name ?? '',
    assignee:    f.assignee?.displayName ?? 'Unassigned',
    issuetype:   f.issuetype?.name ?? '',
    priority:    f.priority?.name ?? '',
    created:     f.created?.slice(0, 10) ?? '',
    updated:     f.updated?.slice(0, 10) ?? '',
    labels:      f.labels ?? [],
    fixVersions: (f.fixVersions ?? []).map((v: any) => v.name),
  };
}

export function adfToText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as { type?: string; text?: string; content?: unknown[]; attrs?: any; marks?: any[] };
  if (n.type === 'inlineCard') {
    const url: string = n.attrs?.url ?? '';
    return url.match(/browse\/([\w]+-\d+)/)?.[1] ?? url;
  }
  if (n.type === 'text' && typeof n.text === 'string') {
    const linkMark = n.marks?.find((m: any) => m.type === 'link');
    if (linkMark?.attrs?.href) return `[${n.text}](${linkMark.attrs.href})`;
    return n.text;
  }
  if (Array.isArray(n.content)) return n.content.map(adfToText).join('');
  return '';
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Jira REST API v3 ─────────────────────────────────────────────────────────

export async function fetchProjects(creds: Credentials): Promise<{ key: string; name: string }[]> {
  let raw = await jiraFetch(creds, '/rest/api/3/project') as { key: string; name: string }[];
  if (!Array.isArray(raw) || raw.length === 0) {
    const search = await jiraFetch(creds, '/rest/api/3/project/search?maxResults=100') as { values?: { key: string; name: string }[] };
    raw = search.values ?? [];
  }
  return raw.map(p => ({ key: p.key, name: p.name }));
}

export async function fetchIssuesByJQL(
  creds: Credentials, jql: string, maxResults = 50, fields: string[] = ISSUE_LIST_FIELDS
): Promise<IssueSummary[]> {
  let data: { issues?: unknown[] };
  try {
    data = await jiraFetch(creds, '/rest/api/3/search/jql', {
      method: 'POST',
      body: JSON.stringify({ jql, fields, maxResults }),
    }) as { issues?: unknown[] };
  } catch (e) {
    const msg = ((e as Error).message ?? '').toLowerCase();
    if (msg.includes('removed') || msg.includes('deprecated') || msg.includes('404')) {
      data = await jiraFetch(creds, '/rest/api/3/search', {
        method: 'POST',
        body: JSON.stringify({ jql, fields, maxResults, startAt: 0 }),
      }) as { issues?: unknown[] };
    } else {
      throw e;
    }
  }
  return (data?.issues ?? []).map(formatIssueSummary);
}

export async function fetchIssueDetail(creds: Credentials, key: string): Promise<IssueDetail> {
  const fields = ISSUE_DETAIL_FIELDS.join(',');
  const data = await jiraFetch(creds, `/rest/api/3/issue/${key}?fields=${fields}`) as {
    key: string;
    fields: Record<string, unknown>;
  };
  if (!data) throw new Error(`Issue ${key} not found`);
  const f = data.fields ?? {};
  const sprints = f.customfield_10020 as { id: number; name: string; state: string; startDate?: string; endDate?: string }[] | null;
  return {
    key:            data.key,
    summary:        (f.summary as string) ?? '',
    status:         (f.status as { name: string })?.name ?? '',
    issuetype:      (f.issuetype as { name: string })?.name ?? '',
    priority:       (f.priority as { name: string })?.name ?? '',
    assignee:       (f.assignee as { displayName: string })?.displayName ?? 'Unassigned',
    reporter:       (f.reporter as { displayName: string })?.displayName ?? '',
    created:        (f.created as string)?.slice(0, 10) ?? '',
    updated:        (f.updated as string)?.slice(0, 10) ?? '',
    duedate:        (f.duedate as string) ?? null,
    story_points:   (f.customfield_10016 as number) ?? null,
    labels:         (f.labels as string[]) ?? [],
    fixVersions:    ((f.fixVersions ?? []) as { name: string }[]).map(v => v.name),
    components:     ((f.components ?? []) as { name: string }[]).map(c => c.name),
    resolution:     (f.resolution as { name: string })?.name ?? null,
    resolutiondate: (f.resolutiondate as string)?.slice(0, 10) ?? null,
    timetracking:   f.timetracking
      ? {
          original:  (f.timetracking as Record<string, string>).originalEstimate ?? null,
          remaining: (f.timetracking as Record<string, string>).remainingEstimate ?? null,
          spent:     (f.timetracking as Record<string, string>).timeSpent ?? null,
        }
      : null,
    attachments: ((f.attachment ?? []) as { filename: string; content: string; mimeType: string; size: number }[]).map(a => ({
      filename: a.filename,
      url:      a.content,
      mimeType: a.mimeType,
      size:     a.size,
    })),
    sprint: (() => {
      if (!Array.isArray(sprints) || sprints.length === 0) return null;
      const s = sprints[sprints.length - 1];
      return {
        id:        s.id,
        name:      s.name,
        state:     s.state,
        startDate: s.startDate?.slice(0, 10) ?? null,
        endDate:   s.endDate?.slice(0, 10) ?? null,
      };
    })(),
    description:  adfToText(f.description),
    subtasks: ((f.subtasks ?? []) as { key: string; fields?: { summary?: string; status?: { name?: string } } }[]).map(st => ({
      key:     st.key,
      summary: st.fields?.summary ?? '',
      status:  st.fields?.status?.name ?? '',
    })),
    issuelinks: ((f.issuelinks ?? []) as { type?: { name?: string }; inwardIssue?: { key: string }; outwardIssue?: { key: string } }[]).map(l => ({
      type:  l.type?.name ?? '',
      issue: (l.inwardIssue ?? l.outwardIssue)?.key ?? '',
    })),
    comments: ((f.comment as { comments?: { author?: { displayName?: string }; created?: string; body?: unknown }[] })?.comments ?? []).map(c => ({
      author:  c.author?.displayName ?? '',
      created: c.created?.slice(0, 10) ?? '',
      body:    adfToText(c.body),
    })),
  };
}

/**
 * Return the raw issue data for the webview (preserves ADF structure for
 * client-side rendering). Used by extension.ts GET_ISSUE handler.
 */
export async function fetchIssueRaw(creds: Credentials, key: string): Promise<unknown> {
  const fields = [
    'summary', 'description', 'status', 'priority', 'issuetype',
    'assignee', 'reporter', 'created', 'updated', 'duedate',
    'labels', 'fixVersions', 'subtasks', 'issuelinks', 'attachment',
    'comment', 'customfield_10016', 'customfield_10020', 'parent',
  ].join(',');
  const data = await jiraFetch(creds, `/rest/api/3/issue/${key}?fields=${fields}`) as {
    fields?: Record<string, unknown>;
    [k: string]: unknown;
  };
  const f = data?.fields ?? {};
  return {
    ...data,
    fields: {
      ...f,
      story_points: f['customfield_10016'] ?? null,
      sprint: f['customfield_10020'] ?? null,
      epic: f['parent']
        ? { key: (f['parent'] as { key: string }).key, fields: (f['parent'] as { fields?: unknown }).fields }
        : null,
    },
  };
}

export async function fetchIssuesForProject(
  creds: Credentials, project: string, jql?: string
): Promise<{ issues: unknown[] }> {
  const baseJql = jql ? `project = ${project} AND ${jql}` : `project = ${project}`;
  const fields = ISSUE_LIST_FIELDS;
  const body = { jql: baseJql, fields, maxResults: 100 };

  let data: { issues?: unknown[] };
  try {
    data = await jiraFetch(creds, '/rest/api/3/search/jql', {
      method: 'POST', body: JSON.stringify(body),
    }) as { issues?: unknown[] };
  } catch (e) {
    const msg = ((e as Error).message ?? '').toLowerCase();
    if (msg.includes('removed') || msg.includes('deprecated') || msg.includes('404')) {
      data = await jiraFetch(creds, '/rest/api/3/search', {
        method: 'POST', body: JSON.stringify({ ...body, startAt: 0 }),
      }) as { issues?: unknown[] };
    } else {
      throw e;
    }
  }
  return { issues: data?.issues ?? [] };
}

// ── Write operations ─────────────────────────────────────────────────────────

export async function getTransitions(creds: Credentials, key: string): Promise<Transition[]> {
  const data = await jiraFetch(creds, `/rest/api/3/issue/${key}/transitions`) as {
    transitions?: { id: string; name: string; to?: { name: string } }[];
  };
  return (data?.transitions ?? []).map(t => ({ id: t.id, name: t.name, to: t.to?.name ?? '' }));
}

export async function transitionIssue(
  creds: Credentials, key: string, transitionId: string, comment?: string
): Promise<{ ok: true; key: string }> {
  const payload: Record<string, unknown> = { transition: { id: transitionId } };
  if (comment) {
    payload.update = {
      comment: [{ add: { body: markdownToAdf(comment) } }],
    };
  }
  await jiraFetch(creds, `/rest/api/3/issue/${key}/transitions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { ok: true, key };
}

export async function assignIssue(
  creds: Credentials, key: string, accountId: string | null
): Promise<{ ok: true; key: string }> {
  await jiraFetch(creds, `/rest/api/3/issue/${key}/assignee`, {
    method: 'PUT',
    body: JSON.stringify({ accountId: accountId ?? null }),
  });
  return { ok: true, key };
}

export async function searchUsers(
  creds: Credentials, query: string, maxResults = 10
): Promise<JiraUser[]> {
  const data = await jiraFetch(
    creds,
    `/rest/api/3/user/search?query=${encodeURIComponent(query)}&maxResults=${maxResults}`
  ) as { accountId: string; displayName: string; emailAddress?: string; active: boolean }[];
  return (data ?? []).map(u => ({
    accountId:   u.accountId,
    displayName: u.displayName,
    email:       u.emailAddress ?? null,
    active:      u.active,
  }));
}

export async function addComment(
  creds: Credentials, key: string, bodyMarkdown: string
): Promise<{ ok: true; key: string }> {
  await jiraFetch(creds, `/rest/api/3/issue/${key}/comment`, {
    method: 'POST',
    body: JSON.stringify({ body: markdownToAdf(bodyMarkdown) }),
  });
  return { ok: true, key };
}

export async function createIssue(
  creds: Credentials,
  opts: {
    project: string;
    summary: string;
    issuetype: string;
    description?: string;
    assignee?: string;
    priority?: string;
    labels?: string[];
    parent?: string;
    story_points?: number;
  }
): Promise<{ key: string; id: string; url: string }> {
  const fields: Record<string, unknown> = {
    project:   { key: opts.project },
    summary:   opts.summary,
    issuetype: { name: opts.issuetype },
  };
  if (opts.description) fields.description = markdownToAdf(opts.description);
  if (opts.assignee !== undefined) fields.assignee = opts.assignee ? { accountId: opts.assignee } : null;
  if (opts.priority) fields.priority = { name: opts.priority };
  if (opts.labels?.length) fields.labels = opts.labels;
  if (opts.parent) fields.parent = { key: opts.parent };
  if (opts.story_points != null) fields.story_points = opts.story_points;

  const data = await jiraFetch(creds, '/rest/api/3/issue', {
    method: 'POST',
    body: JSON.stringify({ fields }),
  }) as { key: string; id: string };
  return { key: data.key, id: data.id, url: `https://${creds.domain}/browse/${data.key}` };
}

export async function updateIssue(
  creds: Credentials,
  key: string,
  updates: {
    summary?: string;
    description?: string;
    issuetype?: string;
    assignee?: string | null;
    priority?: string;
    labels?: string[];
    parent?: string;
    story_points?: number;
  }
): Promise<{ ok: true; key: string; url: string }> {
  const fields: Record<string, unknown> = {};
  if (updates.summary !== undefined) fields.summary = updates.summary;
  if (updates.issuetype !== undefined) {
    const editmeta = await jiraFetch(creds, `/rest/api/3/issue/${key}/editmeta`) as {
      fields?: { issuetype?: { allowedValues?: { id: string; name: string }[] } };
    };
    const allowed = editmeta?.fields?.issuetype?.allowedValues ?? [];
    const match = allowed.find(a => a.name.toLowerCase() === updates.issuetype!.toLowerCase());
    if (!match) {
      throw new Error(
        `Issue type "${updates.issuetype}" not allowed. Allowed: ${allowed.map(a => a.name).join(', ') || 'none'}`
      );
    }
    fields.issuetype = { id: match.id };
  }
  if (updates.description !== undefined) fields.description = markdownToAdf(updates.description);
  if (updates.assignee !== undefined) fields.assignee = updates.assignee ? { accountId: updates.assignee } : null;
  if (updates.priority !== undefined) fields.priority = { name: updates.priority };
  if (updates.labels !== undefined) fields.labels = updates.labels;
  if (updates.parent !== undefined) fields.parent = { key: updates.parent };
  if (updates.story_points !== undefined) fields.story_points = updates.story_points;

  await jiraFetch(creds, `/rest/api/3/issue/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ fields }),
  });
  return { ok: true, key, url: `https://${creds.domain}/browse/${key}` };
}

// ── Agile API v1 ─────────────────────────────────────────────────────────────

export async function fetchBoards(creds: Credentials, projectKey: string): Promise<Board[]> {
  const data = await jiraFetch(
    creds, `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}`
  ) as { values?: { id: number; name: string; type: string }[] };
  return (data?.values ?? []).map(b => ({ id: b.id, name: b.name, type: b.type }));
}

export async function fetchSprints(creds: Credentials, boardId: number, state?: string): Promise<Sprint[]> {
  const stateParam = state ? `&state=${state}` : '';
  const data = await jiraFetch(
    creds, `/rest/agile/1.0/board/${boardId}/sprint?maxResults=50${stateParam}`
  ) as { values?: { id: number; name: string; state: string; startDate?: string; endDate?: string; completeDate?: string; goal?: string }[] };
  return (data?.values ?? []).map(s => ({
    id:           s.id,
    name:         s.name,
    state:        s.state,
    startDate:    s.startDate?.slice(0, 10) ?? null,
    endDate:      s.endDate?.slice(0, 10) ?? null,
    completeDate: s.completeDate?.slice(0, 10) ?? null,
    goal:         s.goal ?? '',
  }));
}

export async function fetchSprintIssues(creds: Credentials, sprintId: number, maxResults = 50): Promise<IssueSummary[]> {
  const data = await jiraFetch(
    creds, `/rest/agile/1.0/sprint/${sprintId}/issue?fields=${ISSUE_LIST_FIELDS.join(',')}&maxResults=${maxResults}`
  ) as { issues?: unknown[] };
  return (data?.issues ?? []).map(formatIssueSummary);
}

export async function createSprint(
  creds: Credentials,
  boardId: number,
  opts: { name: string; startDate?: string; endDate?: string; goal?: string }
): Promise<Sprint> {
  const body: Record<string, unknown> = { name: opts.name, originBoardId: boardId };
  if (opts.startDate) body.startDate = opts.startDate;
  if (opts.endDate) body.endDate = opts.endDate;
  if (opts.goal) body.goal = opts.goal;
  const data = await jiraFetch(creds, '/rest/agile/1.0/sprint', {
    method: 'POST', body: JSON.stringify(body),
  }) as { id: number; name: string; state: string; startDate?: string; endDate?: string; goal?: string };
  return {
    id: data.id, name: data.name, state: data.state,
    startDate: data.startDate?.slice(0, 10) ?? null,
    endDate: data.endDate?.slice(0, 10) ?? null,
    goal: data.goal ?? '',
  };
}

export async function updateSprint(
  creds: Credentials, sprintId: number, fields: Record<string, unknown>
): Promise<Sprint> {
  const body: Record<string, unknown> = {};
  if (fields.name !== undefined) body.name = fields.name;
  if (fields.startDate !== undefined) body.startDate = fields.startDate;
  if (fields.endDate !== undefined) body.endDate = fields.endDate;
  if (fields.goal !== undefined) body.goal = fields.goal;
  if (fields.state !== undefined) body.state = fields.state;
  const data = await jiraFetch(creds, `/rest/agile/1.0/sprint/${sprintId}`, {
    method: 'PUT', body: JSON.stringify(body),
  }) as { id: number; name: string; state: string; startDate?: string; endDate?: string; completeDate?: string; goal?: string };
  return {
    id: data.id, name: data.name, state: data.state,
    startDate: data.startDate?.slice(0, 10) ?? null,
    endDate: data.endDate?.slice(0, 10) ?? null,
    completeDate: data.completeDate?.slice(0, 10) ?? null,
    goal: data.goal ?? '',
  };
}

export async function deleteSprint(creds: Credentials, sprintId: number): Promise<{ ok: true }> {
  await jiraFetch(creds, `/rest/agile/1.0/sprint/${sprintId}`, { method: 'DELETE' });
  return { ok: true };
}

export async function moveIssuesToSprint(
  creds: Credentials, sprintId: number, issueKeys: string[]
): Promise<{ ok: true; sprintId: number; moved: number }> {
  await jiraFetch(creds, `/rest/agile/1.0/sprint/${sprintId}/issue`, {
    method: 'POST', body: JSON.stringify({ issues: issueKeys }),
  });
  return { ok: true, sprintId, moved: issueKeys.length };
}

export async function moveIssuesToBacklog(
  creds: Credentials, issueKeys: string[]
): Promise<{ ok: true; moved: number }> {
  await jiraFetch(creds, '/rest/agile/1.0/backlog/issue', {
    method: 'POST', body: JSON.stringify({ issues: issueKeys }),
  });
  return { ok: true, moved: issueKeys.length };
}

export async function rankIssues(
  creds: Credentials,
  issueKeys: string[],
  opts: { rankBeforeIssue?: string; rankAfterIssue?: string }
): Promise<{ ok: true; ranked: number }> {
  const body: Record<string, unknown> = { issues: issueKeys };
  if (opts.rankBeforeIssue) body.rankBeforeIssue = opts.rankBeforeIssue;
  else if (opts.rankAfterIssue) body.rankAfterIssue = opts.rankAfterIssue;
  else throw new Error('Either rankBeforeIssue or rankAfterIssue is required');
  await jiraFetch(creds, '/rest/agile/1.0/issue/rank', {
    method: 'PUT', body: JSON.stringify(body),
  });
  return { ok: true, ranked: issueKeys.length };
}

// ── Issue links ──────────────────────────────────────────────────────────────

export async function fetchLinkTypes(creds: Credentials): Promise<LinkType[]> {
  const data = await jiraFetch(creds, '/rest/api/3/issueLinkType') as {
    issueLinkTypes?: { id: string; name: string; inward: string; outward: string }[];
  };
  return (data?.issueLinkTypes ?? []).map(lt => ({
    id: lt.id, name: lt.name, inward: lt.inward, outward: lt.outward,
  }));
}

export async function linkIssues(
  creds: Credentials, sourceKey: string, targetKey: string, linkTypeName = 'Relates'
): Promise<{ ok: true; outward: string; type: string; inward: string }> {
  await jiraFetch(creds, '/rest/api/3/issueLink', {
    method: 'POST',
    body: JSON.stringify({
      type:         { name: linkTypeName },
      inwardIssue:  { key: targetKey },
      outwardIssue: { key: sourceKey },
    }),
  });
  return { ok: true, outward: sourceKey, type: linkTypeName, inward: targetKey };
}

// ── Project helpers ──────────────────────────────────────────────────────────

export async function fetchProjectWithIssueTypes(creds: Credentials, projectKey: string): Promise<ProjectWithIssueTypes> {
  const data = await jiraFetch(creds, `/rest/api/3/project/${encodeURIComponent(projectKey)}`) as {
    id: string; key: string; name: string; issueTypes?: { id: string; name: string }[];
  };
  return {
    id: data.id, key: data.key, name: data.name,
    issueTypes: (data.issueTypes ?? []).map(it => ({ id: it.id, name: it.name })),
  };
}

export async function bulkMoveIssues(
  creds: Credentials, sourceProject: string, targetProject: string, jql?: string
): Promise<{ ok: true; moved: number; taskId?: string; progressPercent?: number; invalidOrInaccessibleIssueCount?: number; message?: string }> {
  const resolvedJql = jql ?? `project = ${sourceProject} AND issuetype in (Epic, Task) ORDER BY key ASC`;
  const data = await jiraFetch(creds, '/rest/api/3/search/jql', {
    method: 'POST',
    body: JSON.stringify({ jql: resolvedJql, fields: ['summary', 'issuetype'], maxResults: 1000 }),
  }) as { issues?: { key: string; fields?: { issuetype?: { name?: string } } }[] };
  const issues = (data?.issues ?? []).map(i => ({
    key: i.key,
    issuetype: i.fields?.issuetype?.name ?? '',
  }));
  if (issues.length === 0) return { ok: true, moved: 0, message: 'No issues to move' };

  const targetProjectData = await fetchProjectWithIssueTypes(creds, targetProject);
  const typeByName = Object.fromEntries(
    targetProjectData.issueTypes.map(it => [it.name, it.id])
  );

  const byType: Record<string, string[]> = {};
  for (const issue of issues) {
    if (!typeByName[issue.issuetype]) {
      throw new Error(
        `Target project ${targetProject} has no issue type "${issue.issuetype}". ` +
        `Available: ${targetProjectData.issueTypes.map(it => it.name).join(', ')}`
      );
    }
    if (!byType[issue.issuetype]) byType[issue.issuetype] = [];
    byType[issue.issuetype].push(issue.key);
  }

  const targetToSourcesMapping: Record<string, unknown> = {};
  for (const [typeName, keys] of Object.entries(byType)) {
    const targetKey = `${targetProject},${typeByName[typeName]}`;
    targetToSourcesMapping[targetKey] = {
      issueIdsOrKeys: keys,
      inferFieldDefaults: true,
      inferStatusDefaults: true,
      inferClassificationDefaults: true,
      inferSubtaskTypeDefault: true,
    };
  }

  const moveRes = await jiraFetch(creds, '/rest/api/3/bulk/issues/move', {
    method: 'POST',
    body: JSON.stringify({ sendBulkNotification: true, targetToSourcesMapping }),
  }) as { taskId?: string };

  const taskId = moveRes?.taskId;
  if (!taskId) throw new Error('Bulk move did not return taskId');

  const maxAttempts = 60;
  const pollIntervalMs = 2000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, pollIntervalMs));
    const progress = await jiraFetch(creds, `/rest/api/3/bulk/queue/${taskId}`) as {
      status?: string; totalIssueCount?: number; progressPercent?: number;
      invalidOrInaccessibleIssueCount?: number; message?: string;
    };
    const status = progress?.status ?? '';
    if (status === 'COMPLETE') {
      return {
        ok: true,
        moved: progress.totalIssueCount ?? issues.length,
        taskId,
        progressPercent: progress.progressPercent,
        invalidOrInaccessibleIssueCount: progress.invalidOrInaccessibleIssueCount ?? 0,
      };
    }
    if (status === 'FAILED' || status === 'CANCELED') {
      throw new Error(`Bulk move ${status}: ${progress?.message ?? JSON.stringify(progress)}`);
    }
  }
  throw new Error(`Bulk move timed out after ${maxAttempts} polls`);
}
