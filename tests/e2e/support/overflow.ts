/**
 * Pure overflow decision, shared by the browser helper and its Vitest tests.
 */

/** The phone width the PRD's no-horizontal-scroll rule is checked at. */
export const PHONE_WIDTH_PX = 390;

/**
 * A page overflows horizontally when its widest content edge lies at least one whole pixel beyond the
 * viewport. Only the fractional part of a layout edge is absorbed, so a 390.4 px edge at a 390 px
 * viewport passes, while a 391 px edge, which browsers report as a real sideways scroll, fails.
 */
export function isHorizontallyOverflowing(contentWidth: number, viewportWidth: number): boolean {
  return Math.floor(contentWidth) > viewportWidth;
}
