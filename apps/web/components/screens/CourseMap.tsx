"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/IconSprite";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useDays, useProgress } from "@/lib/api/hooks";
import { TOTAL_DAYS } from "@/lib/course";
import { cx } from "@/lib/cx";

const STATUS_LABEL = { done: "Done", current: "Today", locked: "Locked" } as const;

export function CourseMap() {
  const days = useDays();
  const progress = useProgress();

  if (days.isPending) return <LoadingState label="Loading your course…" />;
  if (days.isError) {
    return <ErrorState action={<button type="button" className="btn btn-secondary" onClick={() => days.refetch()}>Try again</button>} />;
  }

  const completed = days.data.filter((day) => day.status === "done").length;
  const current = days.data.find((day) => day.status === "current");

  return (
    <div className="stack">
      <header className="stack" style={{ gap: "var(--s-2)" }}>
        <p className="t-label">30-day course</p>
        <h1 className="t-title">Your path</h1>
        <p className="lede">Days unlock in order. Finish a day with 70% or more to open the next one.</p>
      </header>

      <section className="card stack" style={{ gap: "var(--s-3)" }}>
        <ProgressBar value={(completed / TOTAL_DAYS) * 100} label={`${completed} of ${TOTAL_DAYS} days complete`} />
        {progress.data ? (
          <p className="t-small">
            <span className="streak">
              <Icon name="flame" className="sm" /> {progress.data.streak.current}-day streak
            </span>{" "}
            · longest {progress.data.streak.longest}
          </p>
        ) : null}
        {current ? (
          <Link className="btn btn-primary btn-block" href={`/days/${current.dayNumber}`}>
            Open day {current.dayNumber}: {current.title}
          </Link>
        ) : null}
      </section>

      <nav aria-label="All days">
        <div className="map">
          {days.data.map((day) => {
            const label = `Day ${day.dayNumber}: ${day.title}, ${STATUS_LABEL[day.status].toLowerCase()}`;
            const content = (
              <>
                {day.dayNumber}
                <small>{STATUS_LABEL[day.status]}</small>
              </>
            );
            return day.status === "locked" ? (
              <span key={day.dayNumber} className="day locked" aria-disabled="true" aria-label={label}>
                {content}
              </span>
            ) : (
              <Link key={day.dayNumber} href={`/days/${day.dayNumber}`} className={cx("day", day.status)} aria-label={label}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
