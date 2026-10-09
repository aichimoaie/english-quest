import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnswerResult, Exercise, Submitted } from "@/lib/api/types";
import { ExerciseRenderer } from "./registry";
import type { ExerciseProps } from "./types";

const findMisspelled: Exercise = {
  id: "ex_find",
  kind: "find_misspelled",
  instructions: "Find the mistake.",
  points: 1,
  content: { prompt: "The parcel was recieved today.", options: ["parcel", "recieved", "today"] },
};

const selfCheck: Exercise = {
  id: "ex_self",
  kind: "self_check",
  instructions: "Be honest.",
  points: 1,
  content: { prompt: "I often say: I has two books." },
};

const rightWrong: Exercise = {
  id: "ex_rw",
  kind: "right_wrong",
  instructions: "Judge the sentence.",
  points: 1,
  content: { prompt: "She have two cats." },
};

const timedRecall: Exercise = {
  id: "ex_timed",
  kind: "timed_recall",
  instructions: "Recall the word.",
  points: 1,
  content: { sentence: "A ____ is a small house.", hint: "Starts with c.", timeLimitSeconds: 300 },
};

const answered: AnswerResult = { isCorrect: false, expected: "Wrong", explanation: "Use has with he or she.", feedbackKey: "has" };

function renderExercise(exercise: Exercise, props: Partial<ExerciseProps> = {}) {
  const onSubmit = vi.fn<(submitted: Submitted) => void>();
  const view = render(
    <ExerciseRenderer exercise={exercise} result={null} busy={false} onSubmit={onSubmit} {...props} />,
  );
  return { ...view, onSubmit };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("FindMisspelled", () => {
  it("sends the chosen word and the typed correction together", () => {
    const { onSubmit } = renderExercise(findMisspelled);

    expect(screen.getByRole("button", { name: "Check answer" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "recieved" }));
    fireEvent.change(screen.getByLabelText("Correct spelling"), { target: { value: "received" } });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(onSubmit).toHaveBeenCalledWith({ optionIndex: 1, text: "received" });
  });

  it("locks the choices and input once the server has answered", () => {
    renderExercise(findMisspelled, { result: { ...answered, isCorrect: true, expected: null } });

    expect(screen.getByRole("button", { name: "recieved" }).hasAttribute("disabled")).toBe(true);
    expect((screen.getByLabelText("Correct spelling") as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Check answer" })).toBeNull();
  });
});

describe("SelfCheck", () => {
  it("offers yes and no and sends the chosen index", () => {
    const { onSubmit } = renderExercise(selfCheck);

    fireEvent.click(screen.getByRole("button", { name: "No, I do not" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(onSubmit).toHaveBeenCalledWith({ optionIndex: 1 });
  });
});

describe("RightWrongTable", () => {
  it("offers right and wrong as a pair and sends the chosen index", () => {
    const { onSubmit } = renderExercise(rightWrong);

    fireEvent.click(screen.getByRole("button", { name: "Wrong" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(onSubmit).toHaveBeenCalledWith({ optionIndex: 1 });
  });

  it("marks the server's right answer once the learner has checked", () => {
    renderExercise(rightWrong, { result: answered });

    expect(screen.getByRole("button", { name: "Wrong" }).className).toContain("matched");
    expect(screen.getByRole("button", { name: "Right" }).className).not.toContain("matched");
  });
});

describe("TimedRecall", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the input closed until the learner starts the clock", () => {
    renderExercise(timedRecall);

    expect((screen.getByRole("textbox") as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText("5:00")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
    expect((screen.getByRole("textbox") as HTMLInputElement).disabled).toBe(false);
    expect(screen.getByText("Running")).toBeTruthy();
  });

  it("sends the typed answer when the clock runs out, even without a check", () => {
    vi.useFakeTimers();
    const { onSubmit } = renderExercise(timedRecall);

    fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "cottage" } });
    act(() => {
      vi.advanceTimersByTime(299_000);
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("0:01")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ text: "cottage" });
    expect(screen.getByText("Time is up")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Check answer" })).toBeNull();
  });

  it("does not submit a second time when the server answers after time is up", () => {
    vi.useFakeTimers();
    const { onSubmit, rerender } = renderExercise(timedRecall);

    fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
    act(() => {
      vi.advanceTimersByTime(300_000);
    });
    rerender(<ExerciseRenderer exercise={timedRecall} result={answered} busy={false} onSubmit={onSubmit} />);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
