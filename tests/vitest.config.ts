import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Vitest runs from the repository root so that include globs can reach both the shared test
// helpers in tests/unit and the web app's own unit tests in apps/web (owned by workstream 1).
// Playwright specs (tests/e2e) are excluded; they run under `playwright test`.
export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'apps/web/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', 'tests/e2e/**'],
    passWithNoTests: false,
  },
});
