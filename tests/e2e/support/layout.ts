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
    const describe = (element: HTMLElement) => {
      const id = element.id ? `#${element.id}` : '';
      const className = typeof element.className === 'string' && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).join('.')}`
        : '';
      return `${element.tagName.toLowerCase()}${id}${className}`;
    };
    const offenders = elements
      .filter((element) => element.getBoundingClientRect().right > viewportWidth + 1)
      .slice(0, 5)
      .map(describe);
    const containedOverflow = elements
      .filter((element) => element.scrollWidth > element.clientWidth)
      .slice(0, 5)
      .map(describe);
    return { viewportWidth, contentWidth, offenders, containedOverflow };
  });

  const pageOverflows = isHorizontallyOverflowing(measurement.contentWidth, measurement.viewportWidth);
  const overflowing = pageOverflows || measurement.containedOverflow.length > 0;
  const detail = overflowing
    ? [
        pageOverflows
          ? `content edge ${measurement.contentWidth}px > viewport ${measurement.viewportWidth}px at ${width}px.`
          : '',
        `Elements past the edge: ${measurement.offenders.join(', ') || 'none'}.`,
        `Elements with content wider than their box: ${measurement.containedOverflow.join(', ') || 'none'}.`,
      ].filter(Boolean).join(' ')
    : '';
  expect(overflowing, detail).toBe(false);
}
