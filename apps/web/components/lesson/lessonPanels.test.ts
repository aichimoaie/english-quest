import { describe, expect, it } from "vitest";
import type { Lesson } from "@/lib/api/types";
import { lessonPanels } from "./lessonPanels";

const lesson: Lesson = {
  vocabulary: [{ word: "candid", definition: "Sample definition.", example: "Sample example." }],
  grammar: [
    { title: "Point one", explanation: "Sample explanation one.", watchOut: null, examples: ["Example A.", "Example B."] },
    { title: "Point two", explanation: "Sample explanation two.", watchOut: null, examples: [] },
  ],
};

describe("lessonPanels", () => {
  it("turns each grammar point and the new words into intro panels, in order", () => {
    expect(lessonPanels(lesson)).toEqual([
      { kind: "explain", title: "Point one", body: "Sample explanation one." },
      { kind: "example", title: "Examples", items: ["Example A.", "Example B."] },
      { kind: "explain", title: "Point two", body: "Sample explanation two." },
      { kind: "example", title: "New words", items: ["candid: Sample definition."] },
    ]);
  });

  it("returns no panels for an empty lesson", () => {
    expect(lessonPanels({ vocabulary: [], grammar: [] })).toEqual([]);
  });
});
