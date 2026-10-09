import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DayDetail, Exercise, StartedAttempt } from "@/lib/api/types";
import { PlayView } from "./PlayView";

const api = vi.hoisted(() => ({
  getDay: vi.fn(),
  startAttempt: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ api }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const exercises: Exercise[] = [
  {
    id: "ex_a",
    kind: "multiple_choice",
    instructions: "Pick one.",
    points: 1,
    content: { prompt: "Which is correct?", options: ["am", "is"] },
  },
];

const day: DayDetail = {
  dayNumber: 1,
  title: "Be",
  objective: "Use am, is and are.",
  status: "current",
  bestScorePct: null,
  lesson: { vocabulary: [], grammar: [] },
  exercises,
};

const attempt: StartedAttempt = { attemptId: "att_1", exercises };

function renderPlayView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayView day={1} />
    </QueryClientProvider>,
  );
}

describe("PlayView when the day fails to load", () => {
  beforeEach(() => {
    api.getDay.mockReset();
    api.startAttempt.mockReset();
    api.startAttempt.mockResolvedValue(attempt);
  });

  it("shows an error and a retry control, and does not start the exercises", async () => {
    api.getDay.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(day);
    renderPlayView();

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("We could not load this day. Try again in a moment.")).toBeTruthy();
    expect(screen.queryByText("Pick one.")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Pick one.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(api.getDay).toHaveBeenCalledTimes(2);
  });
});
