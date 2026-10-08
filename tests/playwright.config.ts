import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import { apiPresent, repoRoot, testDatabaseUrl, webAppPresent } from './e2e/support/readiness';

// Browser-level tests live in tests/e2e. Two projects cover the MVP targets: desktop Chrome and
// Pixel 7 (an emulated phone in Chromium, not a real device).
//
// Environment variables:
//   EQ_LEARNER_EMAIL     and EQ_LEARNER_PASSWORD: the one learner account for authenticated specs.
//   EQ_TEST_DATABASE_URL the dedicated database the started API writes to. Never the ambient DATABASE_URL.

const webPort = 3000;
const apiPort = 8000;
const baseURL = `http://127.0.0.1:${webPort}`;

// The web app is a static export (PRD section 17), so it is built and then served as files.
const webServer: PlaywrightTestConfig['webServer'] = [];
if (webAppPresent) {
  webServer.push({
    command: `pnpm --dir apps/web build && python3 -m http.server ${webPort} --bind 127.0.0.1 --directory apps/web/out`,
    cwd: repoRoot,
    url: `http://127.0.0.1:${webPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  });
}
if (apiPresent) {
  if (!testDatabaseUrl) {
    throw new Error(
      'Set EQ_TEST_DATABASE_URL to a dedicated test database. The API starts on it, so it never uses the ambient DATABASE_URL.',
    );
  }
  webServer.push({
    command: `uv run --project apps/api uvicorn english_quest_api.main:create_app --factory --host 127.0.0.1 --port ${apiPort}`,
    cwd: repoRoot,
    url: `http://127.0.0.1:${apiPort}/api/v1/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: testDatabaseUrl },
  });
}

function prepareOutputRoot(): string {
  const root = path.join(os.tmpdir(), 'english-quest-e2e');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { mode: 0o700 });
  return root;
}

const outputRoot = (process.env.EQ_E2E_OUTPUT_ROOT ??= prepareOutputRoot());

export default defineConfig({
  testDir: path.join(repoRoot, 'tests/e2e'),
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: path.join(outputRoot, 'report') }]]
    : [['list']],
  // Traces and screenshots of failures. They go outside the worktree, so a commit cannot pick them up.
  outputDir: path.join(outputRoot, 'test-results'),
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'pixel-7',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: webServer.length > 0 ? webServer : undefined,
});
