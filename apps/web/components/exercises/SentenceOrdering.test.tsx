import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Exercise } from "@/lib/api/types";
import { SentenceOrdering } from "./SentenceOrdering";
import { VocabularyMatching } from "./VocabularyMatching";

type Ordering = Extract<Exercise, { kind: "sentence_ordering" }>;
type Matching = Extract<Exercise, { kind: "vocabulary_matching" }>;

const orderingExercise: Ordering = {
  id: "ex_order",
  kind: "sentence_ordering",
  instructions: "Order the words.",
  points: 1,
  content: { words: ["is", "Ana", "name", "My"] },
};

const matchingExercise: Matching = {
  id: "ex_match",
  kind: "vocabulary_matching",
  instructions: "Match.",
  points: 2,
  content: { words: ["teacher", "student"], meanings: ["someone who learns", "someone who teaches"] },
};

describe("SentenceOrdering", () => {
  it("sends the words in the order the learner tapped them", () => {
    const onSubmit = vi.fn();
    render(<SentenceOrdering exercise={orderingExercise} result={null} busy={false} onSubmit={onSubmit} />);

    const check = screen.getByRole("button", { name: "Check answer" });
    expect((check as HTMLButtonElement).disabled).toBe(true);

    for (const word of ["My", "name", "is", "Ana"]) {
      fireEvent.click(screen.getByRole("button", { name: word }));
    }
    fireEvent.click(check);

    expect(onSubmit).toHaveBeenCalledWith({ order: ["My", "name", "is", "Ana"] });
  });
});

describe("VocabularyMatching", () => {
  it("collects pairs and submits them once every word is paired", () => {
    const onSubmit = vi.fn();
    render(<VocabularyMatching exercise={matchingExercise} result={null} busy={false} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "teacher" }));
    fireEvent.click(screen.getByRole("button", { name: "someone who teaches" }));
    fireEvent.click(screen.getByRole("button", { name: "student" }));
    fireEvent.click(screen.getByRole("button", { name: "someone who learns" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(onSubmit).toHaveBeenCalledWith({
      pairs: { teacher: "someone who teaches", student: "someone who learns" },
    });
  });

  it("keeps the check button disabled while a word is unpaired", () => {
    render(<VocabularyMatching exercise={matchingExercise} result={null} busy={false} onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "teacher" }));
    fireEvent.click(screen.getByRole("button", { name: "someone who teaches" }));

    expect((screen.getByRole("button", { name: "Check answer" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
