import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LessonIntro } from "./LessonIntro";

const day = { label: "Day 1", title: "Sample day heading", intro: "A short sample introduction." };

describe("LessonIntro", () => {
  it("shows the part, the day and every panel before the continue button", () => {
    render(
      <LessonIntro
        part={{ label: "Part I", title: "Sample part", text: "Sample foreword text." }}
        day={day}
        panels={[
          { kind: "tip", title: "Tip", body: "Sample tip." },
          { kind: "example", title: "Examples", items: ["First sample.", "Second sample."] },
          { kind: "hint", title: "Hint", body: "Sample hint." },
          { kind: "explain", title: "Explanation", body: "Sample explanation." },
        ]}
        ctaLabel="Start practice"
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByText("Part I")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sample part" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sample day heading" })).toBeTruthy();
    expect(screen.getByText("Sample tip.")).toBeTruthy();
    expect(screen.getByText("First sample.")).toBeTruthy();
    expect(screen.getByText("Sample hint.")).toBeTruthy();
    expect(screen.getByText("Sample explanation.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start practice" })).toBeTruthy();
  });

  it("renders without the optional part and panels", () => {
    render(<LessonIntro day={day} ctaLabel="Continue" onContinue={vi.fn()} />);

    expect(screen.queryByText("Part I")).toBeNull();
    expect(screen.getByRole("heading", { name: "Sample day heading" })).toBeTruthy();
  });

  it("calls onContinue when the learner presses the button", () => {
    const onContinue = vi.fn();
    render(<LessonIntro day={day} ctaLabel="Continue" onContinue={onContinue} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
