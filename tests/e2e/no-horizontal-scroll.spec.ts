import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalScroll } from './support/layout';
import { appSkipReason, appUnderTest } from './support/readiness';
import { PHONE_WIDTH_PX } from './support/overflow';

// Routes from the architecture report (apps/web/app). The sign-in page is public; the rest need the
// learner account, so they are only checked when credentials are supplied.
const publicRoutes = ['/login'];
const learnerRoutes = ['/today', '/days/1', '/review', '/progress', '/vocabulary'];

const email = process.env.EQ_LEARNER_EMAIL;
const password = process.env.EQ_LEARNER_PASSWORD;

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email ?? '');
  await page.getByLabel('Password').fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Your 30 days' })).toBeVisible();
}

test.describe(`@layout no horizontal scroll at ${PHONE_WIDTH_PX}px`, () => {
  test.skip(!appUnderTest, appSkipReason());

  for (const route of publicRoutes) {
    test(`public page ${route} does not scroll sideways`, async ({ page }) => {
      await page.goto(route);
      await expectNoHorizontalScroll(page, PHONE_WIDTH_PX);
    });
  }

  test.describe('learner pages', () => {
    test.skip(
      !email || !password,
      'Set EQ_LEARNER_EMAIL and EQ_LEARNER_PASSWORD to check the learner pages.',
    );

    for (const route of learnerRoutes) {
      test(`learner page ${route} does not scroll sideways`, async ({ page }) => {
        await signIn(page);
        await page.goto(route);
        await expectNoHorizontalScroll(page, PHONE_WIDTH_PX);
      });
    }
  });
});
