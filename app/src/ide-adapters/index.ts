/**
 * @file ide-adapters/index.ts
 * @description Returns the correct IdeAdapter for the current IDE.
 *
 * To add support for a new IDE:
 *   1. Create a new file, e.g. trae.ts, implementing IdeAdapter.
 *   2. Add a detection branch below (check vscode.env.appName).
 *   3. That's it — extension.ts needs no changes.
 */

import * as vscode from 'vscode';
import type { IdeAdapter } from './types';
import { CursorAdapter } from './cursor';
import { VsCodeAdapter } from './vscode';

export type { IdeAdapter } from './types';

export function getIdeAdapter(): IdeAdapter {
  const appName = (vscode.env.appName ?? '').toLowerCase();

  if (appName.includes('cursor')) return new CursorAdapter();

  // Add new IDEs here:
  // if (appName.includes('trae')) return new TraeAdapter();

  return new VsCodeAdapter();
}
