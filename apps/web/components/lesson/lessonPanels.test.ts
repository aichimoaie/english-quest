import { describe, expect, it } from "vitest";
import type { GrammarPoint } from "@/lib/api/types";
import { lessonPanels } from "./lessonPanels";

const cards: GrammarPoint[] = [
  { title: "Point one", explanation: "Sample explanation one.", watchOut: null, examples: ["Example A.", "Example B."] },
  { title: "Point two", explanation: "Sample explanation two.", watchOut: null, examples: [] },
];

describe("lessonPanels", () => {
  it("turns each card and its examples into intro panels, in order", () => {
    expect(lessonPanels(cards)).toEqual([
      { kind: "explain", title: "Point one", body: "Sample explanation one." },
      { kind: "example", title: "Examples", items: ["Example A.", "Example B."] },
      { kind: "explain", title: "Point two", body: "Sample explanation two." },
    ]);
  });

  it("returns no panels for a screen with no cards", () => {
    expect(lessonPanels([])).toEqual([]);
  });
});
