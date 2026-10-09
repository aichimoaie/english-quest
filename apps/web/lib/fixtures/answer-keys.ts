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

/*
 * DEV ONLY. Answers for the dev items in days.ts. They are served only by the dev
 * fixture route and are not part of any day.
 */
export const DEV_ANSWERS: Record<string, { check: AnswerCheck; expected: string; explanation: string; feedbackKey: string }> = {
  ex_dev_find: {
    check: { option: 0 },
    expected: "recieve",
    explanation: "Receive has the pattern i before e, except after c.",
    feedbackKey: "spelling.ie_ei",
  },
  ex_dev_self: {
    check: { option: 0 },
    expected: "I agree.",
    explanation: "Say I agree, not I am agree.",
    feedbackKey: "self.agree",
  },
  ex_dev_right: {
    check: { option: 1 },
    expected: "Wrong",
    explanation: "Use is with she, so the sentence should be She is my friend.",
    feedbackKey: "be.subject_agreement",
  },
  ex_dev_timed: {
    check: { accepted: ["cottage"] },
    expected: "cottage",
    explanation: "A cottage is a small house in the country.",
    feedbackKey: "vocab.meaning",
  },
};
