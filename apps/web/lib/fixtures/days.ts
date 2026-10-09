/*
 * TEMPORARY course outline for the frontend skeleton. Remove when apps/api serves
 * GET /api/v1/days/{day}. Lessons and exercises come from content/days through
 * lib/fixtures/generated, so there is no second copy of the content here. Days
 * without a content file are placeholders until their content is reviewed.
 */
import type { DaySummary, Exercise } from "@/lib/api/types";
import { GENERATED_DAYS, type GeneratedDay } from "./generated/curriculum";

export { TOTAL_DAYS } from "@/lib/course";

/** One entry per course day, in day order. Days 1 to 5 also have a content file with the same title. */
export const DAY_OUTLINE: { title: string; objective: string }[] = [
  { title: "Test Your Pronunciation", objective: "Choose the preferred pronunciation of common, educated and unfamiliar words." },
  { title: "Test Your Vocabulary", objective: "Match words to their meanings and spot similar and opposite words." },
  { title: "Test Your Spelling", objective: "Spell common words correctly and find the misspelled one." },
  { title: "Test Your Grammar", objective: "Choose correct grammar, pronouns and verb forms." },
  { title: "Just for Fun (I)", objective: "Play word games: opposites that start with R and words named after people." },
  { title: "Possessives: my, your, his", objective: "Show who owns something." },
  { title: "There is, there are", objective: "Say what exists in a place." },
  { title: "Can and can't", objective: "Talk about ability and rules." },
  { title: "Present continuous", objective: "Describe what is happening now." },
  { title: "Simple past: regular verbs", objective: "Talk about finished actions with -ed." },
  { title: "Simple past: irregular verbs", objective: "Use common past forms such as went and had." },
  { title: "Comparatives", objective: "Compare two things with -er and more." },
  { title: "Superlatives", objective: "Name the most or the least in a group." },
  { title: "Going to: plans", objective: "Talk about plans you already made." },
  { title: "Will: quick decisions", objective: "Decide something at the moment you speak." },
  { title: "Prepositions of time", objective: "Use in, on and at with time words." },
  { title: "Prepositions of place", objective: "Describe where things are." },
  { title: "Countable and uncountable", objective: "Use much, many, a lot of and some." },
  { title: "Have got and have", objective: "Talk about possessions and routines with have." },
  { title: "Adverbs of frequency", objective: "Place always, often and never correctly." },
  { title: "Object pronouns", objective: "Use me, you, him, her, us and them." },
  { title: "Present perfect: experience", objective: "Talk about life experiences with have been." },
  { title: "Present perfect: since and for", objective: "Describe actions that started in the past." },
  { title: "Modal verbs: must and should", objective: "Give advice and talk about obligation." },
  { title: "First conditional", objective: "Talk about likely results with if and will." },
  { title: "Relative clauses", objective: "Add information with who and that." },
  { title: "Phrasal verbs for daily life", objective: "Understand and use common two-word verbs." },
  { title: "Linking words", objective: "Join ideas with because, but and so." },
  { title: "Reported speech: basics", objective: "Report what someone said." },
  { title: "Review and practice", objective: "Bring together the grammar from the first 29 days." },
];

export const CONTENT_BY_DAY: Record<number, GeneratedDay> = Object.fromEntries(
  GENERATED_DAYS.map((day) => [day.dayNumber, day]),
);

export const DAY_SUMMARIES: DaySummary[] = DAY_OUTLINE.map((entry, index) => ({
  dayNumber: index + 1,
  title: entry.title,
  objective: entry.objective,
  status: index === 0 ? "current" : "locked",
  bestScorePct: null,
}));

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
