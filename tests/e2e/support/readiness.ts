import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Repository root, resolved from this file so the answer does not depend on
 * the directory Playwright or Vitest was started from.
 */
export const repoRoot = path.resolve(__dirname, '../../..');

/** Workstream 1 (frontend) owns apps/web; its package manifest marks the app as present. */
export const webAppPresent = existsSync(path.join(repoRoot, 'apps/web/package.json'));

/** Workstream 2 (backend) owns apps/api; its app factory module marks the API as present. */
export const apiPresent = existsSync(path.join(repoRoot, 'apps/api/src/english_quest_api/main.py'));

/**
 * True when the specs should drive a real app. An explicit EQ_BASE_URL (for example a deployed
 * dev environment) counts as present, because the app is then not built from this worktree.
 */
export const appUnderTest = Boolean(process.env.EQ_BASE_URL) || (webAppPresent && apiPresent);

/** Human-readable reason used in test.skip() so a skipped run names the missing dependency. */
export function appSkipReason(): string {
  if (process.env.EQ_BASE_URL) {
    return '';
  }
  const missing: string[] = [];
  if (!webAppPresent) {
    missing.push('apps/web (workstream 1, frontend foundation)');
  }
  if (!apiPresent) {
    missing.push('apps/api (workstream 2, backend foundation)');
  }
  return `Needs ${missing.join(' and ')} on main; set EQ_BASE_URL to run against a deployed app.`;
}
