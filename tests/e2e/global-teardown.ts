import fs from 'node:fs';

export default function globalTeardown() {
  const runOutput = process.env.EQ_E2E_RUN_OUTPUT;
  if (runOutput && !process.env.CI) {
    fs.rmSync(runOutput, { recursive: true, force: true });
  }
}
