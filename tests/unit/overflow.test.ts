import { describe, expect, it } from 'vitest';
import { isHorizontallyOverflowing } from '../e2e/support/overflow';

describe('isHorizontallyOverflowing', () => {
  it('reports overflow when the scroll width is wider than the viewport', () => {
    expect(isHorizontallyOverflowing(620, 390)).toBe(true);
  });

  it('ignores fractional layout rounding but not a whole pixel of overflow', () => {
    expect(isHorizontallyOverflowing(390.4, 390)).toBe(false);
    expect(isHorizontallyOverflowing(390.9, 390)).toBe(false);
    expect(isHorizontallyOverflowing(391, 390)).toBe(true);
    expect(isHorizontallyOverflowing(392, 390)).toBe(true);
  });

  it('passes a page that fits the viewport exactly', () => {
    expect(isHorizontallyOverflowing(390, 390)).toBe(false);
  });
});
