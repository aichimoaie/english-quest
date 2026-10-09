/*
 * Wire types for the /api/v1 contract (see the architecture report, "API").
 * Hand-written stub: replace with the generated client once apps/api publishes
 * its OpenAPI document. Keep names in sync with the server DTOs.
 *
 * Answer keys never appear in these types. The browser sends a response and
 * renders the server's feedback; it never grades anything itself.
 */

/** The renderer types. The server maps every authoring kind onto one of these. */
export type ExerciseKind =
  | "multiple_choice"
  | "fill_blank"
  | "sentence_ordering"
  | "vocabulary_matching"
  | "spelling_correction"
  | "listening_comprehension"
  | "pronunciation_practice"
  | "find_misspelled"
  | "self_check"
  | "right_wrong"
  | "timed_recall";

export type DayStatus = "locked" | "current" | "done";

export interface DaySummary {
  dayNumber: number;
  title: string;
  objective: string;
  status: DayStatus;
  bestScorePct: number | null;
}

export interface VocabularyItem {
  word: string;
  definition: string;
  example: string;
}

export interface GrammarPoint {
  title: string;
  explanation: string;
  watchOut: string | null;
  examples: string[];
}

/** A day intro or reading text. The learner reads it, then presses Start or Next. */
export interface TextScreen {
  kind: "text";
  id: string;
  title: string;
  cards: GrammarPoint[];
}

/** One test: its intro, then its items, then a results screen with that test's score. */
export interface TestScreen {
  kind: "test";
  id: string;
  title: string;
  intro: string;
  exercises: Exercise[];
  explain: boolean;
}

/** The screens of one day, in the order the learner meets them. */
export type DayScreen = TextScreen | TestScreen;

interface ExerciseBase {
  id: string;
  instructions: string;
  points: number;
}

export type Exercise =
  | (ExerciseBase & {
      kind: "multiple_choice";
      content: { prompt: string; options: string[] };
    })
  | (ExerciseBase & {
      kind: "fill_blank";
      content: { sentence: string; hint: string | null };
    })
  | (ExerciseBase & {
      kind: "sentence_ordering";
      content: { words: string[] };
    })
  | (ExerciseBase & {
      kind: "vocabulary_matching";
      content: { words: string[]; meanings: string[] };
    })
  | (ExerciseBase & {
      kind: "spelling_correction";
      content: { sentence: string };
    })
  | (ExerciseBase & {
      kind: "listening_comprehension";
      content: { audioUrl: string | null; prompt: string; options: string[] };
    })
  | (ExerciseBase & {
      kind: "pronunciation_practice";
      content: { audioUrl: string | null; options: string[] };
    })
  | (ExerciseBase & {
      kind: "find_misspelled";
      content: { prompt: string; options: string[] };
    })
  | (ExerciseBase & {
      kind: "self_check";
      content: { prompt: string };
    })
  | (ExerciseBase & {
      kind: "right_wrong";
      content: { prompt: string };
    })
  | (ExerciseBase & {
      kind: "timed_recall";
      content: { sentence: string; hint: string | null };
    });

/** What the learner submits. The shape depends on the exercise kind. */
export type Submitted =
  | { optionIndex: number }
  | { optionIndex: number; text: string }
  | { text: string }
  | { order: string[] }
  | { pairs: Record<string, string> };

export interface DayDetail {
  dayNumber: number;
  title: string;
  objective: string;
  status: DayStatus;
  bestScorePct: number | null;
  vocabulary: VocabularyItem[];
  screens: DayScreen[];
}

export interface StartedAttempt {
  attemptId: string;
}

export interface AnswerInput {
  exerciseId: string;
  submitted: Submitted;
}

/** `expected` is only present after the answer is recorded. */
export interface AnswerResult {
  isCorrect: boolean;
  expected?: string | null;
  explanation: string;
  feedbackKey: string;
}

export interface CompletedAttempt {
  /** Null for a day with no test screens, which has no score. */
  scorePct: number | null;
  status: "passed" | "not_passed";
  dayStatus: DayStatus;
  nextDay: number | null;
}

/** A review item, with the explain flag of the test it came from. */
export interface ReviewItem {
  exercise: Exercise;
  explain: boolean;
}

export interface ReviewSet {
  items: ReviewItem[];
}

export interface PronunciationRatingInput {
  itemId: string;
  method: "recognition";
  selfRating: "got_it" | "needs_practice";
}

export interface Progress {
  completedDays: number;
  totalDays: number;
  overallPct: number;
  accuracyPct: number;
  streak: { current: number; longest: number };
  weakTopics: string[];
  vocabularyLearned: number;
  pronunciation: { recognitionItems: number; selfRatings: number };
}

export interface VocabularyEntry {
  id: string;
  word: string;
  definition: string;
  example: string;
  dayNumber: number;
  timesCorrect: number;
  timesWrong: number;
}

export interface ApiProblem {
  title: string;
  status: number;
  detail?: string;
}
