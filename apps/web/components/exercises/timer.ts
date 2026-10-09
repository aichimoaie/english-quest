/** Formats seconds as m:ss, the clock the timed test shows. */
export function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest < 10 ? "0" : ""}${rest}`;
}
