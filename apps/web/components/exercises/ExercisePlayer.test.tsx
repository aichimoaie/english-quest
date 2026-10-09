import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AnswerResult, Exercise } from "@/lib/api/types";
import { ExercisePlayer } from "./ExercisePlayer";

const exercises: Exercise[] = [
  {
    id: "ex_a",
    kind: "multiple_choice",
    instructions: "Pick one.",
    points: 1,
    content: { prompt: "Which is correct?", options: ["am", "is"] },
  },
  {
    id: "ex_b",
    kind: "fill_blank",
    instructions: "Type the word.",
    points: 1,
    content: { sentence: "They ____ here.", hint: null },
  },
];

describe("ExercisePlayer", () => {
  it("does not show correct or incorrect until the server has answered", () => {
    const submit = vi.fn<(...args: unknown[]) => Promise<AnswerResult>>();
    render(<ExercisePlayer exercises={exercises} submit={submit} onFinish={vi.fn()} finishLabel="Finish" />);

    fireEvent.click(screen.getByRole("button", { name: "am" }));
    expect(screen.queryByText("Correct")).toBeNull();
    expect(screen.queryByText("Not quite")).toBeNull();
    expect(submit).not.toHaveBeenCalled();
  });

  it("sends the learner's response and shows the server's feedback", async () => {
    const submit = vi.fn(async () => ({
      isCorrect: false,
      expected: "is",
      explanation: "Use is with one subject.",
      feedbackKey: "be.one",
    }));
    render(<ExercisePlayer exercises={exercises} submit={submit} onFinish={vi.fn()} finishLabel="Finish" />);

    fireEvent.click(screen.getByRole("button", { name: "am" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(await screen.findByText("Not quite")).toBeTruthy();
    expect(submit).toHaveBeenCalledWith(exercises[0], { optionIndex: 0 });
    expect(screen.getByText(/The answer is: is/)).toBeTruthy();
  });

  it("shows a self-check answer as a note, not a right or wrong verdict", async () => {
    const selfCheck: Exercise[] = [
      { id: "ex_self", kind: "self_check", instructions: "Be honest.", points: 1, content: { prompt: "I has two books." } },
    ];
    const submit = vi.fn(async () => ({ isCorrect: false, expected: "No", explanation: "Say have.", feedbackKey: "self" }));
    render(<ExercisePlayer exercises={selfCheck} submit={submit} onFinish={vi.fn()} finishLabel="Finish" />);

    fireEvent.click(screen.getByRole("button", { name: "Yes, I often say this" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(await screen.findByText("Noted")).toBeTruthy();
    expect(screen.queryByText("Not quite")).toBeNull();
    expect(screen.queryByText(/The answer is:/)).toBeNull();
  });

  it("moves to the next item and finishes after the last one", async () => {
    const submit = vi.fn(async () => ({ isCorrect: true, explanation: "Yes.", feedbackKey: "ok" }));
    const onFinish = vi.fn(async () => undefined);
    render(<ExercisePlayer exercises={exercises} submit={submit} onFinish={onFinish} finishLabel="See result" />);

    fireEvent.click(screen.getByRole("button", { name: "is" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));

    expect(screen.getByText("Question 2 of 2")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Type here"), { target: { value: "are" } });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "See my results" }));

    expect(screen.getByText("Your result")).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "See result" }));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
  });

  it("does not mark a self-rating as chosen when it fails to save", async () => {
    const pronunciation: Exercise[] = [
      {
        id: "ex_say",
        kind: "pronunciation_practice",
        instructions: "Listen, then choose the word you hear.",
        points: 1,
        content: { audioUrl: null, options: ["ship", "sheep"] },
      },
    ];
    const submit = vi.fn(async () => ({ isCorrect: true, explanation: "Yes.", feedbackKey: "ok" }));
    const rate = vi.fn(async () => {
      throw new Error("offline");
    });
    render(<ExercisePlayer exercises={pronunciation} submit={submit} rate={rate} onFinish={vi.fn()} finishLabel="Finish" />);

    fireEvent.click(screen.getByRole("button", { name: "sheep" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "Got it" }));

    expect(await screen.findByText(/could not save your self-rating/)).toBeTruthy();
    expect(rate).toHaveBeenCalledWith(pronunciation[0], "got_it");
    expect(screen.getByRole("button", { name: "Got it" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("records one self-rating per item while a save is in flight and after it is saved", async () => {
    const pronunciation: Exercise[] = [
      {
        id: "ex_say",
        kind: "pronunciation_practice",
        instructions: "Listen, then choose the word you hear.",
        points: 1,
        content: { audioUrl: null, options: ["ship", "sheep"] },
      },
    ];
    const submit = vi.fn(async () => ({ isCorrect: true, explanation: "Yes.", feedbackKey: "ok" }));
    let finishSave: () => void = () => undefined;
    const rate = vi.fn(() => new Promise<void>((resolve) => {
      finishSave = resolve;
    }));
    render(<ExercisePlayer exercises={pronunciation} submit={submit} rate={rate} onFinish={vi.fn()} finishLabel="Finish" />);

    fireEvent.click(screen.getByRole("button", { name: "sheep" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "Got it" }));
    fireEvent.click(screen.getByRole("button", { name: "Needs practice" }));
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));

    expect(rate).toHaveBeenCalledTimes(1);
    expect((screen.getByRole("button", { name: "Needs practice" }) as HTMLButtonElement).disabled).toBe(true);

    finishSave();

    await waitFor(() => expect(screen.getByRole("button", { name: "Got it" }).getAttribute("aria-pressed")).toBe("true"));
    expect((screen.getByRole("button", { name: "Got it" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Needs practice" }));
    expect(rate).toHaveBeenCalledTimes(1);
  });

  it("does not let the learner continue until a self-rating save has completed", async () => {
    const pronunciation: Exercise[] = [
      {
        id: "ex_say",
        kind: "pronunciation_practice",
        instructions: "Listen, then choose the word you hear.",
        points: 1,
        content: { audioUrl: null, options: ["ship", "sheep"] },
      },
    ];
    const submit = vi.fn(async () => ({ isCorrect: true, explanation: "Yes.", feedbackKey: "ok" }));
    let finishSave: () => void = () => undefined;
    const rate = vi.fn(() => new Promise<void>((resolve) => {
      finishSave = resolve;
    }));
    const onFinish = vi.fn(async () => undefined);
    render(<ExercisePlayer exercises={pronunciation} submit={submit} rate={rate} onFinish={onFinish} finishLabel="See result" />);

    fireEvent.click(screen.getByRole("button", { name: "sheep" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "Got it" }));
    await waitFor(() => expect(rate).toHaveBeenCalledTimes(1));

    expect((screen.getByRole("button", { name: "See my results" }) as HTMLButtonElement).disabled).toBe(true);

    finishSave();

    await waitFor(() => expect((screen.getByRole("button", { name: "See my results" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "See my results" }));
    fireEvent.click(screen.getByRole("button", { name: "See result" }));
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
  });

  it("shows a plain message when the server cannot check an answer", async () => {
    const submit = vi.fn(async () => {
      throw new Error("offline");
    });
    render(<ExercisePlayer exercises={exercises} submit={submit} onFinish={vi.fn()} finishLabel="Finish" />);

    fireEvent.click(screen.getByRole("button", { name: "am" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/could not check that answer/)).toBeTruthy();
  });
});

describe("ExercisePlayer recall set and end screen", () => {
  const recallSet: Exercise[] = [
    {
      id: "ex_r1",
      kind: "timed_recall",
      instructions: "Recall the word.",
      points: 1,
      content: { sentence: "A ____ is a small house.", hint: null },
    },
    {
      id: "ex_r2",
      kind: "timed_recall",
      instructions: "Recall the word.",
      points: 1,
      content: { sentence: "A ____ is a large house.", hint: null },
    },
  ];

  it("checks each recall item in turn with no clock, then shows the end screen", async () => {
    const submit = vi.fn(async () => ({ isCorrect: true, explanation: "Yes.", feedbackKey: "ok" }));
    const onFinish = vi.fn(async () => undefined);
    render(<ExercisePlayer exercises={recallSet} submit={submit} onFinish={onFinish} finishLabel="See result" />);

    expect(screen.queryByRole("button", { name: "Start timer" })).toBeNull();
    expect((screen.getByRole("button", { name: "Check answer" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "cottage" } });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));

    expect(screen.getByText("Question 2 of 2")).toBeTruthy();
    expect(submit).toHaveBeenCalledWith(recallSet[0], { text: "cottage" });

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "cottage" } });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "See my results" }));

    expect(screen.getByText("2 of 2 correct")).toBeTruthy();
    expect(screen.getByText("Every question was checked.")).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("lists each answer key on the end screen and finishes from there", async () => {
    const submit = vi.fn(async () => ({ isCorrect: true, expected: null, explanation: "Yes.", feedbackKey: "ok" }));
    const onFinish = vi.fn(async () => undefined);
    const pair: Exercise[] = [
      { id: "ex_mc", kind: "multiple_choice", instructions: "Pick.", points: 1, content: { prompt: "Which?", options: ["am", "is"] } },
    ];
    render(<ExercisePlayer exercises={pair} submit={submit} onFinish={onFinish} finishLabel="Save run" />);

    fireEvent.click(screen.getByRole("button", { name: "am" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "See my results" }));

    expect(screen.getByText("1 of 1 correct")).toBeTruthy();
    expect(screen.getByText("Every question was checked.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save run" }));
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
  });
});
