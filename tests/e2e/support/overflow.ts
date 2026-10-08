/**
 * Pure overflow decision, shared by the browser helper and its Vitest tests.
 */

/** The phone width the PRD's no-horizontal-scroll rule is checked at. */
export const PHONE_WIDTH_PX = 390;

/**
 * A page overflows horizontally when its widest content edge lies beyond the viewport. The 1 px
 * tolerance absorbs sub-pixel rounding (for example a 0.4 px difference from a fractional layout).
 */
export function isHorizontallyOverflowing(contentWidth: number, viewportWidth: number): boolean {
  return contentWidth - viewportWidth > 1;
}
