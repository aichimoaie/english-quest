import { expect, type Page } from '@playwright/test';
import { PHONE_WIDTH_PX, isHorizontallyOverflowing } from './overflow';

/**
 * Sets the viewport to the phone width, then fails if any element's right edge, or the document's own
 * scroll width, passes the viewport. Content hidden by an overflow:hidden ancestor still counts. The offending elements are included in
 * the failure message, so a fix can start from the selector rather than from a guess.
 */
export async function expectNoHorizontalScroll(page: Page, width = PHONE_WIDTH_PX) {
  await page.setViewportSize({ width, height: 844 });
  await page.waitForLoadState('networkidle');

  const measurement = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const elements = Array.from(document.body.querySelectorAll<HTMLElement>('*'));
    const widestElementEdge = elements.reduce(
      (widest, element) => Math.max(widest, element.getBoundingClientRect().right),
      0,
    );
    const contentWidth = Math.max(document.documentElement.scrollWidth, widestElementEdge);
    const offenders = elements
      .filter((element) => element.getBoundingClientRect().right > viewportWidth + 1)
      .slice(0, 5)
      .map((element) => {
        const id = element.id ? `#${element.id}` : '';
        const className = typeof element.className === 'string' && element.className.trim()
          ? `.${element.className.trim().split(/\s+/).join('.')}`
          : '';
        return `${element.tagName.toLowerCase()}${id}${className}`;
      });
    return { viewportWidth, contentWidth, offenders };
  });

  const overflowing = isHorizontallyOverflowing(measurement.contentWidth, measurement.viewportWidth);
  const detail = overflowing
    ? `content edge ${measurement.contentWidth}px > viewport ${measurement.viewportWidth}px at ${width}px. ` +
      `Elements past the edge: ${measurement.offenders.join(', ') || 'none found (check fixed or transformed elements)'}`
    : '';
  expect(overflowing, detail).toBe(false);
}
