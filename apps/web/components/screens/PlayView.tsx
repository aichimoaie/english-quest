"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExercisePlayer } from "@/components/exercises/ExercisePlayer";
import { LessonIntro } from "@/components/lesson/LessonIntro";
import { lessonPanels } from "@/components/lesson/lessonPanels";
import { DayEndScreen } from "@/components/screens/DayEndScreen";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { ApiError } from "@/lib/api/errors";
import { useCompleteAttempt, useDay, useRatePronunciation, useStartAttempt, useSubmitAnswer } from "@/lib/api/hooks";
import type { StartedAttempt } from "@/lib/api/types";

/**
 * Plays one run of a day screen by screen, in the order the day lists them: a text
 * screen (Start, then Next), then for each test its intro (Start), its items and its
 * results screen with the test's score (Next). After the last test comes the day end.
 * The server grades every answer and saves the run when the learner finishes the day.
 */
export function PlayView({ day: dayNumber }: { day: number }) {
  const router = useRouter();
  const detail = useDay(dayNumber);
  const start = useStartAttempt(dayNumber);
  const submitAnswer = useSubmitAnswer();
  const ratePronunciation = useRatePronunciation();
  const complete = useCompleteAttempt(dayNumber);
  const [attempt, setAttempt] = useState<StartedAttempt | null>(null);
  const [screenIndex, setScreenIndex] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
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

  function advance() {
    setTestStarted(false);
    setScreenIndex((current) => current + 1);
  }

  async function finishDay(runId: string) {
    setFinishError(null);
    try {
      await complete.mutateAsync(runId);
      router.push(`/days/${dayNumber}/summary`);
    } catch {
      setFinishError("We could not save this run. Try again.");
    }
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

  if (detail.isError) {
    return (
      <div className="stack">
        <ErrorState
          message="We could not load this day. Try again in a moment."
          action={
            <button type="button" className="btn btn-primary" onClick={() => void detail.refetch()}>
              Try again
            </button>
          }
        />
      </div>
    );
  }

  if (!attempt || detail.isPending) return <LoadingState label="Getting your questions…" />;

  const title = detail.data.title;
  const screens = detail.data.screens;
  const leave = (
    <Link href={`/days/${dayNumber}`} className="back">
      Leave practice
    </Link>
  );

  if (screens.length === 0) {
    return (
      <div className="stack">
        {leave}
        <p className="t-small">There are no exercises for this day yet.</p>
      </div>
    );
  }

  if (screenIndex >= screens.length) {
    return (
      <div className="stack">
        {leave}
        <DayEndScreen
          dayNumber={dayNumber}
          title={title}
          finishing={complete.isPending}
          error={finishError}
          onFinish={() => void finishDay(attempt.attemptId)}
        />
      </div>
    );
  }

  const screen = screens[screenIndex];

  if (screen.kind === "text") {
    return (
      <div className="stack">
        {leave}
        <p className="t-label">
          Day {dayNumber}: {title}
        </p>
        <LessonIntro
          day={{ label: `Day ${dayNumber}`, title: screen.title }}
          panels={lessonPanels(screen.cards)}
          ctaLabel={screenIndex === 0 ? "Start" : "Next"}
          onContinue={advance}
        />
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="stack">
        {leave}
        <p className="t-label">
          Day {dayNumber}: {title}
        </p>
        <LessonIntro
          day={{ label: "Test", title: screen.title, intro: screen.intro }}
          ctaLabel="Start"
          onContinue={() => setTestStarted(true)}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      {leave}
      <p className="t-label">
        Day {dayNumber}: {title}
      </p>
      <ExercisePlayer
        key={screen.id}
        exercises={screen.exercises}
        submit={(exercise, submitted) =>
          submitAnswer.mutateAsync({ attemptId: attempt.attemptId, input: { exerciseId: exercise.id, submitted } })
        }
        rate={(exercise, rating) =>
          ratePronunciation.mutateAsync({ itemId: exercise.id, method: "recognition", selfRating: rating })
        }
        finishLabel="Next"
        explain={screen.explain}
        onFinish={async () => advance()}
      />
    </div>
  );
}
