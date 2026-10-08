import { describe, expect, it } from 'vitest';
import { PHONE_WIDTH_PX, isHorizontallyOverflowing } from '../e2e/support/overflow';

describe('isHorizontallyOverflowing', () => {
  it('uses 390 px as the phone width the PRD requires', () => {
    expect(PHONE_WIDTH_PX).toBe(390);
  });

  it('reports overflow when the scroll width is wider than the viewport', () => {
    expect(isHorizontallyOverflowing(620, 390)).toBe(true);
  });

  it('ignores sub-pixel rounding within the default 1 px tolerance', () => {
    expect(isHorizontallyOverflowing(390.4, 390)).toBe(false);
    expect(isHorizontallyOverflowing(391, 390)).toBe(false);
    expect(isHorizontallyOverflowing(392, 390)).toBe(true);
  });

  it('accepts a custom tolerance', () => {
    expect(isHorizontallyOverflowing(395, 390, 10)).toBe(false);
    expect(isHorizontallyOverflowing(401, 390, 10)).toBe(true);
  });

  it('passes a page that fits the viewport exactly', () => {
    expect(isHorizontallyOverflowing(390, 390)).toBe(false);
  });
});
