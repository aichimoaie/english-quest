import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Repository root, resolved from this file so the answer does not depend on
 * the directory Playwright or Vitest was started from.
 */
export const repoRoot = path.resolve(__dirname, '../../..');

/**
 * The dedicated database the API may write to during end-to-end runs. Attempts are append-only, so
 * the smoke test never runs against the ambient DATABASE_URL.
 */
export const testDatabaseUrl = process.env.EQ_TEST_DATABASE_URL;

/** Refuses to run a spec that writes to the API unless the dedicated test database is configured. */
export function requireTestDatabase(): void {
  if (!testDatabaseUrl) {
    throw new Error(
      'Set EQ_TEST_DATABASE_URL to a dedicated test database. This test writes to the API, so it never runs against the ambient DATABASE_URL.',
    );
  }
}

/** Workstream 1 (frontend) owns apps/web; its package manifest marks the app as present. */
export const webAppPresent = existsSync(path.join(repoRoot, 'apps/web/package.json'));

/** Workstream 2 (backend) owns apps/api; its app factory module marks the API as present. */
export const apiPresent = existsSync(path.join(repoRoot, 'apps/api/src/english_quest_api/main.py'));

/** True when the specs can drive the app built and started from this worktree. */
export const appUnderTest = webAppPresent && apiPresent;

/** Human-readable reason used in test.skip() so a skipped run names the missing dependency. */
export function appSkipReason(): string {
  const missing: string[] = [];
  if (!webAppPresent) {
    missing.push('apps/web (workstream 1, frontend foundation)');
  }
  if (!apiPresent) {
    missing.push('apps/api (workstream 2, backend foundation)');
  }
  return `Needs ${missing.join(' and ')} on main.`;
}
