/*
 * TEMPORARY fixture server. It answers /api/v1 calls in memory so the UI can be
 * built and tested before apps/api exists. Delete this file (and answer-keys.ts,
 * days.ts) when the API is live; the typed client in lib/api stays the same.
 *
 * It mirrors the server rules that matter to the UI: days unlock in order, a run
 * completes a day at 70%, scoring uses each item's first answer in a run, and
 * the server returns `expected` only after an answer is recorded, and self-check
 * items are shown but not scored.
 */
import { ApiError } from "@/lib/api/errors";
import type {
  AnswerInput,
  AnswerResult,
  CompletedAttempt,
  DayDetail,
  DayStatus,
  DaySummary,
  Exercise,
  Lesson,
  Progress,
  PronunciationRatingInput,
  StartedAttempt,
  VocabularyEntry,
} from "@/lib/api/types";
import { DEV_ANSWERS, isCorrect } from "./answer-keys";
import type { GeneratedAnswer } from "./generated/curriculum";
import { PASS_MARK_PCT, TOTAL_DAYS } from "@/lib/course";
import { isScored, scorePercent } from "@/lib/scoring";
import { CONTENT_BY_DAY, DAY_OUTLINE, DEV_FIXTURE_EXERCISES } from "./days";

const EMPTY_LESSON: Lesson = { vocabulary: [], grammar: [] };
const ANSWERS: Record<string, GeneratedAnswer> = Object.assign({}, DEV_ANSWERS, ...Object.values(CONTENT_BY_DAY).map((day) => day.answers));

interface Run {
  day: number;
  /** First answer of this run per exercise, used for the run score. */
  runAnswers: Map<string, AnswerResult>;
}

const state = {
  completedDays: new Set<number>(),
  bestScorePct: new Map<number, number>(),
  runs: new Map<string, Run>(),
  /** Accuracy counts each exercise's first-ever answer only. */
  firstEverAnswers: new Map<string, boolean>(),
  pronunciationRecognitionItems: 0,
  pronunciationSelfRatings: 0,
  longestStreak: 0,
  nextRunId: 1,
};

function problem(status: number, title: string, detail?: string): ApiError {
  return new ApiError({ status, title, detail });
}

function statusOf(day: number): DayStatus {
  const completed = state.completedDays.size;
  if (day <= completed) return "done";
  if (day === completed + 1) return "current";
  return "locked";
}

function exercisesFor(day: number): Exercise[] {
  return CONTENT_BY_DAY[day]?.exercises ?? [];
}

function isUnlocked(day: number): boolean {
  return statusOf(day) !== "locked";
}

function summaryFor(day: number): DaySummary {
  const entry = DAY_OUTLINE[day - 1];
  return {
    dayNumber: day,
    title: entry.title,
    objective: entry.objective,
    status: statusOf(day),
    bestScorePct: state.bestScorePct.get(day) ?? null,
  };
}

function parseDay(segment: string): number {
  const day = Number(segment);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    throw problem(404, "Day not found", `There is no day ${segment}.`);
  }
  return day;
}

function gradeItem(exerciseId: string, input: AnswerInput): AnswerResult {
  const key = ANSWERS[exerciseId];
  if (!key) {
    throw problem(404, "Exercise not found", `There is no exercise ${exerciseId}.`);
  }
  return {
    isCorrect: isCorrect(input.submitted, key.check),
    expected: key.expected,
    explanation: key.explanation,
    feedbackKey: key.feedbackKey,
  };
}

function startRun(day: number): StartedAttempt {
  const status = statusOf(day);
  if (status === "locked") {
    throw problem(409, "Day is locked", `Finish day ${day - 1} to unlock day ${day}.`);
  }
  const exercises = exercisesFor(day);
  if (exercises.length === 0) {
    throw problem(422, "No exercises yet", `Day ${day} has no published exercises.`);
  }
  const attemptId = `att_${state.nextRunId++}`;
  state.runs.set(attemptId, { day, runAnswers: new Map() });
  return { attemptId, exercises };
}

function recordAnswer(attemptId: string, input: AnswerInput): AnswerResult {
  const run = state.runs.get(attemptId);
  if (!run) {
    throw problem(404, "Attempt not found", `There is no attempt ${attemptId}.`);
  }
  const exercise = exercisesFor(run.day).find((item) => item.id === input.exerciseId);
  if (!exercise) {
    throw problem(422, "Exercise not in this attempt", `${input.exerciseId} is not part of day ${run.day}.`);
  }
  const firstResult = run.runAnswers.get(input.exerciseId);
  if (firstResult) {
    return firstResult;
  }
  const result = gradeItem(input.exerciseId, input);
  run.runAnswers.set(input.exerciseId, result);
  if (isScored(exercise) && !state.firstEverAnswers.has(input.exerciseId)) {
    state.firstEverAnswers.set(input.exerciseId, result.isCorrect);
    if (exercise.kind === "pronunciation_practice") {
      state.pronunciationRecognitionItems += 1;
    }
  }
  return result;
}

function completeRun(attemptId: string): CompletedAttempt {
  const run = state.runs.get(attemptId);
  if (!run) {
    throw problem(404, "Attempt not found", `There is no attempt ${attemptId}.`);
  }
  const scorePct = scorePercent(exercisesFor(run.day), (exercise) => run.runAnswers.get(exercise.id)?.isCorrect === true);
  const passed = scorePct >= PASS_MARK_PCT;

  if (passed) {
    state.completedDays.add(run.day);
    state.longestStreak = Math.max(state.longestStreak, state.completedDays.size);
  }
  state.bestScorePct.set(run.day, Math.max(scorePct, state.bestScorePct.get(run.day) ?? 0));
  state.runs.delete(attemptId);

  return {
    scorePct,
    status: passed ? "passed" : "not_passed",
    dayStatus: statusOf(run.day),
    nextDay: passed && run.day < TOTAL_DAYS ? run.day + 1 : null,
  };
}

function progress(): Progress {
  const answers = [...state.firstEverAnswers.values()];
  const correct = answers.filter(Boolean).length;
  const completed = state.completedDays.size;
  return {
    completedDays: completed,
    totalDays: TOTAL_DAYS,
    overallPct: Math.round((completed / TOTAL_DAYS) * 100),
    accuracyPct: answers.length === 0 ? 0 : Math.round((correct / answers.length) * 100),
    streak: { current: completed, longest: state.longestStreak },
    weakTopics: [],
    vocabularyLearned: 0,
    pronunciation: {
      recognitionItems: state.pronunciationRecognitionItems,
      selfRatings: state.pronunciationSelfRatings,
    },
  };
}

function vocabulary(): VocabularyEntry[] {
  return Object.values(CONTENT_BY_DAY)
    .filter((day) => isUnlocked(day.dayNumber))
    .flatMap((day) =>
    day.lesson.vocabulary.map((item) => ({
      id: `vocab_d${day.dayNumber}_${item.word}`,
      word: item.word,
      definition: item.definition,
      example: item.example,
      dayNumber: day.dayNumber,
      timesCorrect: 0,
      timesWrong: 0,
    })),
  );
}

function dayDetail(day: number): DayDetail {
  const unlocked = isUnlocked(day);
  return {
    ...summaryFor(day),
    lesson: unlocked ? (CONTENT_BY_DAY[day]?.lesson ?? EMPTY_LESSON) : EMPTY_LESSON,
    exercises: unlocked ? exercisesFor(day) : [],
  };
}

function readBody<T>(body: unknown): T {
  if (body === undefined || body === null) {
    throw problem(400, "Body required");
  }
  return body as T;
}

/**
 * Routes one /api/v1 call. `path` includes the /api/v1 prefix. Unknown routes
 * return 404 problem details, the same shape the real API uses.
 */
export async function fixtureCall<T>(method: string, path: string, body?: unknown): Promise<T> {
  const route = path.replace(/\/+$/, "");
  const match = (pattern: RegExp) => route.match(pattern);

  let result: unknown;

  if (method === "GET" && route === "/api/v1/days") {
    result = Array.from({ length: TOTAL_DAYS }, (_, index) => summaryFor(index + 1));
  } else if (method === "GET" && match(/^\/api\/v1\/days\/[^/]+$/)) {
    result = dayDetail(parseDay(route.split("/")[4]));
  } else if (method === "POST" && match(/^\/api\/v1\/days\/[^/]+\/attempts$/)) {
    result = startRun(parseDay(route.split("/")[4]));
  } else if (method === "POST" && match(/^\/api\/v1\/attempts\/[^/]+\/answers$/)) {
    result = recordAnswer(route.split("/")[4], readBody<AnswerInput>(body));
  } else if (method === "POST" && match(/^\/api\/v1\/attempts\/[^/]+\/complete$/)) {
    result = completeRun(route.split("/")[4]);
  } else if (method === "GET" && route === "/api/v1/review/daily") {
    result = { items: state.completedDays.has(1) ? exercisesFor(1) : [] };
  } else if (method === "GET" && route === "/api/v1/review/mixed") {
    result = { items: state.completedDays.has(1) ? exercisesFor(1) : [] };
  } else if (method === "GET" && route === "/api/v1/dev/exercises") {
    // Dev only: one item of each new kind plus a timed item. Not a day, and not in the day list.
    result = { items: DEV_FIXTURE_EXERCISES };
  } else if (method === "POST" && route === "/api/v1/review/answers") {
    const input = readBody<AnswerInput>(body);
    result = gradeItem(input.exerciseId, input);
  } else if (method === "GET" && route === "/api/v1/progress") {
    result = progress();
  } else if (method === "GET" && route === "/api/v1/vocabulary") {
    result = vocabulary();
  } else if (method === "POST" && route === "/api/v1/pronunciation/attempts") {
    const rating = readBody<PronunciationRatingInput>(body);
    state.pronunciationSelfRatings += 1;
    result = { feedback: rating.selfRating === "got_it" ? "Nice. Keep listening." : "That is fine. Replay the clip and try again." };
  } else {
    throw problem(404, "Not found", `${method} ${route} is not part of the fixture API.`);
  }

  return result as T;
}
