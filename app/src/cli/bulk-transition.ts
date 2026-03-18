#!/usr/bin/env node
/**
 * CLI: transition Jira issues to a target status.
 *
 *   --to    <STATUS>  Target status name (required)
 *   --issue <KEY>     Issue key (repeat for multiple)
 *   --jql   <query>   JQL to select issues
 *   --help            Show help
 */

import { type Credentials, jiraFetch, getTransitions, transitionIssue } from '../lib/jira-client';

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

function parseArgs(argv: string[]): { help?: boolean; to?: string; issues: string[]; jql?: string } {
  const args: { help?: boolean; to?: string; issues: string[]; jql?: string } = { issues: [] };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--help':  args.help = true; break;
      case '--to':    args.to = argv[++i]; break;
      case '--issue': args.issues.push(argv[++i]); break;
      case '--jql':   args.jql = argv[++i]; break;
    }
  }
  return args;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('Usage: node cli/bulk-transition.js --to <STATUS> [--issue <KEY> ...] [--jql <query>]');
    return;
  }
  if (!opts.to) { console.error('Error: --to is required.'); process.exit(1); }
  if (!opts.issues.length && !opts.jql) { console.error('Error: provide --issue or --jql.'); process.exit(1); }

  const creds = loadCredsFromEnv();
  let keys = [...opts.issues];

  if (opts.jql) {
    const data = await jiraFetch(creds, '/rest/api/3/search/jql', {
      method: 'POST',
      body: JSON.stringify({ jql: opts.jql, fields: ['summary'], maxResults: 1000 }),
    }) as { issues?: { key: string }[] };
    const jqlKeys = (data?.issues ?? []).map(i => i.key);
    keys = [...new Set([...keys, ...jqlKeys])];
  }

  if (keys.length === 0) { console.log('No issues found.'); return; }
  console.log(`Transitioning ${keys.length} issue(s) to "${opts.to}"...\n`);

  let updated = 0;
  for (const key of keys) {
    try {
      const transitions = await getTransitions(creds, key);
      const match = transitions.find(t => t.name.toLowerCase() === opts.to!.toLowerCase());
      if (!match) { console.error(`  Skipped ${key}: no transition "${opts.to}"`); continue; }
      await transitionIssue(creds, key, match.id);
      console.log(`  ${key} → ${opts.to}`);
      updated++;
    } catch (err) {
      console.error(`  Failed ${key}: ${(err as Error).message}`);
    }
  }
  console.log(`\nDone. Transitioned ${updated}/${keys.length} issue(s).`);
}

main().catch(e => { console.error((e as Error).message); process.exit(1); });
