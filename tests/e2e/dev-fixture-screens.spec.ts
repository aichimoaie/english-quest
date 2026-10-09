import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { DEV_FIXTURE_EXERCISES } from '../../apps/web/lib/fixtures/days';
import type { AnswerResult, DayDetail } from '../../apps/web/lib/api/types';

// Visual evidence for the new exercise screens, the set timer and the end-of-set screen. The dev
// fixture day is served here by page.route, not by the app: the app build is unchanged and the
// fixture stays out of the production bundle. Grading is stubbed because the server does not grade
// the new kinds yet (deferred). The screenshots are attached to the test report.

const dayDetail: DayDetail = {
  dayNumber: 1,
  title: 'Dev fixture',
  objective: 'One item of each new exercise kind, with a timed set.',
  status: 'current',
  bestScorePct: null,
  lesson: { vocabulary: [], grammar: [] },
  exercises: DEV_FIXTURE_EXERCISES,
};

// Stub verdicts keyed by item. The end-of-set screen shows these as the answer key.
const stubExpected: Record<string, string> = {
  ex_dev_find: 'receive',
  ex_dev_right: 'Wrong',
  ex_dev_timed: 'cottage',
};

function stubAnswer(exerciseId: string): AnswerResult {
  return {
    isCorrect: true,
    expected: stubExpected[exerciseId] ?? null,
    explanation: 'Stub verdict: the server does not grade this kind yet.',
    feedbackKey: 'stub',
  };
}

async function serveDevFixtureDay(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (request.method() === 'GET' && path === '/api/v1/days/1') return json(dayDetail);
    if (request.method() === 'POST' && path === '/api/v1/days/1/attempts') {
      return json({ attemptId: 'att_dev', exercises: DEV_FIXTURE_EXERCISES });
    }
    if (request.method() === 'POST' && path === '/api/v1/attempts/att_dev/answers') {
      const input = request.postDataJSON() as { exerciseId: string };
      return json(stubAnswer(input.exerciseId));
    }
    if (request.method() === 'POST' && path === '/api/v1/attempts/att_dev/complete') {
      return json({ scorePct: 100, status: 'passed', dayStatus: 'done', nextDay: 2 });
    }
    return json({ title: 'Not part of the dev fixture', status: 404 }, 404);
  });
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
}

test.describe('@dev-fixture exercise screens from the dev fixture day', () => {
  test('plays each new exercise kind, runs the set timer and shows the end-of-set screen', async ({ page }, testInfo) => {
    // The clock is controlled so the set timer can be run out without waiting a minute.
    await page.clock.install({ time: new Date('2026-01-01T09:00:00Z') });
    await serveDevFixtureDay(page);
    await page.goto('/days/1/play');

    await expect(page.getByText('Which word is misspelled?')).toBeVisible();
    await capture(page, testInfo, '1-find-misspelled');
    await page.getByRole('button', { name: 'recieve' }).click();
    await page.getByLabel('Correct spelling').fill('receive');
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByRole('status').getByText('Correct', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('I am agree with the plan.')).toBeVisible();
    await capture(page, testInfo, '2-self-check');
    await page.getByRole('button', { name: 'Yes, I often say this' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByRole('status').getByText('Noted', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('She are my friend.')).toBeVisible();
    await capture(page, testInfo, '3-right-wrong');
    await page.getByRole('group', { name: 'Right or wrong' }).getByRole('button', { name: 'Wrong', exact: true }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByRole('status').getByText('Correct', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // The timed item is last, so the set clock runs out on the item on screen.
    await expect(page.getByText('A ____ is a small house in the country.')).toBeVisible();
    await page.getByRole('button', { name: 'Start timer' }).click();
    await expect(page.getByText('Running')).toBeVisible();
    await capture(page, testInfo, '4-timed-recall-running');

    // Time ran out, so the typed answer (none here) was sent and the end screen replaces the item.
    await page.clock.runFor(60_000);
    await expect(page.getByRole('heading', { name: '3 of 3 correct' })).toBeVisible();
    await expect(page.getByText('Every question was checked.')).toBeVisible();
    await capture(page, testInfo, '5-end-of-set');
  });
});
