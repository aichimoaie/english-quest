import { describe, expect, it } from "vitest";
import { isCorrect } from "./answer-keys";

describe("typed answer grading", () => {
  it("ignores case and surrounding spaces", () => {
    expect(isCorrect({ text: "  Ice Cream " }, { accepted: ["ice cream"] })).toBe(true);
  });

  it("keeps inner spacing significant, as the API grader does", () => {
    expect(isCorrect({ text: "ice  cream" }, { accepted: ["ice cream"] })).toBe(false);
  });
});
