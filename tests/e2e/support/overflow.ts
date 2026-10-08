/**
 * Pure overflow decision, shared by the browser helper and its Vitest tests.
 */

/** The phone width the PRD's no-horizontal-scroll rule is checked at. */
export const PHONE_WIDTH_PX = 390;

/**
 * A page overflows horizontally when its scrollable width is wider than the viewport. The tolerance
 * absorbs sub-pixel rounding (for example a 0.4 px difference from a fractional layout).
 */
export function isHorizontallyOverflowing(scrollWidth: number, viewportWidth: number): boolean {
  return scrollWidth - viewportWidth > 1;
}
