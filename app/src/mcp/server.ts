/**
 * @file mcp/server.ts
 * @description Jira Lens MCP Server — bundled with the extension
 *
 * Exposes Jira and Confluence data as MCP tools so that AI assistants
 * (Cursor, VS Code Copilot, etc.) can query and mutate project data.
 *
 * TRANSPORT: stdio (JSON-RPC 2.0)
 *
 * CREDENTIALS (checked in order):
 *   1. Env vars JIRA_DOMAIN, JIRA_EMAIL, JIRA_TOKEN (CLI / manual use)
 *   2. JSON file at path given by JIRA_LENS_CONFIG env var (IDE-registered MCP)
 *
 * ENTRY POINT: `node out/mcp/server.js` (compiled from this file)
 */

import * as fs from 'fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  type Credentials,
  confluenceFetch,
  fetchProjects,
  fetchIssuesByJQL,
  fetchIssueDetail,
  fetchBoards,
  fetchSprints,
  fetchSprintIssues,
  createSprint,
  updateSprint,
  deleteSprint,
  moveIssuesToSprint,
  moveIssuesToBacklog,
  rankIssues,
  fetchLinkTypes,
  linkIssues,
  bulkMoveIssues,
  getTransitions,
  transitionIssue,
  assignIssue,
  searchUsers,
  addComment,
  createIssue,
  updateIssue,
} from '../lib/jira-client';

import { mdToConfluenceStorage } from '../lib/confluence';

// ── Credential loading ────────────────────────────────────────────────────────

function loadCreds(): Credentials {
  const domain = process.env.JIRA_DOMAIN ?? '';
  const email = process.env.JIRA_EMAIL ?? '';
  const token = process.env.JIRA_TOKEN ?? '';
  if (domain && email && token) {
    return { domain, email, token };
  }

  const configPath = process.env.JIRA_LENS_CONFIG;
  if (configPath && fs.existsSync(configPath)) {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
      domain?: string; email?: string; token?: string;
    };
    if (data.domain && data.email && data.token) {
      return { domain: data.domain, email: data.email, token: data.token };
    }
  }

  process.stderr.write(
    'Jira Lens MCP: Missing credentials.\n'
    + 'Set JIRA_DOMAIN, JIRA_EMAIL, JIRA_TOKEN env vars,\n'
    + 'or set JIRA_LENS_CONFIG to a JSON credential file path.\n'
  );
  process.exit(1);
}

const creds = loadCreds();

// ── Active project state (in-memory for MCP session) ─────────────────────────

let activeState: { project: string | null; boardId: number | null; boardName: string | null } = {
  project: null,
  boardId: null,
  boardName: null,
};

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'list_projects',
    description: 'List all Jira projects accessible to the current user.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'list_issues',
    description: 'List issues in a Jira project. Optionally filter with a JQL clause.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project:     { type: 'string', description: 'Jira project key, e.g. PROJ' },
        jql:         { type: 'string', description: 'Optional additional JQL' },
        max_results: { type: 'number', description: 'Max issues to return (default 50)' },
      },
      required: ['project'],
    },
  },
  {
    name: 'get_issue',
    description: 'Get full details for a single Jira issue.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        key: { type: 'string', description: 'Issue key, e.g. PROJ-1' },
      },
      required: ['key'],
    },
  },
  {
    name: 'search_issues',
    description: 'Search Jira issues using any JQL query.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        jql:         { type: 'string', description: 'JQL query string' },
        max_results: { type: 'number', description: 'Max issues to return (default 50)' },
      },
      required: ['jql'],
    },
  },
  {
    name: 'get_my_issues',
    description: 'Get all Jira issues currently assigned to the authenticated user.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        max_results: { type: 'number', description: 'Max issues to return (default 50)' },
      },
      required: [] as string[],
    },
  },
  {
    name: 'list_sprints',
    description: 'List sprints for a Jira project.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project: { type: 'string', description: 'Jira project key' },
        state:   { type: 'string', description: 'Filter: active, future, or closed' },
      },
      required: ['project'],
    },
  },
  {
    name: 'get_sprint_issues',
    description: 'Get all issues in a specific sprint.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sprint_id:   { type: 'number', description: 'Sprint ID' },
        max_results: { type: 'number', description: 'Max issues (default 50)' },
      },
      required: ['sprint_id'],
    },
  },
  {
    name: 'create_sprint',
    description: 'Create a new sprint on a board.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        board_id:   { type: 'number', description: 'Board ID' },
        name:       { type: 'string', description: 'Sprint name' },
        start_date: { type: 'string', description: 'Start date (ISO 8601)' },
        end_date:   { type: 'string', description: 'End date (ISO 8601)' },
        goal:       { type: 'string', description: 'Sprint goal' },
      },
      required: ['board_id', 'name'],
    },
  },
  {
    name: 'update_sprint',
    description: 'Update a sprint\'s name, dates, or goal.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sprint_id:  { type: 'number', description: 'Sprint ID' },
        name:       { type: 'string', description: 'New name' },
        start_date: { type: 'string', description: 'New start date' },
        end_date:   { type: 'string', description: 'New end date' },
        goal:       { type: 'string', description: 'New goal' },
      },
      required: ['sprint_id'],
    },
  },
  {
    name: 'start_sprint',
    description: 'Start a future sprint.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sprint_id:  { type: 'number', description: 'Sprint ID (must be future)' },
        start_date: { type: 'string', description: 'Start date if not set' },
        end_date:   { type: 'string', description: 'End date if not set' },
      },
      required: ['sprint_id'],
    },
  },
  {
    name: 'complete_sprint',
    description: 'Complete the active sprint.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sprint_id: { type: 'number', description: 'Sprint ID (must be active)' },
      },
      required: ['sprint_id'],
    },
  },
  {
    name: 'move_issues_to_sprint',
    description: 'Move issues into a sprint.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sprint_id:  { type: 'number', description: 'Target sprint ID' },
        issue_keys: { type: 'array', items: { type: 'string' }, description: 'Issue keys' },
      },
      required: ['sprint_id', 'issue_keys'],
    },
  },
  {
    name: 'move_issues_to_backlog',
    description: 'Move issues to backlog.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        issue_keys: { type: 'array', items: { type: 'string' }, description: 'Issue keys' },
      },
      required: ['issue_keys'],
    },
  },
  {
    name: 'delete_sprint',
    description: 'Delete a future sprint.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sprint_id: { type: 'number', description: 'Sprint ID (must be future)' },
      },
      required: ['sprint_id'],
    },
  },
  {
    name: 'rank_issues',
    description: 'Reorder issues on the board.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        issue_keys:        { type: 'array', items: { type: 'string' }, description: 'Issue keys' },
        rank_before_issue: { type: 'string', description: 'Place before this issue' },
        rank_after_issue:  { type: 'string', description: 'Place after this issue' },
      },
      required: ['issue_keys'],
    },
  },
  {
    name: 'list_link_types',
    description: 'List available issue link types.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'link_issues',
    description: 'Create a link between two issues.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        source_key:     { type: 'string', description: 'Outward issue key' },
        target_key:     { type: 'string', description: 'Inward issue key' },
        link_type_name: { type: 'string', description: 'Link type name (default: Relates)' },
      },
      required: ['source_key', 'target_key'],
    },
  },
  {
    name: 'get_active_project',
    description: 'Get the currently active project.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'set_active_project',
    description: 'Set the active project for future queries.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project:   { type: 'string', description: 'Project key' },
        boardId:   { type: 'number', description: 'Board ID (optional)' },
        boardName: { type: 'string', description: 'Board name (optional)' },
      },
      required: ['project'],
    },
  },
  {
    name: 'create_issue',
    description: 'Create a new Jira issue.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project:      { type: 'string', description: 'Project key' },
        summary:      { type: 'string', description: 'Issue title' },
        issuetype:    { type: 'string', description: 'Issue type (Task, Story, Bug, Epic)' },
        description:  { type: 'string', description: 'Description (Markdown)' },
        assignee:     { type: 'string', description: 'Assignee account ID' },
        priority:     { type: 'string', description: 'Priority name' },
        labels:       { type: 'array', items: { type: 'string' }, description: 'Labels' },
        parent:       { type: 'string', description: 'Parent issue key' },
        story_points: { type: 'number', description: 'Story points' },
      },
      required: ['project', 'summary', 'issuetype'],
    },
  },
  {
    name: 'update_issue',
    description: 'Update fields on an existing issue. Only provided fields are changed.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        key:          { type: 'string', description: 'Issue key' },
        summary:      { type: 'string', description: 'New summary' },
        description:  { type: 'string', description: 'New description (Markdown)' },
        issuetype:    { type: 'string', description: 'New issue type' },
        assignee:     { type: 'string', description: 'Assignee account ID (null to unassign)' },
        priority:     { type: 'string', description: 'Priority name' },
        labels:       { type: 'array', items: { type: 'string' }, description: 'Labels' },
        parent:       { type: 'string', description: 'Parent issue key' },
        story_points: { type: 'number', description: 'Story points' },
      },
      required: ['key'],
    },
  },
  {
    name: 'transition_issue',
    description: 'Move an issue to a new status. Call get_transitions first.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        key:           { type: 'string', description: 'Issue key' },
        transition_id: { type: 'string', description: 'Transition ID' },
        comment:       { type: 'string', description: 'Optional comment (Markdown)' },
      },
      required: ['key', 'transition_id'],
    },
  },
  {
    name: 'get_transitions',
    description: 'List available transitions for an issue.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        key: { type: 'string', description: 'Issue key' },
      },
      required: ['key'],
    },
  },
  {
    name: 'assign_issue',
    description: 'Assign or reassign an issue.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        key:        { type: 'string', description: 'Issue key' },
        account_id: { type: 'string', description: 'Assignee accountId (null to unassign)' },
      },
      required: ['key'],
    },
  },
  {
    name: 'search_users',
    description: 'Search for Jira users by name or email.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query:       { type: 'string', description: 'Name or email' },
        max_results: { type: 'number', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_comment',
    description: 'Post a comment to an issue.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        key:  { type: 'string', description: 'Issue key' },
        body: { type: 'string', description: 'Comment body (Markdown)' },
      },
      required: ['key', 'body'],
    },
  },
  {
    name: 'bulk_move_issues',
    description: 'Move multiple issues between projects.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        source_project: { type: 'string', description: 'Source project key' },
        target_project: { type: 'string', description: 'Target project key' },
        jql:            { type: 'string', description: 'Optional JQL filter' },
      },
      required: ['source_project', 'target_project'],
    },
  },
  {
    name: 'list_confluence_spaces',
    description: 'List all Confluence spaces.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'search_confluence_pages',
    description: 'Search Confluence pages.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        space_id: { type: 'string', description: 'Space ID (optional)' },
        title:    { type: 'string', description: 'Title keyword (optional)' },
        limit:    { type: 'number', description: 'Max pages (default 25)' },
      },
      required: [] as string[],
    },
  },
  {
    name: 'get_confluence_page',
    description: 'Get full content of a Confluence page.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        page_id: { type: 'string', description: 'Page ID' },
      },
      required: ['page_id'],
    },
  },
  {
    name: 'create_confluence_page',
    description: 'Create a Confluence page (body in Markdown).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        space_id:  { type: 'string', description: 'Space ID' },
        title:     { type: 'string', description: 'Page title' },
        body:      { type: 'string', description: 'Page body (Markdown)' },
        parent_id: { type: 'string', description: 'Parent page ID (optional)' },
      },
      required: ['space_id', 'title', 'body'],
    },
  },
  {
    name: 'update_confluence_page',
    description: 'Update a Confluence page (body in Markdown).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        page_id: { type: 'string', description: 'Page ID' },
        title:   { type: 'string', description: 'New title' },
        body:    { type: 'string', description: 'New body (Markdown)' },
        version: { type: 'number', description: 'Current version number' },
        status:  { type: 'string', description: 'Status: current or draft' },
      },
      required: ['page_id', 'title', 'body', 'version'],
    },
  },
];

// ── Tool handler ──────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
type Args = Record<string, any>;

async function handleTool(name: string, args: Args): Promise<unknown> {
  switch (name) {
    case 'list_projects':
      return fetchProjects(creds);

    case 'list_issues': {
      const { project, jql: extraJql, max_results } = args;
      const jql = extraJql
        ? `project = ${project} AND ${extraJql}`
        : `project = ${project} ORDER BY updated DESC`;
      return fetchIssuesByJQL(creds, jql, max_results ?? 50);
    }

    case 'get_issue':
      return fetchIssueDetail(creds, args.key);

    case 'search_issues':
      return fetchIssuesByJQL(creds, args.jql, args.max_results ?? 50);

    case 'get_my_issues':
      return fetchIssuesByJQL(creds, 'assignee = currentUser() ORDER BY updated DESC', args?.max_results ?? 50);

    case 'list_sprints': {
      const boards = await fetchBoards(creds, args.project);
      if (boards.length === 0) throw new Error(`No boards found for project ${args.project}`);
      const allSprints = await Promise.all(boards.map(b => fetchSprints(creds, b.id, args.state)));
      return { boards, sprints: allSprints.flat() };
    }

    case 'get_sprint_issues':
      return fetchSprintIssues(creds, args.sprint_id, args.max_results ?? 50);

    case 'create_sprint':
      return createSprint(creds, args.board_id, {
        name: args.name, startDate: args.start_date, endDate: args.end_date, goal: args.goal,
      });

    case 'update_sprint':
      return updateSprint(creds, args.sprint_id, {
        name: args.name, startDate: args.start_date, endDate: args.end_date, goal: args.goal,
      });

    case 'start_sprint': {
      const fields: Record<string, unknown> = { state: 'active' };
      if (args.start_date) fields.startDate = args.start_date;
      if (args.end_date) fields.endDate = args.end_date;
      return updateSprint(creds, args.sprint_id, fields);
    }

    case 'complete_sprint':
      return updateSprint(creds, args.sprint_id, { state: 'closed' });

    case 'move_issues_to_sprint':
      return moveIssuesToSprint(creds, args.sprint_id, args.issue_keys);

    case 'move_issues_to_backlog':
      return moveIssuesToBacklog(creds, args.issue_keys);

    case 'delete_sprint':
      return deleteSprint(creds, args.sprint_id);

    case 'rank_issues':
      return rankIssues(creds, args.issue_keys, {
        rankBeforeIssue: args.rank_before_issue,
        rankAfterIssue: args.rank_after_issue,
      });

    case 'list_link_types':
      return fetchLinkTypes(creds);

    case 'link_issues':
      return linkIssues(creds, args.source_key, args.target_key, args.link_type_name ?? 'Relates');

    case 'get_active_project':
      return { ...activeState, domain: creds.domain };

    case 'set_active_project': {
      const { project, boardId = null, boardName = null } = args;
      activeState = { project, boardId, boardName };
      return { ok: true, active: activeState };
    }

    case 'create_issue':
      return createIssue(creds, {
        project: args.project, summary: args.summary, issuetype: args.issuetype,
        description: args.description, assignee: args.assignee, priority: args.priority,
        labels: args.labels, parent: args.parent, story_points: args.story_points,
      });

    case 'update_issue':
      return updateIssue(creds, args.key, {
        summary: args.summary, description: args.description, issuetype: args.issuetype,
        assignee: args.assignee, priority: args.priority, labels: args.labels,
        parent: args.parent, story_points: args.story_points,
      });

    case 'get_transitions':
      return getTransitions(creds, args.key);

    case 'transition_issue':
      return transitionIssue(creds, args.key, args.transition_id, args.comment);

    case 'assign_issue':
      return assignIssue(creds, args.key, args.account_id ?? null);

    case 'search_users':
      return searchUsers(creds, args.query, args.max_results ?? 10);

    case 'add_comment':
      return addComment(creds, args.key, args.body);

    case 'bulk_move_issues':
      return bulkMoveIssues(creds, args.source_project, args.target_project, args.jql);

    case 'list_confluence_spaces': {
      const data = await confluenceFetch(creds, '/api/v2/spaces?limit=50') as { results?: { id: string; key: string; name: string; type: string }[] };
      return (data?.results ?? []).map(s => ({ id: s.id, key: s.key, name: s.name, type: s.type }));
    }

    case 'search_confluence_pages': {
      const { space_id, title, limit = 25 } = args ?? {};
      let url = `/api/v2/pages?limit=${limit}`;
      if (space_id) url += `&space-id=${space_id}`;
      if (title) url += `&title=${encodeURIComponent(title)}`;
      const data = await confluenceFetch(creds, url) as { results?: { id: string; title: string; spaceId: string; _links?: { webui?: string } }[] };
      return (data?.results ?? []).map(p => ({
        id: p.id, title: p.title, spaceId: p.spaceId,
        url: `https://${creds.domain}/wiki${p._links?.webui ?? ''}`,
      }));
    }

    case 'get_confluence_page': {
      const data = await confluenceFetch(creds, `/api/v2/pages/${args.page_id}?body-format=storage`) as {
        id: string; title: string; spaceId: string; body?: { storage?: { value?: string } };
        _links?: { webui?: string }; version?: { number: number };
      };
      return {
        id: data.id, title: data.title, spaceId: data.spaceId,
        body: data.body?.storage?.value ?? '',
        url: `https://${creds.domain}/wiki${data._links?.webui ?? ''}`,
        version: data.version?.number,
      };
    }

    case 'create_confluence_page': {
      const { space_id, title, body, parent_id } = args;
      const payload: Record<string, unknown> = {
        spaceId: space_id,
        title,
        ...(parent_id ? { parentId: parent_id } : {}),
        body: { storage: { value: mdToConfluenceStorage(body), representation: 'storage' } },
      };
      const data = await confluenceFetch(creds, '/api/v2/pages', {
        method: 'POST', body: JSON.stringify(payload),
      }) as { id: string; title: string; spaceId: string; _links?: { webui?: string }; version?: { number: number } };
      return {
        id: data.id, title: data.title, spaceId: data.spaceId,
        url: `https://${creds.domain}/wiki${data._links?.webui ?? ''}`,
        version: data.version?.number,
      };
    }

    case 'update_confluence_page': {
      const { page_id, title, body, version, status = 'current' } = args;
      const payload = {
        id: page_id, title, status,
        version: { number: version + 1 },
        body: { storage: { value: mdToConfluenceStorage(body), representation: 'storage' } },
      };
      const data = await confluenceFetch(creds, `/api/v2/pages/${page_id}`, {
        method: 'PUT', body: JSON.stringify(payload),
      }) as { id: string; title: string; _links?: { webui?: string }; version?: { number: number } };
      return {
        id: data.id, title: data.title,
        url: `https://${creds.domain}/wiki${data._links?.webui ?? ''}`,
        version: data.version?.number,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── MCP Server setup ──────────────────────────────────────────────────────────

const server = new Server(
  { name: 'jira-lens', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args ?? {});
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
