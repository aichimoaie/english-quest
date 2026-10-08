import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { WCAG_TAGS, blockingViolations, describeViolations } from './violations';

/**
 * Runs axe against the current page state and fails on serious and critical violations.
 * Call it once per key state (a lesson, an exercise with feedback, review, progress), since axe
 * only sees what is on screen when it runs.
 */
export async function checkAccessibility(page: Page) {
  const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze();
  const blocking = blockingViolations(results.violations);
  expect(blocking, describeViolations(blocking)).toEqual([]);
  return results;
}
