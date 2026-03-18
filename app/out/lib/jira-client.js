"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISSUE_DETAIL_FIELDS = exports.ISSUE_LIST_FIELDS = void 0;
exports.jiraFetch = jiraFetch;
exports.confluenceFetch = confluenceFetch;
exports.formatIssueSummary = formatIssueSummary;
exports.adfToText = adfToText;
exports.fetchProjects = fetchProjects;
exports.fetchIssuesByJQL = fetchIssuesByJQL;
exports.fetchIssueDetail = fetchIssueDetail;
exports.fetchIssueRaw = fetchIssueRaw;
exports.fetchIssuesForProject = fetchIssuesForProject;
exports.getTransitions = getTransitions;
exports.transitionIssue = transitionIssue;
exports.assignIssue = assignIssue;
exports.searchUsers = searchUsers;
exports.addComment = addComment;
exports.createIssue = createIssue;
exports.updateIssue = updateIssue;
exports.fetchBoards = fetchBoards;
exports.fetchSprints = fetchSprints;
exports.fetchSprintIssues = fetchSprintIssues;
exports.createSprint = createSprint;
exports.updateSprint = updateSprint;
exports.deleteSprint = deleteSprint;
exports.moveIssuesToSprint = moveIssuesToSprint;
exports.moveIssuesToBacklog = moveIssuesToBacklog;
exports.rankIssues = rankIssues;
exports.fetchLinkTypes = fetchLinkTypes;
exports.linkIssues = linkIssues;
exports.fetchProjectWithIssueTypes = fetchProjectWithIssueTypes;
exports.bulkMoveIssues = bulkMoveIssues;
const md_to_adf_1 = __importDefault(require("md-to-adf"));
// ── Authenticated fetch wrappers ─────────────────────────────────────────────
async function jiraFetch(creds, path, opts = {}) {
    const auth = Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
    const res = await fetch(`https://${creds.domain}${path}`, {
        ...opts,
        headers: {
            Accept: 'application/json',
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...(opts.headers ?? {}),
        },
    });
    const text = await res.text();
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const parsed = JSON.parse(text);
            msg = parsed.errorMessages?.[0] ?? parsed.message ?? text;
        }
        catch { /* use default msg */ }
        throw new Error(msg);
    }
    return text ? JSON.parse(text) : null;
}
async function confluenceFetch(creds, path, opts = {}) {
    const auth = Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
    const res = await fetch(`https://${creds.domain}/wiki${path}`, {
        ...opts,
        headers: {
            Accept: 'application/json',
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...(opts.headers ?? {}),
        },
    });
    const text = await res.text();
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const parsed = JSON.parse(text);
            msg = parsed.message ?? text;
        }
        catch { /* use default msg */ }
        throw new Error(msg);
    }
    return text ? JSON.parse(text) : null;
}
// ── Field constants ──────────────────────────────────────────────────────────
exports.ISSUE_LIST_FIELDS = [
    'summary', 'status', 'assignee', 'issuetype', 'priority',
    'created', 'updated', 'labels', 'fixVersions',
];
exports.ISSUE_DETAIL_FIELDS = [
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
function formatIssueSummary(issue) {
    const f = issue.fields ?? {};
    return {
        key: issue.key,
        summary: f.summary ?? '',
        status: f.status?.name ?? '',
        assignee: f.assignee?.displayName ?? 'Unassigned',
        issuetype: f.issuetype?.name ?? '',
        priority: f.priority?.name ?? '',
        created: f.created?.slice(0, 10) ?? '',
        updated: f.updated?.slice(0, 10) ?? '',
        labels: f.labels ?? [],
        fixVersions: (f.fixVersions ?? []).map((v) => v.name),
    };
}
function adfToText(node) {
    if (!node || typeof node !== 'object')
        return '';
    const n = node;
    if (n.type === 'inlineCard') {
        const url = n.attrs?.url ?? '';
        return url.match(/browse\/([\w]+-\d+)/)?.[1] ?? url;
    }
    if (n.type === 'text' && typeof n.text === 'string') {
        const linkMark = n.marks?.find((m) => m.type === 'link');
        if (linkMark?.attrs?.href)
            return `[${n.text}](${linkMark.attrs.href})`;
        return n.text;
    }
    if (Array.isArray(n.content))
        return n.content.map(adfToText).join('');
    return '';
}
/* eslint-enable @typescript-eslint/no-explicit-any */
// ── Jira REST API v3 ─────────────────────────────────────────────────────────
async function fetchProjects(creds) {
    let raw = await jiraFetch(creds, '/rest/api/3/project');
    if (!Array.isArray(raw) || raw.length === 0) {
        const search = await jiraFetch(creds, '/rest/api/3/project/search?maxResults=100');
        raw = search.values ?? [];
    }
    return raw.map(p => ({ key: p.key, name: p.name }));
}
async function fetchIssuesByJQL(creds, jql, maxResults = 50, fields = exports.ISSUE_LIST_FIELDS) {
    let data;
    try {
        data = await jiraFetch(creds, '/rest/api/3/search/jql', {
            method: 'POST',
            body: JSON.stringify({ jql, fields, maxResults }),
        });
    }
    catch (e) {
        const msg = (e.message ?? '').toLowerCase();
        if (msg.includes('removed') || msg.includes('deprecated') || msg.includes('404')) {
            data = await jiraFetch(creds, '/rest/api/3/search', {
                method: 'POST',
                body: JSON.stringify({ jql, fields, maxResults, startAt: 0 }),
            });
        }
        else {
            throw e;
        }
    }
    return (data?.issues ?? []).map(formatIssueSummary);
}
async function fetchIssueDetail(creds, key) {
    const fields = exports.ISSUE_DETAIL_FIELDS.join(',');
    const data = await jiraFetch(creds, `/rest/api/3/issue/${key}?fields=${fields}`);
    if (!data)
        throw new Error(`Issue ${key} not found`);
    const f = data.fields ?? {};
    const sprints = f.customfield_10020;
    return {
        key: data.key,
        summary: f.summary ?? '',
        status: f.status?.name ?? '',
        issuetype: f.issuetype?.name ?? '',
        priority: f.priority?.name ?? '',
        assignee: f.assignee?.displayName ?? 'Unassigned',
        reporter: f.reporter?.displayName ?? '',
        created: f.created?.slice(0, 10) ?? '',
        updated: f.updated?.slice(0, 10) ?? '',
        duedate: f.duedate ?? null,
        story_points: f.customfield_10016 ?? null,
        labels: f.labels ?? [],
        fixVersions: (f.fixVersions ?? []).map(v => v.name),
        components: (f.components ?? []).map(c => c.name),
        resolution: f.resolution?.name ?? null,
        resolutiondate: f.resolutiondate?.slice(0, 10) ?? null,
        timetracking: f.timetracking
            ? {
                original: f.timetracking.originalEstimate ?? null,
                remaining: f.timetracking.remainingEstimate ?? null,
                spent: f.timetracking.timeSpent ?? null,
            }
            : null,
        attachments: (f.attachment ?? []).map(a => ({
            filename: a.filename,
            url: a.content,
            mimeType: a.mimeType,
            size: a.size,
        })),
        sprint: (() => {
            if (!Array.isArray(sprints) || sprints.length === 0)
                return null;
            const s = sprints[sprints.length - 1];
            return {
                id: s.id,
                name: s.name,
                state: s.state,
                startDate: s.startDate?.slice(0, 10) ?? null,
                endDate: s.endDate?.slice(0, 10) ?? null,
            };
        })(),
        description: adfToText(f.description),
        subtasks: (f.subtasks ?? []).map(st => ({
            key: st.key,
            summary: st.fields?.summary ?? '',
            status: st.fields?.status?.name ?? '',
        })),
        issuelinks: (f.issuelinks ?? []).map(l => ({
            type: l.type?.name ?? '',
            issue: (l.inwardIssue ?? l.outwardIssue)?.key ?? '',
        })),
        comments: (f.comment?.comments ?? []).map(c => ({
            author: c.author?.displayName ?? '',
            created: c.created?.slice(0, 10) ?? '',
            body: adfToText(c.body),
        })),
    };
}
/**
 * Return the raw issue data for the webview (preserves ADF structure for
 * client-side rendering). Used by extension.ts GET_ISSUE handler.
 */
async function fetchIssueRaw(creds, key) {
    const fields = [
        'summary', 'description', 'status', 'priority', 'issuetype',
        'assignee', 'reporter', 'created', 'updated', 'duedate',
        'labels', 'fixVersions', 'subtasks', 'issuelinks', 'attachment',
        'comment', 'customfield_10016', 'customfield_10020', 'parent',
    ].join(',');
    const data = await jiraFetch(creds, `/rest/api/3/issue/${key}?fields=${fields}`);
    const f = data?.fields ?? {};
    return {
        ...data,
        fields: {
            ...f,
            story_points: f['customfield_10016'] ?? null,
            sprint: f['customfield_10020'] ?? null,
            epic: f['parent']
                ? { key: f['parent'].key, fields: f['parent'].fields }
                : null,
        },
    };
}
async function fetchIssuesForProject(creds, project, jql) {
    const baseJql = jql ? `project = ${project} AND ${jql}` : `project = ${project}`;
    const fields = exports.ISSUE_LIST_FIELDS;
    const body = { jql: baseJql, fields, maxResults: 100 };
    let data;
    try {
        data = await jiraFetch(creds, '/rest/api/3/search/jql', {
            method: 'POST', body: JSON.stringify(body),
        });
    }
    catch (e) {
        const msg = (e.message ?? '').toLowerCase();
        if (msg.includes('removed') || msg.includes('deprecated') || msg.includes('404')) {
            data = await jiraFetch(creds, '/rest/api/3/search', {
                method: 'POST', body: JSON.stringify({ ...body, startAt: 0 }),
            });
        }
        else {
            throw e;
        }
    }
    return { issues: data?.issues ?? [] };
}
// ── Write operations ─────────────────────────────────────────────────────────
async function getTransitions(creds, key) {
    const data = await jiraFetch(creds, `/rest/api/3/issue/${key}/transitions`);
    return (data?.transitions ?? []).map(t => ({ id: t.id, name: t.name, to: t.to?.name ?? '' }));
}
async function transitionIssue(creds, key, transitionId, comment) {
    const payload = { transition: { id: transitionId } };
    if (comment) {
        payload.update = {
            comment: [{ add: { body: (0, md_to_adf_1.default)(comment) } }],
        };
    }
    await jiraFetch(creds, `/rest/api/3/issue/${key}/transitions`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return { ok: true, key };
}
async function assignIssue(creds, key, accountId) {
    await jiraFetch(creds, `/rest/api/3/issue/${key}/assignee`, {
        method: 'PUT',
        body: JSON.stringify({ accountId: accountId ?? null }),
    });
    return { ok: true, key };
}
async function searchUsers(creds, query, maxResults = 10) {
    const data = await jiraFetch(creds, `/rest/api/3/user/search?query=${encodeURIComponent(query)}&maxResults=${maxResults}`);
    return (data ?? []).map(u => ({
        accountId: u.accountId,
        displayName: u.displayName,
        email: u.emailAddress ?? null,
        active: u.active,
    }));
}
async function addComment(creds, key, bodyMarkdown) {
    await jiraFetch(creds, `/rest/api/3/issue/${key}/comment`, {
        method: 'POST',
        body: JSON.stringify({ body: (0, md_to_adf_1.default)(bodyMarkdown) }),
    });
    return { ok: true, key };
}
async function createIssue(creds, opts) {
    const fields = {
        project: { key: opts.project },
        summary: opts.summary,
        issuetype: { name: opts.issuetype },
    };
    if (opts.description)
        fields.description = (0, md_to_adf_1.default)(opts.description);
    if (opts.assignee !== undefined)
        fields.assignee = opts.assignee ? { accountId: opts.assignee } : null;
    if (opts.priority)
        fields.priority = { name: opts.priority };
    if (opts.labels?.length)
        fields.labels = opts.labels;
    if (opts.parent)
        fields.parent = { key: opts.parent };
    if (opts.story_points != null)
        fields.story_points = opts.story_points;
    const data = await jiraFetch(creds, '/rest/api/3/issue', {
        method: 'POST',
        body: JSON.stringify({ fields }),
    });
    return { key: data.key, id: data.id, url: `https://${creds.domain}/browse/${data.key}` };
}
async function updateIssue(creds, key, updates) {
    const fields = {};
    if (updates.summary !== undefined)
        fields.summary = updates.summary;
    if (updates.issuetype !== undefined) {
        const editmeta = await jiraFetch(creds, `/rest/api/3/issue/${key}/editmeta`);
        const allowed = editmeta?.fields?.issuetype?.allowedValues ?? [];
        const match = allowed.find(a => a.name.toLowerCase() === updates.issuetype.toLowerCase());
        if (!match) {
            throw new Error(`Issue type "${updates.issuetype}" not allowed. Allowed: ${allowed.map(a => a.name).join(', ') || 'none'}`);
        }
        fields.issuetype = { id: match.id };
    }
    if (updates.description !== undefined)
        fields.description = (0, md_to_adf_1.default)(updates.description);
    if (updates.assignee !== undefined)
        fields.assignee = updates.assignee ? { accountId: updates.assignee } : null;
    if (updates.priority !== undefined)
        fields.priority = { name: updates.priority };
    if (updates.labels !== undefined)
        fields.labels = updates.labels;
    if (updates.parent !== undefined)
        fields.parent = { key: updates.parent };
    if (updates.story_points !== undefined)
        fields.story_points = updates.story_points;
    await jiraFetch(creds, `/rest/api/3/issue/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
    });
    return { ok: true, key, url: `https://${creds.domain}/browse/${key}` };
}
// ── Agile API v1 ─────────────────────────────────────────────────────────────
async function fetchBoards(creds, projectKey) {
    const data = await jiraFetch(creds, `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}`);
    return (data?.values ?? []).map(b => ({ id: b.id, name: b.name, type: b.type }));
}
async function fetchSprints(creds, boardId, state) {
    const stateParam = state ? `&state=${state}` : '';
    const data = await jiraFetch(creds, `/rest/agile/1.0/board/${boardId}/sprint?maxResults=50${stateParam}`);
    return (data?.values ?? []).map(s => ({
        id: s.id,
        name: s.name,
        state: s.state,
        startDate: s.startDate?.slice(0, 10) ?? null,
        endDate: s.endDate?.slice(0, 10) ?? null,
        completeDate: s.completeDate?.slice(0, 10) ?? null,
        goal: s.goal ?? '',
    }));
}
async function fetchSprintIssues(creds, sprintId, maxResults = 50) {
    const data = await jiraFetch(creds, `/rest/agile/1.0/sprint/${sprintId}/issue?fields=${exports.ISSUE_LIST_FIELDS.join(',')}&maxResults=${maxResults}`);
    return (data?.issues ?? []).map(formatIssueSummary);
}
async function createSprint(creds, boardId, opts) {
    const body = { name: opts.name, originBoardId: boardId };
    if (opts.startDate)
        body.startDate = opts.startDate;
    if (opts.endDate)
        body.endDate = opts.endDate;
    if (opts.goal)
        body.goal = opts.goal;
    const data = await jiraFetch(creds, '/rest/agile/1.0/sprint', {
        method: 'POST', body: JSON.stringify(body),
    });
    return {
        id: data.id, name: data.name, state: data.state,
        startDate: data.startDate?.slice(0, 10) ?? null,
        endDate: data.endDate?.slice(0, 10) ?? null,
        goal: data.goal ?? '',
    };
}
async function updateSprint(creds, sprintId, fields) {
    const body = {};
    if (fields.name !== undefined)
        body.name = fields.name;
    if (fields.startDate !== undefined)
        body.startDate = fields.startDate;
    if (fields.endDate !== undefined)
        body.endDate = fields.endDate;
    if (fields.goal !== undefined)
        body.goal = fields.goal;
    if (fields.state !== undefined)
        body.state = fields.state;
    const data = await jiraFetch(creds, `/rest/agile/1.0/sprint/${sprintId}`, {
        method: 'PUT', body: JSON.stringify(body),
    });
    return {
        id: data.id, name: data.name, state: data.state,
        startDate: data.startDate?.slice(0, 10) ?? null,
        endDate: data.endDate?.slice(0, 10) ?? null,
        completeDate: data.completeDate?.slice(0, 10) ?? null,
        goal: data.goal ?? '',
    };
}
async function deleteSprint(creds, sprintId) {
    await jiraFetch(creds, `/rest/agile/1.0/sprint/${sprintId}`, { method: 'DELETE' });
    return { ok: true };
}
async function moveIssuesToSprint(creds, sprintId, issueKeys) {
    await jiraFetch(creds, `/rest/agile/1.0/sprint/${sprintId}/issue`, {
        method: 'POST', body: JSON.stringify({ issues: issueKeys }),
    });
    return { ok: true, sprintId, moved: issueKeys.length };
}
async function moveIssuesToBacklog(creds, issueKeys) {
    await jiraFetch(creds, '/rest/agile/1.0/backlog/issue', {
        method: 'POST', body: JSON.stringify({ issues: issueKeys }),
    });
    return { ok: true, moved: issueKeys.length };
}
async function rankIssues(creds, issueKeys, opts) {
    const body = { issues: issueKeys };
    if (opts.rankBeforeIssue)
        body.rankBeforeIssue = opts.rankBeforeIssue;
    else if (opts.rankAfterIssue)
        body.rankAfterIssue = opts.rankAfterIssue;
    else
        throw new Error('Either rankBeforeIssue or rankAfterIssue is required');
    await jiraFetch(creds, '/rest/agile/1.0/issue/rank', {
        method: 'PUT', body: JSON.stringify(body),
    });
    return { ok: true, ranked: issueKeys.length };
}
// ── Issue links ──────────────────────────────────────────────────────────────
async function fetchLinkTypes(creds) {
    const data = await jiraFetch(creds, '/rest/api/3/issueLinkType');
    return (data?.issueLinkTypes ?? []).map(lt => ({
        id: lt.id, name: lt.name, inward: lt.inward, outward: lt.outward,
    }));
}
async function linkIssues(creds, sourceKey, targetKey, linkTypeName = 'Relates') {
    await jiraFetch(creds, '/rest/api/3/issueLink', {
        method: 'POST',
        body: JSON.stringify({
            type: { name: linkTypeName },
            inwardIssue: { key: targetKey },
            outwardIssue: { key: sourceKey },
        }),
    });
    return { ok: true, outward: sourceKey, type: linkTypeName, inward: targetKey };
}
// ── Project helpers ──────────────────────────────────────────────────────────
async function fetchProjectWithIssueTypes(creds, projectKey) {
    const data = await jiraFetch(creds, `/rest/api/3/project/${encodeURIComponent(projectKey)}`);
    return {
        id: data.id, key: data.key, name: data.name,
        issueTypes: (data.issueTypes ?? []).map(it => ({ id: it.id, name: it.name })),
    };
}
async function bulkMoveIssues(creds, sourceProject, targetProject, jql) {
    const resolvedJql = jql ?? `project = ${sourceProject} AND issuetype in (Epic, Task) ORDER BY key ASC`;
    const data = await jiraFetch(creds, '/rest/api/3/search/jql', {
        method: 'POST',
        body: JSON.stringify({ jql: resolvedJql, fields: ['summary', 'issuetype'], maxResults: 1000 }),
    });
    const issues = (data?.issues ?? []).map(i => ({
        key: i.key,
        issuetype: i.fields?.issuetype?.name ?? '',
    }));
    if (issues.length === 0)
        return { ok: true, moved: 0, message: 'No issues to move' };
    const targetProjectData = await fetchProjectWithIssueTypes(creds, targetProject);
    const typeByName = Object.fromEntries(targetProjectData.issueTypes.map(it => [it.name, it.id]));
    const byType = {};
    for (const issue of issues) {
        if (!typeByName[issue.issuetype]) {
            throw new Error(`Target project ${targetProject} has no issue type "${issue.issuetype}". ` +
                `Available: ${targetProjectData.issueTypes.map(it => it.name).join(', ')}`);
        }
        if (!byType[issue.issuetype])
            byType[issue.issuetype] = [];
        byType[issue.issuetype].push(issue.key);
    }
    const targetToSourcesMapping = {};
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
    });
    const taskId = moveRes?.taskId;
    if (!taskId)
        throw new Error('Bulk move did not return taskId');
    const maxAttempts = 60;
    const pollIntervalMs = 2000;
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, pollIntervalMs));
        const progress = await jiraFetch(creds, `/rest/api/3/bulk/queue/${taskId}`);
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
//# sourceMappingURL=jira-client.js.map