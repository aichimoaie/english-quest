import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnswerInput, DayDetail, DayScreen, DaySummary, Exercise, Submitted, VocabularyEntry } from "@/lib/api/types";
import { dayItems } from "@/lib/day-screens";
import { CONTENT_BY_DAY } from "./days";

/** Each test gets a fresh fixture server, because the fixture keeps state in memory. */
async function loadServer() {
  vi.resetModules();
  return import("./server");
}

const BASE = "/api/v1";

/** The cards of every text screen in a day, in order. */
function textCards(screens: DayScreen[]) {
  return screens.flatMap((screen) => (screen.kind === "text" ? screen.cards : []));
}

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

    expect(dayItems(day.screens).length).toBeGreaterThan(0);
    expect(serialised).not.toContain("answer_key");
    expect(serialised).not.toContain("isCorrect");
    expect(serialised).not.toContain("expected");
    for (const exercise of dayItems(day.screens)) {
      expect(Object.keys(exercise)).not.toContain("answer");
    }
  });

  it("only reveals the expected answer after the learner answers", async () => {
    const { attemptId, exercises } = await call<{ attemptId: string; exercises: Exercise[] }>("POST", `${BASE}/days/1/attempts`);
    const input: AnswerInput = { exerciseId: exercises[0].id, submitted: { optionIndex: 1 } };

    const result = await call<{ isCorrect: boolean; expected?: string | null }>("POST", `${BASE}/attempts/${attemptId}/answers`, input);

    expect(result.isCorrect).toBe(false);
    expect(result.expected).toBe("ə-TAL'-yən");
  });

  it("keeps later days locked until the day before is complete", async () => {
    const day2 = await call<DayDetail>("GET", `${BASE}/days/2`);
    expect(day2.status).toBe("locked");
    expect(day2.screens).toEqual([]);

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
    await call("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: "d01-pron-t1-01", submitted: { optionIndex: 1 } });

    const completed = await call<{ scorePct: number; status: string; nextDay: number | null }>("POST", `${BASE}/attempts/${attemptId}/complete`);

    expect(completed.scorePct).toBeLessThan(70);
    expect(completed.status).toBe("not_passed");
    expect(completed.nextDay).toBeNull();
    expect((await call<DayDetail>("GET", `${BASE}/days/2`)).status).toBe("locked");
  });

  it("serves the Day 2 screens and exercises once Day 2 unlocks", async () => {
    const { attemptId, exercises } = await call<{ attemptId: string; exercises: Exercise[] }>("POST", `${BASE}/days/1/attempts`);
    for (const exercise of exercises) {
      await call("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: exercise.id, submitted: correctSubmission(exercise.id) });
    }
    await call("POST", `${BASE}/attempts/${attemptId}/complete`);

    const day2 = await call<DayDetail>("GET", `${BASE}/days/2`);
    const attempt = await call<{ exercises: Exercise[] }>("POST", `${BASE}/days/2/attempts`);

    expect(day2.status).toBe("current");
    expect(textCards(day2.screens).map((card) => card.title)).toEqual(textCards(CONTENT_BY_DAY[2].screens).map((card) => card.title));
    expect(dayItems(day2.screens).map((exercise) => exercise.id)).toEqual(attempt.exercises.map((exercise) => exercise.id));
    expect(attempt.exercises).toHaveLength(CONTENT_BY_DAY[2].exercises.length);
  });

  it("serves Days 1 to 5 with their screens in the approved order", async () => {
    const approved: Record<number, string[]> = {
      1: [
        "text:d01-screen-part-one",
        "text:d01-screen-first-day",
        "test:d01-test-1",
        "test:d01-test-2",
        "test:d01-test-3",
        "test:d01-test-4",
      ],
      2: ["text:d02-screen-introduction", "text:d02-screen-three-tests", "test:d02-test-5", "test:d02-test-6", "test:d02-test-7"],
      3: ["text:d03-screen-introduction", "test:d03-test-8", "test:d03-test-9"],
      4: ["text:d04-screen-introduction", "test:d04-test-10", "test:d04-test-11"],
      5: [
        "text:d05-screen-introduction",
        "test:d05-test-fluency",
        "text:d05-screen-name-behind-word",
        "text:d05-screen-did-you-know",
        "test:d05-test-think-of-words",
      ],
    };
    for (const day of [1, 2, 3, 4, 5]) {
      if (day > 1) await completeDay(day - 1);
      const detail = await call<DayDetail>("GET", `${BASE}/days/${day}`);

      expect(detail.screens.map((screen) => `${screen.kind}:${screen.id}`)).toEqual(approved[day]);
    }
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

  it("carries each text screen's cards to the learner unchanged", async () => {
    for (const day of [1, 2, 3]) {
      await completeDay(day);
    }
    const day4 = await call<DayDetail>("GET", `${BASE}/days/4`);

    expect(textCards(day4.screens)).toEqual(textCards(CONTENT_BY_DAY[4].screens));
  });

  it("tells the learner to type an answer when a fill-blank prompt has no blank", async () => {
    for (const day of [1, 2, 3, 4]) {
      await completeDay(day);
    }
    const attempt = await call<{ exercises: Exercise[] }>("POST", `${BASE}/days/5/attempts`);
    const item = attempt.exercises.find((exercise) => exercise.id === "d05-flu-01");

    expect(item).toMatchObject({
      instructions: "Type your answer.",
      content: { sentence: "Test I, item 1: slow. Write a word that starts with R and is opposite in meaning." },
    });
  });

  it("serves one dev item of each new kind, outside the day list", async () => {
    const { items } = await call<{ items: Exercise[] }>("GET", `${BASE}/dev/exercises`);
    const kinds = items.map((exercise) => exercise.kind);

    expect(kinds).toEqual(["find_misspelled", "self_check", "right_wrong", "timed_recall"]);

    const days = await call<DaySummary[]>("GET", `${BASE}/days`);
    expect(days).toHaveLength(30);
    const day1 = await call<DayDetail>("GET", `${BASE}/days/1`);
    expect(dayItems(day1.screens).some((exercise) => exercise.id.startsWith("ex_dev_"))).toBe(false);
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

  describe("saved score with self-check items", () => {
    /** Day 1 becomes the dev fixture day: three scored items and one self-check. Unmocked after load so other tests keep the real content. */
    async function loadWithDevFixtureDay() {
      vi.resetModules();
      vi.doMock("./days", async (importOriginal) => {
        const actual = await importOriginal<typeof import("./days")>();
        return {
          ...actual,
          CONTENT_BY_DAY: {
            ...actual.CONTENT_BY_DAY,
            1: {
              ...actual.CONTENT_BY_DAY[1],
              exercises: actual.DEV_FIXTURE_EXERCISES,
              screens: [{ kind: "test", id: "d01-test-dev", title: "Dev items", intro: "Dev intro.", exercises: actual.DEV_FIXTURE_EXERCISES }],
            },
          },
        };
      });
      const server = await import("./server");
      vi.doUnmock("./days");
      return server;
    }

    async function runDevFixtureDay(submissions: Record<string, Submitted>) {
      const { fixtureCall: devCall } = await loadWithDevFixtureDay();
      const { attemptId } = await devCall<{ attemptId: string }>("POST", `${BASE}/days/1/attempts`);
      for (const [exerciseId, submitted] of Object.entries(submissions)) {
        await devCall("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId, submitted });
      }
      return devCall<{ scorePct: number; status: string }>("POST", `${BASE}/attempts/${attemptId}/complete`);
    }

    it("does not lower the saved score when a self-check is answered the other way", async () => {
      const completed = await runDevFixtureDay({
        ex_dev_find: { optionIndex: 0 },
        ex_dev_self: { optionIndex: 1 },
        ex_dev_right: { optionIndex: 1 },
        ex_dev_timed: { text: "cottage" },
      });

      expect(completed.scorePct).toBe(100);
      expect(completed.status).toBe("passed");
    });

    it("saves the same percentage the end screen headline gives for the scored items", async () => {
      // Two of the three scored items are right. The self-check is right too, but it must not add a point.
      const completed = await runDevFixtureDay({
        ex_dev_find: { optionIndex: 1 },
        ex_dev_self: { optionIndex: 0 },
        ex_dev_right: { optionIndex: 1 },
        ex_dev_timed: { text: "cottage" },
      });

      expect(completed.scorePct).toBe(Math.round((2 / 3) * 100));
    });

    it("keeps the first answer when the learner resubmits an item after a lost response", async () => {
      const { attemptId, exercises } = await call<{ attemptId: string; exercises: Exercise[] }>("POST", `${BASE}/days/1/attempts`);
      const retried = exercises.find((exercise) => exercise.kind !== "self_check")!;
      const firstAnswer = await call<{ isCorrect: boolean }>("POST", `${BASE}/attempts/${attemptId}/answers`, {
        exerciseId: retried.id,
        submitted: wrongSubmission(retried.id),
      });
      const retryAnswer = await call<{ isCorrect: boolean }>("POST", `${BASE}/attempts/${attemptId}/answers`, {
        exerciseId: retried.id,
        submitted: correctSubmission(retried.id),
      });
      for (const exercise of exercises) {
        if (exercise.id === retried.id) continue;
        await call("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: exercise.id, submitted: correctSubmission(exercise.id) });
      }
      const completed = await call<{ scorePct: number }>("POST", `${BASE}/attempts/${attemptId}/complete`);
      const scored = exercises.filter((exercise) => exercise.kind !== "self_check");
      const totalPoints = scored.reduce((sum, exercise) => sum + exercise.points, 0);

      expect(firstAnswer.isCorrect).toBe(false);
      expect(retryAnswer.isCorrect).toBe(false);
      expect(completed.scorePct).toBe(Math.round(((totalPoints - retried.points) / totalPoints) * 100));
    });

    it("leaves self-check answers out of the progress accuracy", async () => {
      const { fixtureCall: devCall } = await loadWithDevFixtureDay();
      const { attemptId } = await devCall<{ attemptId: string }>("POST", `${BASE}/days/1/attempts`);
      await devCall("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: "ex_dev_find", submitted: { optionIndex: 0 } });
      await devCall("POST", `${BASE}/attempts/${attemptId}/answers`, { exerciseId: "ex_dev_self", submitted: { optionIndex: 1 } });

      const progress = await devCall<{ accuracyPct: number }>("GET", `${BASE}/progress`);

      expect(progress.accuracyPct).toBe(100);
    });
  });
});
