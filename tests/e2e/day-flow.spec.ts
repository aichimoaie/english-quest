import { expect, test } from '@playwright/test';
import { checkAccessibility } from './support/axe';
import { signIn } from './support/auth';
import { appSkipReason, appUnderTest, testDatabaseUrl } from './support/readiness';

// Smoke test for the day flow. It uses only the public UI: no API calls, no database access, and
// no answer keys. It proves that a learner can sign in, open day 1, answer one exercise and see
// immediate feedback. Full completion (70% over a run) is covered by grading unit tests in
// apps/api, not here, because a smoke test should stay short.

const email = process.env.EQ_LEARNER_EMAIL;
const password = process.env.EQ_LEARNER_PASSWORD;

test.describe('@smoke day flow', () => {
  test.skip(!appUnderTest, appSkipReason());
  test.skip(
    !email || !password,
    'Set EQ_LEARNER_EMAIL and EQ_LEARNER_PASSWORD for the one learner account. Never commit them.',
  );

  test('signs in, opens day 1, answers an exercise and sees immediate feedback', async ({ page }) => {
    if (!testDatabaseUrl) {
      throw new Error(
        'Set EQ_TEST_DATABASE_URL to a dedicated test database. This test submits an attempt, so it never runs against the ambient DATABASE_URL.',
      );
    }
    await signIn(page, email ?? '', password ?? '');

    await page.getByRole('link', { name: /^Day 1\b/ }).or(page.getByRole('button', { name: /^Day 1\b/ })).click();
    await expect(page.getByRole('heading', { name: /Day 1\b/ }).first()).toBeVisible();
    await checkAccessibility(page);

    // Answer the first exercise. Choice exercises use option buttons; text exercises use a labelled
    // field. Either way the answer is not checked here, only that feedback appears.
    const main = page.getByRole('main');
    const textAnswer = main.getByLabel(/^Your (answer|sentence|spelling)$/);
    const option = main
      .getByRole('button')
      .filter({ hasNotText: /^(Check answer|Skip for now|Continue|Felt easy|Felt hard)$/ })
      .first();
    await expect(textAnswer.or(option).first()).toBeVisible();
    if (await textAnswer.count()) {
      await textAnswer.first().fill('test');
    } else {
      await option.click();
      await expect(main.getByRole('button', { pressed: true })).toHaveCount(1);
    }
    await page.getByRole('button', { name: 'Check answer' }).click();

    await expect(page.getByText(/^(Correct|Not quite|All matched)/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await checkAccessibility(page);
  });
});
