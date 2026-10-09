import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnswerInput, DayDetail, DaySummary, Exercise, Submitted, VocabularyEntry } from "@/lib/api/types";
import { CONTENT_BY_DAY } from "./days";

/** Each test gets a fresh fixture server, because the fixture keeps state in memory. */
async function loadServer() {
  vi.resetModules();
  return import("./server");
}

const BASE = "/api/v1";

function answerFor(exerciseId: string) {
  const answer = Object.values(CONTENT_BY_DAY)
    .map((day) => day.answers[exerciseId])
    .find((item) => item !== undefined);
  if (!answer) throw new Error(`no content for ${exerciseId}`);
  return answer;
}

/** The answer the content file marks as correct, in the shape the learner submits. */
function correctSubmission(exerciseId: string): Submitted {
  const { check } = answerFor(exerciseId);
  if ("option" in check) return { optionIndex: check.option };
  if ("accepted" in check) return { text: check.accepted[0] };
  return { pairs: check.pairs };
}

/** An answer that is wrong for every exercise kind. */
function wrongSubmission(exerciseId: string): Submitted {
  const { check } = answerFor(exerciseId);
  if ("option" in check) return { optionIndex: check.option === 0 ? 1 : 0 };
  if ("accepted" in check) return { text: "not an answer" };
  return { pairs: {} };
}

describe("fixture server", () => {
  let call: Awaited<ReturnType<typeof loadServer>>["fixtureCall"];

  beforeEach(async () => {
    ({ fixtureCall: call } = await loadServer());
  });

  async function completeDay(day: number) {
    const { attemptId, exercises } = await call<{ attemptId: string; exercises: Exercise[] }>("POST", `${BASE}/days/${day}/attempts`);
    for (const exercise of exercises) {
      await call("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: exercise.id, submitted: correctSubmission(exercise.id) });
    }
    await call("POST", `${BASE}/attempts/${attemptId}/complete`);
  }

  it("never returns answer keys in the day payload", async () => {
    const day = await call<DayDetail>("GET", `${BASE}/days/1`);
    const serialised = JSON.stringify(day);

    expect(day.exercises.length).toBeGreaterThan(0);
    expect(serialised).not.toContain("answer_key");
    expect(serialised).not.toContain("isCorrect");
    expect(serialised).not.toContain("expected");
    for (const exercise of day.exercises) {
      expect(Object.keys(exercise)).not.toContain("answer");
    }
  });

  it("only reveals the expected answer after the learner answers", async () => {
    const { attemptId, exercises } = await call<{ attemptId: string; exercises: Exercise[] }>("POST", `${BASE}/days/1/attempts`);
    const input: AnswerInput = { exerciseId: exercises[0].id, submitted: { optionIndex: 0 } };

    const result = await call<{ isCorrect: boolean; expected?: string | null }>("POST", `${BASE}/attempts/${attemptId}/answers`, input);

    expect(result.isCorrect).toBe(false);
    expect(result.expected).toBe("LY-brer-ee");
  });

  it("keeps later days locked until the day before is complete", async () => {
    const day2 = await call<DayDetail>("GET", `${BASE}/days/2`);
    expect(day2.status).toBe("locked");
    expect(day2.exercises).toEqual([]);

    await expect(call("POST", `${BASE}/days/2/attempts`)).rejects.toMatchObject({ status: 409 });
  });

  it("completes a day when one run reaches 70% and unlocks the next day", async () => {
    const { attemptId, exercises } = await call<{ attemptId: string; exercises: Exercise[] }>("POST", `${BASE}/days/1/attempts`);
    const totalPoints = exercises.reduce((sum, exercise) => sum + exercise.points, 0);
    const [first, ...rest] = exercises;

    // Only the first item is wrong, so the run scores everything except its points.
    await call("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: first.id, submitted: wrongSubmission(first.id) });
    for (const exercise of rest) {
      await call("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: exercise.id, submitted: correctSubmission(exercise.id) });
    }
    const completed = await call<{ scorePct: number; status: string; dayStatus: string; nextDay: number | null }>(
      "POST",
      `${BASE}/attempts/${attemptId}/complete`,
    );

    expect(completed.scorePct).toBe(Math.round(((totalPoints - first.points) / totalPoints) * 100));
    expect(completed.scorePct).toBeGreaterThanOrEqual(70);
    expect(completed.status).toBe("passed");
    expect(completed.dayStatus).toBe("done");
    expect(completed.nextDay).toBe(2);

    const day2 = await call<DayDetail>("GET", `${BASE}/days/2`);
    expect(day2.status).toBe("current");
  });

  it("scores a run below 70% as not passed and leaves the next day locked", async () => {
    const { attemptId } = await call<{ attemptId: string }>("POST", `${BASE}/days/1/attempts`);
    await call("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: "d01-pron-common-01", submitted: { optionIndex: 0 } });

    const completed = await call<{ scorePct: number; status: string; nextDay: number | null }>("POST", `${BASE}/attempts/${attemptId}/complete`);

    expect(completed.scorePct).toBeLessThan(70);
    expect(completed.status).toBe("not_passed");
    expect(completed.nextDay).toBeNull();
    expect((await call<DayDetail>("GET", `${BASE}/days/2`)).status).toBe("locked");
  });

  it("serves the Day 2 lesson and exercises once Day 2 unlocks", async () => {
    const { attemptId, exercises } = await call<{ attemptId: string; exercises: Exercise[] }>("POST", `${BASE}/days/1/attempts`);
    for (const exercise of exercises) {
      await call("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: exercise.id, submitted: correctSubmission(exercise.id) });
    }
    await call("POST", `${BASE}/attempts/${attemptId}/complete`);

    const day2 = await call<DayDetail>("GET", `${BASE}/days/2`);
    const attempt = await call<{ exercises: Exercise[] }>("POST", `${BASE}/days/2/attempts`);

    expect(day2.status).toBe("current");
    expect(day2.lesson.grammar.map((card) => card.title)).toEqual(CONTENT_BY_DAY[2].lesson.grammar.map((card) => card.title));
    expect(day2.exercises.map((exercise) => exercise.id)).toEqual(attempt.exercises.map((exercise) => exercise.id));
    expect(attempt.exercises).toHaveLength(CONTENT_BY_DAY[2].exercises.length);
  });

  it("shows Day 2 with the vocabulary title and objective", async () => {
    const day2 = await call<DayDetail>("GET", `${BASE}/days/2`);

    expect(day2.title).toBe("Test Your Vocabulary");
    expect(day2.objective).toBe("Match words to their meanings and spot similar and opposite words.");
  });

  it("rejects an exercise that is not part of the attempt", async () => {
    const { attemptId } = await call<{ attemptId: string }>("POST", `${BASE}/days/1/attempts`);

    await expect(
      call("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: "ex_unknown", submitted: { text: "x" } }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("lists vocabulary only for unlocked days", async () => {
    const vocabulary = await call<VocabularyEntry[]>("GET", `${BASE}/vocabulary`);

    expect(vocabulary.length).toBeGreaterThan(0);
    expect(new Set(vocabulary.map((entry) => entry.dayNumber))).toEqual(new Set([1]));
  });

  it("carries the watch-out tip of each lesson card to the learner", async () => {
    for (const day of [1, 2, 3]) {
      await completeDay(day);
    }
    const day4 = await call<DayDetail>("GET", `${BASE}/days/4`);

    expect(day4.lesson.grammar.map((point) => point.watchOut)).toContain("Do not say I seen it or we done it.");
  });

  it("tells the learner to type an answer when a fill-blank prompt has no blank", async () => {
    for (const day of [1, 2, 3, 4]) {
      await completeDay(day);
    }
    const attempt = await call<{ exercises: Exercise[] }>("POST", `${BASE}/days/5/attempts`);
    const item = attempt.exercises.find((exercise) => exercise.id === "d05-fluency-01");

    expect(item).toMatchObject({
      instructions: "Type your answer.",
      content: { sentence: "Write one word that starts with R and means the opposite of accept." },
    });
  });

  it("serves one dev item of each new kind and a timed item, outside the day list", async () => {
    const { items } = await call<{ items: Exercise[] }>("GET", `${BASE}/dev/exercises`);
    const kinds = items.map((exercise) => exercise.kind);

    expect(kinds).toEqual(["find_misspelled", "self_check", "right_wrong", "timed_recall"]);
    expect(items[3]).toMatchObject({ kind: "timed_recall", content: { timeLimitSeconds: 60 } });

    const days = await call<DaySummary[]>("GET", `${BASE}/days`);
    expect(days).toHaveLength(30);
    const day1 = await call<DayDetail>("GET", `${BASE}/days/1`);
    expect(day1.exercises.some((exercise) => exercise.id.startsWith("ex_dev_"))).toBe(false);
    await expect(call("GET", `${BASE}/days/0`)).rejects.toMatchObject({ status: 404 });
  });

  it("grades the dev items on the server like any other item", async () => {
    const right = await call<{ isCorrect: boolean; expected?: string | null }>("POST", `${BASE}/review/answers`, {
      exerciseId: "ex_dev_timed",
      submitted: { text: "cottage" },
    });
    const wrong = await call<{ isCorrect: boolean }>("POST", `${BASE}/review/answers`, {
      exerciseId: "ex_dev_right",
      submitted: { optionIndex: 0 },
    });

    expect(right.isCorrect).toBe(true);
    expect(wrong.isCorrect).toBe(false);
  });
});
