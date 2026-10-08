import { describe, expect, it } from 'vitest';
import { BLOCKING_IMPACTS, WCAG_TAGS, blockingViolations, describeViolations } from '../e2e/support/violations';

describe('blockingViolations', () => {
  const results = [
    { id: 'image-alt', impact: 'critical' as const },
    { id: 'color-contrast', impact: 'serious' as const },
    { id: 'region', impact: 'moderate' as const },
    { id: 'tabindex', impact: 'minor' as const },
    { id: 'experimental', impact: null },
  ];

  it('fails on serious and critical findings only', () => {
    expect(blockingViolations(results).map((v) => v.id)).toEqual(['image-alt', 'color-contrast']);
  });

  it('returns nothing for an empty result', () => {
    expect(blockingViolations([])).toEqual([]);
  });

  it('keeps the defaults the accessibility helper relies on', () => {
    expect(BLOCKING_IMPACTS).toEqual(['serious', 'critical']);
    expect(WCAG_TAGS).toContain('wcag22aa');
  });
});

describe('describeViolations', () => {
  it('writes one line per violation with impact, node count and the help link', () => {
    const text = describeViolations([
      {
        id: 'label',
        impact: 'critical',
        help: 'Form elements must have labels',
        helpUrl: 'https://dequeuniversity.com/rules/axe/label',
        nodes: [{}, {}],
      },
      { id: 'landmark', impact: null, help: 'Page needs a main landmark', helpUrl: 'https://example.test', nodes: [{}] },
    ]);

    expect(text.split('\n')).toEqual([
      '[critical] label: Form elements must have labels (2 nodes) https://dequeuniversity.com/rules/axe/label',
      '[unknown] landmark: Page needs a main landmark (1 node) https://example.test',
    ]);
  });
});
