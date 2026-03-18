#!/usr/bin/env node
/**
 * CLI: query Jira issues.
 *
 * Usage:
 *   node cli/query.js [options]
 *
 *   --project <KEY>   Project key (optional)
 *   --status  <name>  Status filter (default: "Done", "all" to skip)
 *   --assignee <val>  Assignee filter (default: currentUser())
 *   --max     <n>     Max results (default: 50)
 *   --jql     <query> Raw JQL (overrides other filters)
 *   --help            Show help
 */

import { type Credentials, jiraFetch, formatIssueSummary, ISSUE_LIST_FIELDS } from '../lib/jira-client';

function loadCredsFromEnv(): Credentials {
  const domain = process.env.JIRA_DOMAIN ?? '';
  const email = process.env.JIRA_EMAIL ?? '';
  const token = process.env.JIRA_TOKEN ?? '';
  if (!domain || !email || !token) {
    console.error('Missing credentials. Set JIRA_DOMAIN, JIRA_EMAIL, JIRA_TOKEN env vars.');
    process.exit(1);
  }
  return { domain, email, token };
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--help':     args.help = true; break;
      case '--project':  args.project = argv[++i]; break;
      case '--status':   args.status = argv[++i]; break;
      case '--assignee': args.assignee = argv[++i]; break;
      case '--max':      args.max = argv[++i]; break;
      case '--jql':      args.jql = argv[++i]; break;
    }
  }
  return args;
}

const HELP = `
Usage: node cli/query.js [options]

Options:
  --project <KEY>      Jira project key
  --status  <name>     Issue status (default: Done, "all" to skip)
  --assignee <value>   Assignee (default: currentUser())
  --max     <n>        Max results (default: 50)
  --jql     <query>    Raw JQL (overrides other filters)
  --help               Show this help text
`.trim();

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { console.log(HELP); return; }

  const creds = loadCredsFromEnv();

  let jql: string;
  if (opts.jql) {
    jql = opts.jql as string;
  } else {
    const clauses: string[] = [];
    if (opts.project) clauses.push(`project = ${opts.project}`);
    const assignee = (opts.assignee as string) ?? 'currentUser()';
    clauses.push(`assignee = ${assignee}`);
    const status = (opts.status as string) ?? 'Done';
    if (status !== 'all') clauses.push(`status = "${status}"`);
    jql = clauses.join(' AND ') + ' ORDER BY updated DESC';
  }

  console.error(`JQL: ${jql}\n`);

  const data = await jiraFetch(creds, '/rest/api/3/search/jql', {
    method: 'POST',
    body: JSON.stringify({ jql, fields: ISSUE_LIST_FIELDS, maxResults: parseInt(opts.max as string, 10) || 50 }),
  }) as { issues?: unknown[] };

  const issues = (data?.issues ?? []).map(formatIssueSummary);
  console.log(JSON.stringify(issues, null, 2));
  console.error(`\nTotal: ${issues.length} issue(s)`);
}

main().catch(e => { console.error((e as Error).message); process.exit(1); });
