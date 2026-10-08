import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import {
  BLOCKING_IMPACTS,
  WCAG_TAGS,
  blockingViolations,
  describeViolations,
  type Impact,
} from './violations';

export interface AccessibilityOptions {
  /** CSS selectors to scan. Defaults to the whole page. */
  include?: string[];
  /** CSS selectors to skip, for example a third-party widget the team does not own. */
  exclude?: string[];
  /** Impact levels that fail the check. Defaults to serious and critical. */
  impacts?: Impact[];
}

/**
 * Runs axe against the current page state and fails on blocking violations.
 * Call it once per key state (a lesson, an exercise with feedback, review, progress), since axe
 * only sees what is on screen when it runs.
 */
export async function checkAccessibility(page: Page, options: AccessibilityOptions = {}) {
  let builder = new AxeBuilder({ page }).withTags([...WCAG_TAGS]);
  for (const selector of options.include ?? []) {
    builder = builder.include(selector);
  }
  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }

  const results = await builder.analyze();
  const blocking = blockingViolations(results.violations, options.impacts ?? BLOCKING_IMPACTS);
  expect(blocking, describeViolations(blocking)).toEqual([]);
  return results;
}
