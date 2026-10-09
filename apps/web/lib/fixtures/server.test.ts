import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnswerInput, DayDetail, Exercise } from "@/lib/api/types";

/** Each test gets a fresh fixture server, because the fixture keeps state in memory. */
async function loadServer() {
  vi.resetModules();
  return import("./server");
}

const BASE = "/api/v1";

describe("fixture server", () => {
  let call: Awaited<ReturnType<typeof loadServer>>["fixtureCall"];

  beforeEach(async () => {
    ({ fixtureCall: call } = await loadServer());
  });

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
    const answers: AnswerInput[] = [
      { exerciseId: "d01-pron-common-01", submitted: { optionIndex: 0 } },
      { exerciseId: "d01-pron-common-02", submitted: { optionIndex: 1 } },
      { exerciseId: "d01-pron-educated-02", submitted: { optionIndex: 1 } },
      { exerciseId: "d01-pron-educated-03", submitted: { optionIndex: 1 } },
      { exerciseId: "d01-pron-affected-03", submitted: { optionIndex: 1 } },
    ];
    expect(exercises.map((exercise) => exercise.id)).toEqual(answers.map((answer) => answer.exerciseId));

    for (const answer of answers) {
      await call("POST", `${BASE}/attempts/${attemptId}/answers`, answer);
    }
    const completed = await call<{ scorePct: number; status: string; dayStatus: string; nextDay: number | null }>(
      "POST",
      `${BASE}/attempts/${attemptId}/complete`,
    );

    // Day 1 has 5 points. Only the first item is wrong, so 4/5 is 80%.
    expect(completed.scorePct).toBe(80);
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
    const { attemptId } = await call<{ attemptId: string }>("POST", `${BASE}/days/1/attempts`);
    const dayOneAnswers: AnswerInput[] = [
      { exerciseId: "d01-pron-common-01", submitted: { optionIndex: 1 } },
      { exerciseId: "d01-pron-common-02", submitted: { optionIndex: 1 } },
      { exerciseId: "d01-pron-educated-02", submitted: { optionIndex: 1 } },
      { exerciseId: "d01-pron-educated-03", submitted: { optionIndex: 1 } },
      { exerciseId: "d01-pron-affected-03", submitted: { optionIndex: 1 } },
    ];
    for (const answer of dayOneAnswers) {
      await call("POST", `${BASE}/attempts/${attemptId}/answers`, answer);
    }
    await call("POST", `${BASE}/attempts/${attemptId}/complete`);

    const day2 = await call<DayDetail>("GET", `${BASE}/days/2`);
    const attempt = await call<{ exercises: Exercise[] }>("POST", `${BASE}/days/2/attempts`);

    expect(day2.status).toBe("current");
    expect(day2.lesson.grammar.map((card) => card.title)).toEqual([
      "Match a word to its meaning",
      "Similar or opposite",
      "Judge a statement with a word",
    ]);
    expect(day2.exercises.map((exercise) => exercise.id)).toEqual(attempt.exercises.map((exercise) => exercise.id));
    expect(attempt.exercises).toHaveLength(4);
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
});
