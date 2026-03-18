#!/usr/bin/env node
/**
 * CLI: bulk move Jira issues between projects.
 *
 *   --from <KEY>   Source project (required)
 *   --to   <KEY>   Target project (required)
 *   --jql  <query> JQL filter (optional)
 *   --help         Show help
 */

import { type Credentials, bulkMoveIssues } from '../lib/jira-client';

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
      case '--help': args.help = true; break;
      case '--from': args.from = argv[++i]; break;
      case '--to':   args.to = argv[++i]; break;
      case '--jql':  args.jql = argv[++i]; break;
    }
  }
  return args;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('Usage: node cli/bulk-move.js --from <SOURCE> --to <TARGET> [--jql <query>]');
    return;
  }
  if (!opts.from || !opts.to) {
    console.error('Error: --from and --to are required.');
    process.exit(1);
  }

  const creds = loadCredsFromEnv();
  console.log(`Moving issues from ${opts.from} to ${opts.to}...`);

  const result = await bulkMoveIssues(creds, opts.from as string, opts.to as string, opts.jql as string | undefined);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => { console.error((e as Error).message); process.exit(1); });
