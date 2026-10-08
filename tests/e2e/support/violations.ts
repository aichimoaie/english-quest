/**
 * Pure helpers for axe results. No browser or Playwright imports, so Vitest can test them directly.
 */

export type Impact = 'minor' | 'moderate' | 'serious' | 'critical';

/** Fails a page on serious and critical problems only. Minor and moderate findings are reported, not failed. */
export const BLOCKING_IMPACTS: readonly Impact[] = ['serious', 'critical'];

/** WCAG 2.2 AA plus the 2.0/2.1 rules it includes, matching the PRD accessibility requirement. */
export const WCAG_TAGS: readonly string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export interface AxeViolationLike {
  id: string;
  impact?: Impact | null;
  help: string;
  helpUrl: string;
  nodes: readonly unknown[];
}

export function blockingViolations<T extends { impact?: Impact | null }>(violations: readonly T[]): T[] {
  return violations.filter((violation) => violation.impact != null && BLOCKING_IMPACTS.includes(violation.impact));
}

/** One line per violation, so a failing test shows what to fix and where to read about it. */
export function describeViolations(violations: readonly AxeViolationLike[]): string {
  return violations
    .map((violation) => {
      const impact = violation.impact ?? 'unknown';
      return `[${impact}] ${violation.id}: ${violation.help} (${violation.nodes.length} node${
        violation.nodes.length === 1 ? '' : 's'
      }) ${violation.helpUrl}`;
    })
    .join('\n');
}
