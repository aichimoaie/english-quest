/*
 * Typed API client stub for /api/v1. Replace the bodies with the generated
 * client once apps/api publishes its OpenAPI document; the call sites in
 * hooks.ts should not need to change.
 *
 * No component calls fetch directly. Everything goes through `api`.
 */
import type { ApiProblem, AnswerInput, AnswerResult, CompletedAttempt, DayDetail, DaySummary, PronunciationRatingInput, Progress, ReviewSet, StartedAttempt, VocabularyEntry } from "./types";
import { API_BASE_URL, USE_FIXTURES } from "./config";
import { ApiError } from "./errors";

export { ApiError };

const PREFIX = "/api/v1";

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  if (USE_FIXTURES) {
    // Loaded on demand so the fixture answer keys stay out of the main bundle.
    const { fixtureCall } = await import("@/lib/fixtures/server");
    return fixtureCall<T>(method, `${PREFIX}${path}`, body);
  }

  const response = await fetch(`${API_BASE_URL}${PREFIX}${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ApiProblem | null;
    throw new ApiError(problem ?? { title: response.statusText, status: response.status });
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  listDays: () => call<DaySummary[]>("GET", "/days"),

  getDay: (day: number) => call<DayDetail>("GET", `/days/${day}`),

  startAttempt: (day: number) => call<StartedAttempt>("POST", `/days/${day}/attempts`),

  submitAnswer: (attemptId: string, input: AnswerInput) => call<AnswerResult>("POST", `/attempts/${attemptId}/answers`, input),

  completeAttempt: (attemptId: string) => call<CompletedAttempt>("POST", `/attempts/${attemptId}/complete`),

  dailyReview: () => call<ReviewSet>("GET", "/review/daily"),

  mixedReview: () => call<ReviewSet>("GET", "/review/mixed"),

  submitReviewAnswer: (input: AnswerInput) => call<AnswerResult>("POST", "/review/answers", input),

  progress: () => call<Progress>("GET", "/progress"),

  vocabulary: () => call<VocabularyEntry[]>("GET", "/vocabulary"),

  ratePronunciation: (input: PronunciationRatingInput) => call<unknown>("POST", "/pronunciation/attempts", input),
};
