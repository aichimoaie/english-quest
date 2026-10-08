import path from 'node:path';
import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import { apiPresent, repoRoot, webAppPresent } from './e2e/support/readiness';

// Browser-level tests live in tests/e2e. Two projects cover the MVP targets: desktop Chrome and
// Pixel 7 (an emulated phone in Chromium, not a real device).
//
// Environment variables:
//   EQ_BASE_URL          run against an already running or deployed web app; no server is started.
//   EQ_LEARNER_EMAIL     and EQ_LEARNER_PASSWORD: the one learner account for authenticated specs.

const webPort = 3000;
const apiPort = 8000;
const baseURL = process.env.EQ_BASE_URL ?? `http://127.0.0.1:${webPort}`;

// The web app is a static export (PRD section 17), so it is built and then served as files.
const webServer: PlaywrightTestConfig['webServer'] = [];
if (!process.env.EQ_BASE_URL && webAppPresent) {
  webServer.push({
    command: `pnpm --dir apps/web build && python3 -m http.server ${webPort} --bind 127.0.0.1 --directory apps/web/out`,
    cwd: repoRoot,
    url: `http://127.0.0.1:${webPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  });
}
if (!process.env.EQ_BASE_URL && apiPresent) {
  webServer.push({
    command: `uv run --project apps/api uvicorn english_quest_api.main:create_app --factory --host 127.0.0.1 --port ${apiPort}`,
    cwd: repoRoot,
    url: `http://127.0.0.1:${apiPort}/api/v1/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  });
}

export default defineConfig({
  testDir: path.join(repoRoot, 'tests/e2e'),
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  // Traces and screenshots of failures. test-results/ and playwright-report/ must be git-ignored.
  outputDir: path.join(repoRoot, 'tests/test-results'),
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
