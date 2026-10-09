/*
 * TEMPORARY course outline for the frontend skeleton. Remove when apps/api serves
 * GET /api/v1/days/{day}. Lessons and exercises come from content/days through
 * lib/fixtures/generated, so there is no second copy of the content here. Days
 * without a content file are placeholders until their content is reviewed.
 */
import type { DaySummary } from "@/lib/api/types";
import { GENERATED_DAYS, type GeneratedDay } from "./generated/curriculum";

export { TOTAL_DAYS } from "@/lib/course";

const OBJECTIVES: string[] = [
  "Choose the preferred pronunciation of common, educated and unfamiliar words.",
  "Match words to their meanings and spot similar and opposite words.",
  "Spell common words correctly and find the misspelled one.",
  "Choose correct grammar, pronouns and verb forms.",
  "Play word games: opposites that start with R and words named after people.",
  "Show who owns something.",
  "Say what exists in a place.",
  "Talk about ability and rules.",
  "Describe what is happening now.",
  "Talk about finished actions with -ed.",
  "Use common past forms such as went and had.",
  "Compare two things with -er and more.",
  "Name the most or the least in a group.",
  "Talk about plans you already made.",
  "Decide something at the moment you speak.",
  "Use in, on and at with time words.",
  "Describe where things are.",
  "Use much, many, a lot of and some.",
  "Talk about possessions and routines with have.",
  "Place always, often and never correctly.",
  "Use me, you, him, her, us and them.",
  "Talk about life experiences with have been.",
  "Describe actions that started in the past.",
  "Give advice and talk about obligation.",
  "Talk about likely results with if and will.",
  "Add information with who and that.",
  "Understand and use common two-word verbs.",
  "Join ideas with because, but and so.",
  "Report what someone said.",
  "Bring together the grammar from the first 29 days.",
];

/** Titles for days that have no content file yet. Days with content use the title in their file. */
const PLACEHOLDER_TITLES: string[] = [
  "Possessives: my, your, his",
  "There is, there are",
  "Can and can't",
  "Present continuous",
  "Simple past: regular verbs",
  "Simple past: irregular verbs",
  "Comparatives",
  "Superlatives",
  "Going to: plans",
  "Will: quick decisions",
  "Prepositions of time",
  "Prepositions of place",
  "Countable and uncountable",
  "Have got and have",
  "Adverbs of frequency",
  "Object pronouns",
  "Present perfect: experience",
  "Present perfect: since and for",
  "Modal verbs: must and should",
  "First conditional",
  "Relative clauses",
  "Phrasal verbs for daily life",
  "Linking words",
  "Reported speech: basics",
  "Review and practice",
];

export const CONTENT_BY_DAY: Record<number, GeneratedDay> = Object.fromEntries(
  GENERATED_DAYS.map((day) => [day.dayNumber, day]),
);

export const DAY_TITLES: { title: string; objective: string }[] = OBJECTIVES.map((objective, index) => ({
  title: CONTENT_BY_DAY[index + 1]?.title ?? PLACEHOLDER_TITLES[index - 5] ?? "",
  objective,
}));

export const DAY_SUMMARIES: DaySummary[] = DAY_TITLES.map((entry, index) => ({
  dayNumber: index + 1,
  title: entry.title,
  objective: entry.objective,
  status: index === 0 ? "current" : "locked",
  bestScorePct: null,
}));
