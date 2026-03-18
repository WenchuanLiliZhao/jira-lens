#!/usr/bin/env node
/**
 * CLI: assign Jira issues to the authenticated user.
 *
 *   --project <KEY>  Project key (required)
 *   --jql <query>    JQL filter (optional)
 *   --help           Show help
 */

import { type Credentials, jiraFetch } from '../lib/jira-client';

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
      case '--help':    args.help = true; break;
      case '--project': args.project = argv[++i]; break;
      case '--jql':     args.jql = argv[++i]; break;
    }
  }
  return args;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('Usage: node cli/bulk-assign.js --project <KEY> [--jql <query>]');
    return;
  }
  if (!opts.project) { console.error('Error: --project is required.'); process.exit(1); }

  const creds = loadCredsFromEnv();
  const me = await jiraFetch(creds, '/rest/api/3/myself') as { accountId?: string; displayName?: string; emailAddress?: string };
  const accountId = me?.accountId;
  if (!accountId) { console.error('Could not get current user.'); process.exit(1); }
  console.log(`Assigning to: ${me.displayName} (${me.emailAddress})`);

  const jql = (opts.jql as string) ?? `project = ${opts.project} ORDER BY key ASC`;
  console.log(`JQL: ${jql}\n`);

  const data = await jiraFetch(creds, '/rest/api/3/search/jql', {
    method: 'POST',
    body: JSON.stringify({ jql, fields: ['summary', 'assignee'], maxResults: 1000 }),
  }) as { issues?: { key: string; fields?: { assignee?: { accountId?: string } } }[] };
  const issues = data?.issues ?? [];
  if (issues.length === 0) { console.log('No issues found.'); return; }

  console.log(`Found ${issues.length} issue(s). Assigning...`);
  let assigned = 0;
  let skipped = 0;
  for (const issue of issues) {
    if (issue.fields?.assignee?.accountId === accountId) { skipped++; continue; }
    try {
      await jiraFetch(creds, `/rest/api/3/issue/${issue.key}`, {
        method: 'PUT',
        body: JSON.stringify({ fields: { assignee: { accountId } } }),
      });
      assigned++;
      process.stdout.write('.');
    } catch (err) {
      console.error(`\nFailed ${issue.key}: ${(err as Error).message}`);
    }
  }
  console.log(`\nDone. Assigned ${assigned} issue(s) (${skipped} already yours).`);
}

main().catch(e => { console.error((e as Error).message); process.exit(1); });
