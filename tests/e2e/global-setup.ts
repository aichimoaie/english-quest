import { execFileSync } from 'node:child_process';
import { apiPresent, repoRoot, testDatabaseUrl } from './support/readiness';

export default function globalSetup() {
  if (!apiPresent || !testDatabaseUrl) {
    return;
  }
  const env = { ...process.env, DATABASE_URL: testDatabaseUrl };
  const uv = (args: string[]) => execFileSync('uv', ['run', '--project', 'apps/api', ...args], { cwd: repoRoot, env, stdio: 'inherit' });
  uv(['alembic', 'upgrade', 'head']);
  uv(['python', '-m', 'english_quest_api.seed_learner']);
}
