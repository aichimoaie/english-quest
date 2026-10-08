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

function isText(submitted: Submitted, accepted: string[]): boolean {
  return "text" in submitted && accepted.map(normaliseText).includes(normaliseText(submitted.text));
}

export const ANSWER_KEYS: Record<string, AnswerKey> = {
  ex_d1_choice: {
    isCorrect: (s) => isOption(s, 1),
    expected: "She is a teacher.",
    explanation: "Use is with she. Are goes with you, we and they.",
    feedbackKey: "be.subject_agreement",
  },
  ex_d1_fill: {
    isCorrect: (s) => isText(s, ["are"]),
    expected: "are",
    explanation: "They takes are, because they is a plural subject.",
    feedbackKey: "be.plural",
  },
  ex_d1_order: {
    isCorrect: (s) => "order" in s && s.order.join(" ") === "My name is Ana",
    expected: "My name is Ana",
    explanation: "Start with the owner word My, then the noun, then is and the name.",
    feedbackKey: "order.statement",
  },
  ex_d1_match: {
    isCorrect: (s) =>
      "pairs" in s &&
      s.pairs.teacher === "someone who teaches" &&
      s.pairs.student === "someone who learns" &&
      s.pairs.doctor === "someone who treats sick people",
    expected: "teacher: someone who teaches. student: someone who learns. doctor: someone who treats sick people.",
    explanation: "Each word matches one meaning. Read the meaning, then find the word.",
    feedbackKey: "vocab.meaning",
  },
  ex_d1_spell: {
    isCorrect: (s) => isText(s, ["I receive a letter every week."]),
    expected: "I receive a letter every week.",
    explanation: "Receive has the pattern i before e, except after c.",
    feedbackKey: "spelling.ie_ei",
  },
  ex_d1_listen: {
    isCorrect: (s) => isOption(s, 1),
    expected: "At eight",
    explanation: "The clip says the shop opens at eight in the morning.",
    feedbackKey: "listening.detail",
  },
  ex_d1_say: {
    isCorrect: (s) => isOption(s, 1),
    expected: "sheep",
    explanation: "Sheep and ship sound alike in some accents. Listen for the long vowel in sheep.",
    feedbackKey: "pronunciation.recognition",
  },
  ex_d2_choice_my: {
    isCorrect: (s) => isOption(s, 0),
    expected: "My",
    explanation: "\"My\" is a possessive word, so it goes before the noun \"name\". \"Me\" and \"I\" are pronouns, not possessive words.",
    feedbackKey: "possessive.determiner",
  },
  ex_d2_choice_her: {
    isCorrect: (s) => isOption(s, 1),
    expected: "Her dog is friendly.",
    explanation: "\"Her\" comes before the noun \"dog\". \"Hers\" stands alone, as in \"The dog is hers.\"",
    feedbackKey: "possessive.determiner",
  },
  ex_d2_fill: {
    isCorrect: (s) => isText(s, ["his"]),
    expected: "his",
    explanation: "Tom is a man, so the owner word is \"his\". Use \"her\" when the owner is a woman or a girl.",
    feedbackKey: "possessive.his_her",
  },
  ex_d2_match: {
    isCorrect: (s) =>
      "pairs" in s &&
      s.pairs.backpack === "a bag that you wear on your back" &&
      s.pairs.notebook === "a small book with empty pages for writing notes" &&
      s.pairs.umbrella === "something you hold over your head to stay dry in the rain" &&
      s.pairs.passport === "an official document that shows who you are when you travel",
    expected:
      "backpack: a bag that you wear on your back. notebook: a small book with empty pages for writing notes. umbrella: something you hold over your head to stay dry in the rain. passport: an official document that shows who you are when you travel.",
    explanation: "Each word names a thing you carry or use. Read the meanings again if you are unsure.",
    feedbackKey: "vocab.meaning",
  },
  ex_d2_spell: {
    isCorrect: (s) => isText(s, ["I left my umbrella at the station."]),
    expected: "I left my umbrella at the station.",
    explanation: "\"Umbrella\" has two l's together in the middle. Say it in parts: um-brel-la.",
    feedbackKey: "spelling.double_letters",
  },
  ex_d2_order: {
    isCorrect: (s) => "order" in s && s.order.join(" ") === "Your bicycle is by the door.",
    expected: "Your bicycle is by the door.",
    explanation: "Start with the owner word \"Your\" and the noun \"bicycle\". Then add \"is\", the place \"by the door\", and the full stop at the end.",
    feedbackKey: "sentence.word_order",
  },
  ex_d2_listen: {
    isCorrect: (s) => isOption(s, 0),
    expected: "Jen",
    explanation: "The speaker says the jacket is not theirs and that it belongs to Jen. Listen for the word that comes after \"belongs to\".",
    feedbackKey: "listening.detail",
  },
};
