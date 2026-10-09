/*
 * TEMPORARY answer keys for the fixture server. On the real API these live only
 * in content_exercises.answer_key and never reach the browser. Here they sit in
 * the bundle only because there is no server yet. Delete this file with the
 * fixture server.
 */
import type { Submitted } from "@/lib/api/types";

export interface AnswerKey {
  isCorrect: (submitted: Submitted) => boolean;
  expected: string;
  explanation: string;
  feedbackKey: string;
}

/** Case and surrounding spaces are ignored; everything else must match. */
export function normaliseText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isOption(submitted: Submitted, index: number): boolean {
  return "optionIndex" in submitted && submitted.optionIndex === index;
}

export const ANSWER_KEYS: Record<string, AnswerKey> = {
  "d01-pron-common-01": {
    isCorrect: (s) => isOption(s, 1),
    expected: "LY-brer-ee",
    explanation: "The careful pronunciation keeps the middle syllable, with a quiet vowel.",
    feedbackKey: "pronunciation.common_errors",
  },
  "d01-pron-common-02": {
    isCorrect: (s) => isOption(s, 1),
    expected: "MIS-chuh-vus",
    explanation: "Mischievous has three syllables. The middle one is quiet.",
    feedbackKey: "pronunciation.common_errors",
  },
  "d01-pron-educated-02": {
    isCorrect: (s) => isOption(s, 1),
    expected: "BUR-glur",
    explanation: "Burglar has two syllables, and the final syllable is a quiet schwa.",
    feedbackKey: "pronunciation.educated_standard",
  },
  "d01-pron-educated-03": {
    isCorrect: (s) => isOption(s, 1),
    expected: "ASK",
    explanation: "The standard word has a k sound before the s. The form AKS is not standard.",
    feedbackKey: "pronunciation.educated_standard",
  },
  "d01-pron-affected-03": {
    isCorrect: (s) => isOption(s, 1),
    expected: "WIDTH",
    explanation: "Width keeps the d and the th, and the vowel is short.",
    feedbackKey: "pronunciation.affected",
  },
  "d02-match-01": {
    isCorrect: (s) =>
      "pairs" in s &&
      s.pairs.wary === "cautious about possible danger" &&
      s.pairs.frugal === "careful with money" &&
      s.pairs.lucid === "clear and easy to follow" &&
      s.pairs.tenacious === "refusing to give up" &&
      s.pairs.ephemeral === "lasting only briefly",
    expected:
      "wary: cautious about possible danger. frugal: careful with money. lucid: clear and easy to follow. tenacious: refusing to give up. ephemeral: lasting only briefly.",
    explanation: "Lucid means clear, and each of the other four words has exactly one matching meaning.",
    feedbackKey: "vocab.meaning",
  },
  "d02-sim-opp-01": {
    isCorrect: (s) => isOption(s, 0),
    expected: "extravagant",
    explanation: "Extravagant means spending too much, the reverse of frugal. Thrifty and careful are similar.",
    feedbackKey: "vocab.antonym",
  },
  "d02-sim-opp-07": {
    isCorrect: (s) => isOption(s, 0),
    expected: "careless",
    explanation: "Careless means not paying attention to details, the reverse of meticulous.",
    feedbackKey: "vocab.antonym",
  },
  "d02-judge-01": {
    isCorrect: (s) => isOption(s, 1),
    expected: "False",
    explanation: "A frugal person is careful with money, so the statement is false.",
    feedbackKey: "vocab.word_use",
  },
};
