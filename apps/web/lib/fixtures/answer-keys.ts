/*
 * TEMPORARY answer grading for the fixture server. On the real API the answer keys
 * live only in content_exercises.answer_key and never reach the browser. Here they
 * come from content/days through lib/fixtures/generated, because there is no server
 * yet. Delete this file with the fixture server.
 */
import type { Submitted } from "@/lib/api/types";

/** How one exercise is graded. Each exercise has exactly one of these. */
export type AnswerCheck = { option: number } | { accepted: string[] } | { pairs: Record<string, string> };

/** Case and surrounding spaces are ignored; everything else must match. */
export function normaliseText(value: string): string {
  return value.trim().toLowerCase();
}

export function isCorrect(submitted: Submitted, check: AnswerCheck): boolean {
  if ("option" in check) {
    return "optionIndex" in submitted && submitted.optionIndex === check.option;
  }
  if ("accepted" in check) {
    return "text" in submitted && check.accepted.map(normaliseText).includes(normaliseText(submitted.text));
  }
  return (
    "pairs" in submitted &&
    Object.entries(check.pairs).every(([word, meaning]) => submitted.pairs[word] === meaning)
  );
}
