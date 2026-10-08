import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { checkAccessibility } from './support/axe';
import { expectNoHorizontalScroll } from './support/layout';
import { repoRoot } from './support/readiness';

// These tests use fixed HTML fixtures, so they run without the app. They prove the helpers can
// both pass and fail, which is what makes a green run in the app-level specs meaningful.

function fixture(name: string): string {
  return readFileSync(path.join(repoRoot, 'tests/fixtures/pages', name), 'utf8');
}

test.describe('@helper accessibility helper', () => {
  test('passes a page with labels, a landmark, a heading and a language', async ({ page }) => {
    await page.setContent(fixture('accessible.html'));
    await checkAccessibility(page);
  });

  test('fails a page with an image without alt text, an unlabelled input and no language (negative control)', async ({
    page,
  }) => {
    await page.setContent(fixture('inaccessible.html'));
    const failure = await checkAccessibility(page).then(
      () => '',
      (error: Error) => error.message,
    );
    expect(failure).not.toBe('');
    for (const rule of ['image-alt', 'label', 'html-has-lang']) {
      expect(failure).toContain(`${rule}:`);
    }
  });
});

test.describe('@helper no-horizontal-scroll helper', () => {
  test('passes a page whose content fits 390 px', async ({ page }) => {
    await page.setContent(fixture('fits-at-390.html'));
    await expectNoHorizontalScroll(page, 390);
  });

  test('fails a page with a 620 px element at 390 px and names it (negative control)', async ({ page }) => {
    await page.setContent(fixture('wide-at-390.html'));
    await expect(expectNoHorizontalScroll(page, 390)).rejects.toThrow(/wide-table/);
  });
});
