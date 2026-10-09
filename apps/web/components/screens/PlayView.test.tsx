import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnswerResult, DayDetail, Exercise, StartedAttempt } from "@/lib/api/types";
import { PlayView } from "./PlayView";

const api = vi.hoisted(() => ({
  getDay: vi.fn(),
  startAttempt: vi.fn(),
  submitAnswer: vi.fn(),
  completeAttempt: vi.fn(),
  ratePronunciation: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ api }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const first: Exercise = {
  id: "ex_first",
  kind: "multiple_choice",
  instructions: "Pick one.",
  points: 1,
  content: { prompt: "First item?", options: ["am", "is"] },
};
const second: Exercise = {
  id: "ex_second",
  kind: "multiple_choice",
  instructions: "Pick one.",
  points: 1,
  content: { prompt: "Second item?", options: ["are", "were"] },
};
const third: Exercise = {
  id: "ex_third",
  kind: "multiple_choice",
  instructions: "Pick one.",
  points: 1,
  content: { prompt: "Third item?", options: ["is", "are"] },
};
const selfCheck: Exercise = {
  id: "ex_self",
  kind: "self_check",
  instructions: "Choose the answer that is true for you.",
  points: 0,
  content: { prompt: "He done, I seen." },
};

/** The server grades option 0 as right for every item in this fixture. */
const correctOption = 0;

const day: DayDetail = {
  dayNumber: 1,
  title: "Be",
  objective: "Use am, is and are.",
  status: "current",
  bestScorePct: null,
  vocabulary: [],
  screens: [
    {
      kind: "text",
      id: "d01-screen-intro",
      title: "Day intro",
      cards: [{ title: "Intro card", explanation: "Read this first.", watchOut: null, examples: [] }],
    },
    { kind: "test", id: "d01-test-1", title: "Test 1: Be", intro: "Choose the right form.", exercises: [first, second], explain: false },
    { kind: "test", id: "d01-test-2", title: "Test 2: Are", intro: "Choose again.", exercises: [third], explain: false },
  ],
};

const attempt: StartedAttempt = { attemptId: "att_1" };

function renderPlayView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayView day={1} />
    </QueryClientProvider>,
  );
}

/** Option buttons read "A am", "B is": the key letter comes first, so match the end of the name. */
function option(text: string) {
  return new RegExp(`(^|\\s)${text}$`);
}

/** Answers with the option the learner picked, graded the way the server would grade it. */
function gradeLikeTheServer(_attemptId: string, input: { exerciseId: string; submitted: { optionIndex: number } }): Promise<AnswerResult> {
  return Promise.resolve({
    isCorrect: input.submitted.optionIndex === correctOption,
    expected: "Answer key.",
    explanation: `Explanation for ${input.exerciseId}.`,
    feedbackKey: "test.key",
  });
}

beforeEach(() => {
  api.getDay.mockReset();
  api.startAttempt.mockReset();
  api.submitAnswer.mockReset();
  api.completeAttempt.mockReset();
  api.ratePronunciation.mockReset();
  api.startAttempt.mockResolvedValue(attempt);
  api.submitAnswer.mockImplementation(gradeLikeTheServer);
  api.completeAttempt.mockResolvedValue({ scorePct: 67, status: "not_passed", dayStatus: "current", nextDay: null });
});

describe("PlayView when the day fails to load", () => {
  it("shows an error and a retry control, and does not start the day", async () => {
    api.getDay.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(day);
    renderPlayView();

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("We could not load this day. Try again in a moment.")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Day intro" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Day intro" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(api.getDay).toHaveBeenCalledTimes(2);
  });
});

describe("PlayView screen order", () => {
  it("runs the day intro, each test with its score, then the day end, in that order", async () => {
    api.getDay.mockResolvedValue(day);
    renderPlayView();

    // The day intro comes first, and no item is shown before its test starts.
    expect(await screen.findByRole("heading", { name: "Day intro" })).toBeTruthy();
    expect(screen.queryByText("First item?")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    // Test 1's intro, then its items. Its items are not shown until its own Start.
    expect(await screen.findByRole("heading", { name: "Test 1: Be" })).toBeTruthy();
    expect(screen.getByText("Choose the right form.")).toBeTruthy();
    expect(screen.queryByText("First item?")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    fireEvent.click(await screen.findByRole("button", { name: option("am") }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(await screen.findByText("Correct")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    fireEvent.click(await screen.findByRole("button", { name: option("were") }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(await screen.findByText("Not quite")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "See my results" }));

    // Test 1's results screen shows its own score: one of two right is 50%.
    expect(await screen.findByRole("heading", { name: "50% correct" })).toBeTruthy();
    expect(screen.queryByText("Explanation for ex_second.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Test 2's intro comes next, then its single item and its own score.
    expect(await screen.findByRole("heading", { name: "Test 2: Are" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(await screen.findByRole("button", { name: option("are") }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(await screen.findByText("Not quite")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "See my results" }));
    expect(await screen.findByRole("heading", { name: "0% correct" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // After the last test comes the day end, and only then is the run saved.
    expect(await screen.findByText("Day 1 complete")).toBeTruthy();
    expect(api.completeAttempt).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "See my result" }));
    await waitFor(() => expect(api.completeAttempt).toHaveBeenCalledWith("att_1"));
  });

  it("does not put the day end before the last test's results", async () => {
    api.getDay.mockResolvedValue(day);
    renderPlayView();

    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    fireEvent.click(await screen.findByRole("button", { name: option("am") }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: option("were") }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "See my results" }));

    expect(await screen.findByRole("heading", { name: "50% correct" })).toBeTruthy();
    expect(screen.queryByText("Day 1 complete")).toBeNull();
  });
});

describe("PlayView unscored test", () => {
  it("shows the explanations of a self-check test, with no score", async () => {
    api.getDay.mockResolvedValue({
      ...day,
      screens: [
        day.screens[0],
        { kind: "test", id: "d01-test-10", title: "Test 10: Check yourself", intro: "Be honest.", exercises: [selfCheck], explain: true },
      ],
    });
    renderPlayView();

    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    fireEvent.click(await screen.findByRole("button", { name: option("Yes, I often say this") }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "See my results" }));

    expect(await screen.findByRole("heading", { name: "Your answers are in" })).toBeTruthy();
    expect(screen.queryByText(/% correct/)).toBeNull();
    expect(screen.getByText("Explanation for ex_self.")).toBeTruthy();
  });
});
