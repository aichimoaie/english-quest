/*
 * TEMPORARY course outline for the frontend skeleton. Remove when apps/api serves
 * GET /api/v1/days/{day}. Screens and exercises come from content/days through
 * lib/fixtures/generated, so there is no second copy of the content here. Days
 * without a content file are placeholders until their content is reviewed.
 */
import type { Exercise } from "@/lib/api/types";
import { GENERATED_DAYS, type GeneratedDay } from "./generated/curriculum";

export { TOTAL_DAYS } from "@/lib/course";

/** Title and objective for each day that has no content file yet, keyed by day number. */
export const PLACEHOLDER_OUTLINE: Record<number, { title: string; objective: string }> = {
  15: { title: "Will: quick decisions", objective: "Decide something at the moment you speak." },
  16: { title: "Prepositions of time", objective: "Use in, on and at with time words." },
  17: { title: "Prepositions of place", objective: "Describe where things are." },
  18: { title: "Countable and uncountable", objective: "Use much, many, a lot of and some." },
  19: { title: "Have got and have", objective: "Talk about possessions and routines with have." },
  20: { title: "Adverbs of frequency", objective: "Place always, often and never correctly." },
  21: { title: "Object pronouns", objective: "Use me, you, him, her, us and them." },
  22: { title: "Present perfect: experience", objective: "Talk about life experiences with have been." },
  23: { title: "Present perfect: since and for", objective: "Describe actions that started in the past." },
  24: { title: "Modal verbs: must and should", objective: "Give advice and talk about obligation." },
  25: { title: "First conditional", objective: "Talk about likely results with if and will." },
  26: { title: "Relative clauses", objective: "Add information with who and that." },
  27: { title: "Phrasal verbs for daily life", objective: "Understand and use common two-word verbs." },
  28: { title: "Linking words", objective: "Join ideas with because, but and so." },
  29: { title: "Reported speech: basics", objective: "Report what someone said." },
  30: { title: "Review and practice", objective: "Bring together the grammar from the first 29 days." },
};

export const CONTENT_BY_DAY: Record<number, GeneratedDay> = Object.fromEntries(
  GENERATED_DAYS.map((day) => [day.dayNumber, day]),
);

/*
 * DEV ONLY. One item of each new exercise kind. It is served only by the dev fixture route
 * (GET /api/v1/dev/exercises). It is not in the day list, not in the day
 * summaries, and not in the content files.
 */
export const DEV_FIXTURE_EXERCISES: Exercise[] = [
  {
    id: "ex_dev_find",
    kind: "find_misspelled",
    instructions: "Find the misspelled word, then type the sentence with it fixed.",
    points: 1,
    content: { prompt: "Which word is misspelled?", options: ["recieve", "letter", "every"] },
  },
  {
    id: "ex_dev_self",
    kind: "self_check",
    instructions: "Be honest about how you say this.",
    points: 1,
    content: { prompt: "I am agree with the plan." },
  },
  {
    id: "ex_dev_right",
    kind: "right_wrong",
    instructions: "Decide if the sentence is right or wrong.",
    points: 1,
    content: { prompt: "She are my friend." },
  },
  {
    id: "ex_dev_timed",
    kind: "timed_recall",
    instructions: "Type the missing word.",
    points: 1,
    content: { sentence: "A ____ is a small house in the country.", hint: "Type one word." },
  },
];
