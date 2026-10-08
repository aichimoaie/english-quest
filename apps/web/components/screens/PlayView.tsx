"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExercisePlayer } from "@/components/exercises/ExercisePlayer";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { ApiError } from "@/lib/api/errors";
import { useCompleteAttempt, useDay, useRatePronunciation, useStartAttempt, useSubmitAnswer } from "@/lib/api/hooks";
import type { StartedAttempt } from "@/lib/api/types";

/** Starts one run of a day and plays its exercises. The server grades every answer. */
export function PlayView({ day: dayNumber }: { day: number }) {
  const router = useRouter();
  const detail = useDay(dayNumber);
  const start = useStartAttempt(dayNumber);
  const submitAnswer = useSubmitAnswer();
  const ratePronunciation = useRatePronunciation();
  const complete = useCompleteAttempt(dayNumber);
  const [attempt, setAttempt] = useState<StartedAttempt | null>(null);
  const requested = useRef(false);
  const { mutate: startRun } = start;

  // Starts exactly one run per visit. The ref guards against React's double effect in development.
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    startRun(undefined, { onSuccess: setAttempt });
  }, [startRun]);

  function retryStart() {
    requested.current = true;
    startRun(undefined, { onSuccess: setAttempt });
  }

  if (start.isError) {
    const message = start.error instanceof ApiError ? start.error.problem.detail ?? start.error.message : undefined;
    return (
      <div className="stack">
        <ErrorState
          message={message ?? "We could not start this run. Try again in a moment."}
          action={
            <div className="row">
              <Link className="btn btn-secondary" href={`/days/${dayNumber}`}>
                Back to day {dayNumber}
              </Link>
              {start.error instanceof ApiError && start.error.status === 409 ? null : (
                <button type="button" className="btn btn-primary" onClick={retryStart}>
                  Try again
                </button>
              )}
            </div>
          }
        />
      </div>
    );
  }

  if (!attempt || detail.isPending) return <LoadingState label="Getting your questions…" />;

  return (
    <div className="stack">
      <Link href={`/days/${dayNumber}`} className="back">
        Leave practice
      </Link>
      <p className="t-label">Day {dayNumber}: {detail.data?.title}</p>
      <ExercisePlayer
        exercises={attempt.exercises}
        submit={(exercise, submitted) =>
          submitAnswer.mutateAsync({ attemptId: attempt.attemptId, input: { exerciseId: exercise.id, submitted } })
        }
        rate={(exercise, rating) =>
          ratePronunciation.mutateAsync({ itemId: exercise.id, method: "recognition", selfRating: rating })
        }
        finishLabel="See my result"
        onFinish={async () => {
          await complete.mutateAsync(attempt.attemptId);
          router.push(`/days/${dayNumber}/summary`);
        }}
      />
    </div>
  );
}
