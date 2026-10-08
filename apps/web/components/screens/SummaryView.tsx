"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/IconSprite";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { useDay, queryKeys } from "@/lib/api/hooks";
import { PASS_MARK_PCT } from "@/lib/course";
import type { CompletedAttempt } from "@/lib/api/types";

export function SummaryView({ day: dayNumber }: { day: number }) {
  const queryClient = useQueryClient();
  const detail = useDay(dayNumber);
  // The result of the run that just finished, kept in the query cache by useCompleteAttempt.
  const result = queryClient.getQueryData<CompletedAttempt>(queryKeys.runResult(dayNumber));

  if (detail.isPending) return <LoadingState label="Loading your result…" />;
  if (detail.isError) return <ErrorState />;

  const best = detail.data.bestScorePct;

  if (!result) {
    return (
      <div className="stack">
        <h1 className="t-title">Day {dayNumber} result</h1>
        <div className="card stack">
          <p>
            Your run result is only kept for this visit. {best !== null ? `Your best score for this day is ${best}%.` : "Practise the day to see a score."}
          </p>
          <Link className="btn btn-primary btn-block" href={`/days/${dayNumber}`}>
            Back to day {dayNumber}
          </Link>
        </div>
      </div>
    );
  }

  const passed = result.status === "passed";

  return (
    <div className="stack">
      <span className={`chip ${passed ? "ok" : ""}`}>
        {passed ? <Icon name="check" className="sm" /> : null}
        {passed ? "Day complete" : "Almost there"}
      </span>
      <h1 className="t-display">{result.scorePct}%</h1>
      <p className="t-body">
        {passed
          ? `Good work. You reached ${PASS_MARK_PCT}%.${result.nextDay ? ` Day ${result.nextDay} is now open.` : ""}`
          : `You need ${PASS_MARK_PCT}% to finish. Try the day again; your best run is saved.`}
      </p>

      <div className="stack">
        {passed && result.nextDay ? (
          <Link className="btn btn-primary btn-block" href={`/days/${result.nextDay}`}>
            Start day {result.nextDay}
          </Link>
        ) : null}
        <Link className={`btn ${passed ? "btn-secondary" : "btn-primary"} btn-block`} href={passed ? "/course" : `/days/${dayNumber}/play`}>
          {passed ? "Back to my course" : "Try the day again"}
        </Link>
        {passed ? null : (
          <Link className="btn btn-ghost btn-block" href={`/days/${dayNumber}`}>
            Back to day {dayNumber}
          </Link>
        )}
      </div>
    </div>
  );
}
