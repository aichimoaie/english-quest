import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  const running = { running: true, expired: false, secondsLeft: 300 };

  it("keeps the input closed until the set's clock is running", () => {
    renderExercise(timedRecall, { timer: { running: false, expired: false, secondsLeft: 300 } });

    expect((screen.getByRole("textbox") as HTMLInputElement).disabled).toBe(true);
  });

  it("opens the input and sends a checked answer while the clock runs", () => {
    const { onSubmit } = renderExercise(timedRecall, { timer: running });

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "cottage" } });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(onSubmit).toHaveBeenCalledWith({ text: "cottage" });
  });

  it("sends the typed answer when the set's clock runs out, without a check", () => {
    const onSubmit = vi.fn<(submitted: Submitted) => void>();
    const { rerender } = render(
      <ExerciseRenderer exercise={timedRecall} result={null} busy={false} onSubmit={onSubmit} timer={running} />,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "cottage" } });
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <ExerciseRenderer
        exercise={timedRecall}
        result={null}
        busy={false}
        onSubmit={onSubmit}
        timer={{ running: true, expired: true, secondsLeft: 0 }}
      />,
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ text: "cottage" });
    expect(screen.queryByRole("button", { name: "Check answer" })).toBeNull();
  });

  it("does not send a second time once the server has answered", () => {
    const onSubmit = vi.fn<(submitted: Submitted) => void>();
    const { rerender } = render(
      <ExerciseRenderer
        exercise={timedRecall}
        result={null}
        busy={false}
        onSubmit={onSubmit}
        timer={{ running: true, expired: true, secondsLeft: 0 }}
      />,
    );
    rerender(
      <ExerciseRenderer
        exercise={timedRecall}
        result={answered}
        busy={false}
        onSubmit={onSubmit}
        timer={{ running: true, expired: true, secondsLeft: 0 }}
      />,
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
