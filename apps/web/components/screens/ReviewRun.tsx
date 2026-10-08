"use client";

import Link from "next/link";
import { useState } from "react";
import { ExercisePlayer } from "@/components/exercises/ExercisePlayer";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { useReview, useSubmitReviewAnswer } from "@/lib/api/hooks";

export function ReviewRun({ mode }: { mode: "daily" | "mixed" }) {
  const query = useReview(mode);
  const submitReviewAnswer = useSubmitReviewAnswer();
  const [finished, setFinished] = useState(false);
  const title = mode === "daily" ? "Daily review" : "Mixed review";

  if (query.isPending) return <LoadingState label="Getting your review…" />;
  if (query.isError) return <ErrorState />;

  if (finished) {
    return (
      <div className="stack">
        <h1 className="t-title">{title} done</h1>
        <p className="t-body">Nice work. Your progress for each day is unchanged.</p>
        <Link className="btn btn-primary btn-block" href="/review">
          Back to review
        </Link>
      </div>
    );
  }

  if (query.data.items.length === 0) {
    return (
      <div className="stack">
        <h1 className="t-title">{title}</h1>
        <div className="card flat">
          <p>Nothing to review yet. Finish a day first, then come back here.</p>
        </div>
        <Link className="btn btn-secondary btn-block" href="/course">
          Go to my course
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <header className="stack" style={{ gap: "var(--s-2)" }}>
        <p className="t-label">{title}</p>
        <h1 className="t-title">Practice from earlier days</h1>
      </header>
      <ExercisePlayer
        exercises={query.data.items}
        submit={(exercise, submitted) => submitReviewAnswer.mutateAsync({ exerciseId: exercise.id, submitted })}
        finishLabel="Finish review"
        onFinish={async () => setFinished(true)}
      />
    </div>
  );
}
