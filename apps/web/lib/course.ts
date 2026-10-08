/** Product constants shared by the screens and the fixtures. */
export const TOTAL_DAYS = 30;

/** A day is complete when one run reaches this percentage. */
export const PASS_MARK_PCT = 70;

/** Parses the [day] route segment. Returns null for anything that is not a day in the course. */
export function parseDayParam(value: string): number | null {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= TOTAL_DAYS ? day : null;
}
