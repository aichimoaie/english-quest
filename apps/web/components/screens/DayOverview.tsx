"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/IconSprite";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { useDay } from "@/lib/api/hooks";
import { cx } from "@/lib/cx";

export function DayOverview({ day: dayNumber }: { day: number }) {
  const day = useDay(dayNumber);

  if (day.isPending) return <LoadingState label="Loading this day…" />;
  if (day.isError) {
    return <ErrorState action={<button type="button" className="btn btn-secondary" onClick={() => day.refetch()}>Try again</button>} />;
  }

  const detail = day.data;
  const locked = detail.status === "locked";
  const hasContent = detail.exercises.length > 0;
  const chip = detail.status === "done" ? "ok" : detail.status === "current" ? "brand" : "";
  const chipText = detail.status === "done" ? "Done" : detail.status === "current" ? "Today" : "Locked";

  return (
    <div className="stack">
      <Link href="/course" className="back">
        <Icon name="back" /> Course
      </Link>

      <div className="day-hero">
        <span className="num" aria-hidden="true">
          {detail.dayNumber}
        </span>
        <div>
          <p className="t-label">Day {detail.dayNumber} of 30</p>
          <h1 className="t-title">{detail.title}</h1>
        </div>
      </div>

      <div className="row">
        <span className={cx("chip", chip)}>
          {detail.status === "locked" ? <Icon name="lock" className="sm" /> : null}
          {chipText}
        </span>
        {detail.bestScorePct !== null ? <span className="chip">Best {detail.bestScorePct}%</span> : null}
      </div>

      <section className="card stack" style={{ gap: "var(--s-2)" }}>
        <h2 className="t-label">Today’s goal</h2>
        <p className="t-body">{detail.objective}</p>
        {hasContent ? <p className="t-small">{detail.exercises.length} questions · you need 70% in one run to finish the day</p> : null}
      </section>

      {locked ? (
        <div className="card tint">
          <p>Finish day {detail.dayNumber - 1} to unlock this day.</p>
        </div>
      ) : !hasContent ? (
        <div className="card flat">
          <p>This day’s lesson and practice are not published yet.</p>
        </div>
      ) : (
        <div className="stack">
          <Link className="btn btn-secondary btn-block" href={`/days/${detail.dayNumber}/lesson`}>
            Read the lesson
          </Link>
          <Link className="btn btn-primary btn-block" href={`/days/${detail.dayNumber}/play`}>
            {detail.status === "done" ? "Practise again" : "Start practice"}
          </Link>
        </div>
      )}
    </div>
  );
}
