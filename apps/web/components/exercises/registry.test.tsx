import { describe, expect, it } from "vitest";
import type { ExerciseKind } from "@/lib/api/types";
import { exerciseRegistry } from "./registry";

describe("exercise registry", () => {
  it("has one renderer for each of the eleven exercise types", () => {
    const expected: ExerciseKind[] = [
      "multiple_choice",
      "fill_blank",
      "sentence_ordering",
      "vocabulary_matching",
      "spelling_correction",
      "listening_comprehension",
      "pronunciation_practice",
      "find_misspelled",
      "self_check",
      "right_wrong",
      "timed_recall",
    ];

    expect(Object.keys(exerciseRegistry).sort()).toEqual([...expected].sort());
    for (const kind of expected) {
      expect(typeof exerciseRegistry[kind]).toBe("function");
    }
  });
});
