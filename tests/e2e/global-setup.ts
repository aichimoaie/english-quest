import { execFileSync } from 'node:child_process';
import { apiPresent, repoRoot, testDatabaseUrl } from './support/readiness';

export default function globalSetup() {
  if (!apiPresent) {
    return;
  }
  if (!testDatabaseUrl) {
    throw new Error('Set EQ_TEST_DATABASE_URL to the dedicated test database before the end-to-end run.');
  }
  const env = { ...process.env, DATABASE_URL: testDatabaseUrl };
  const uv = (args: string[]) => execFileSync('uv', ['run', '--project', 'apps/api', ...args], { cwd: repoRoot, env, stdio: 'inherit' });
  uv(['alembic', 'upgrade', 'head']);
  uv(['python', '-m', 'english_quest_api.seed_learner']);
}
