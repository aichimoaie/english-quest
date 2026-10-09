"use client";

import { useEffect, useState } from "react";
import { Feedback, type FeedbackTone } from "@/components/ui/Feedback";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { AnswerResult, Exercise, Submitted } from "@/lib/api/types";
import { ExerciseEndScreen } from "./ExerciseEndScreen";
import { ExerciseRenderer } from "./registry";
import { formatClock } from "./timer";
import type { ExerciseOf, ExerciseTimer } from "./types";

interface ExercisePlayerProps {
  exercises: Exercise[];
  /** Sends one answer to the server and resolves with its feedback. */
  submit: (exercise: Exercise, submitted: Submitted) => Promise<AnswerResult>;
  /** Records a pronunciation self-rating. Optional: only pronunciation items use it. */
  rate?: (exercise: Exercise, rating: "got_it" | "needs_practice") => Promise<unknown>;
  /** Called when the learner finishes from the end screen. */
  onFinish: () => Promise<void>;
  finishLabel: string;
}

/** A self-check has no right answer, so its feedback is a note, not a verdict. */
function feedbackTone(exercise: Exercise, result: AnswerResult): FeedbackTone {
  if (exercise.kind === "self_check") return "note";
  return result.isCorrect ? "ok" : "bad";
}

function feedbackTitle(exercise: Exercise, result: AnswerResult): string {
  if (exercise.kind === "self_check") return "Noted";
  return result.isCorrect ? "Correct" : "Not quite";
}

/**
 * Runs one pass through a list of exercises, one per screen, then shows the end
 * screen. Grading happens on the server: this component sends each answer and
 * shows the feedback it gets. A timed set has one clock for all of its items.
 */
export function ExercisePlayer({ exercises, submit, rate, onFinish, finishLabel }: ExercisePlayerProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const [busy, setBusy] = useState(false);
  const [ended, setEnded] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiryFailed, setExpiryFailed] = useState(false);

  // One clock per set, taken from its timed items. Its end time is set when the learner presses Start.
  const timedItem = exercises.find((exercise): exercise is ExerciseOf<"timed_recall"> => exercise.kind === "timed_recall");
  const timeLimit = timedItem?.content.timeLimitSeconds ?? 0;
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(timeLimit);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    if (deadline === null || timeUp || ended) return;
    const tick = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 250);
    const expire = window.setTimeout(() => {
      setSecondsLeft(0);
      setTimeUp(true);
    }, Math.max(0, deadline - Date.now()));
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(expire);
    };
  }, [deadline, timeUp, ended]);

  const exercise = exercises[index];
  const result = exercise ? results[exercise.id] ?? null : null;
  const isLast = index === exercises.length - 1;
  // Time ran out. The end screen waits for the item on screen to be answered, because its typed answer is sent on expiry.
  const itemSettled = !exercise || exercise.kind !== "timed_recall" || result !== null;
  const showEnd = ended || (timeUp && itemSettled);

  function startClock() {
    setDeadline(Date.now() + timeLimit * 1000);
  }

  async function handleSubmit(submitted: Submitted) {
    if (!exercise) return;
    const sentAtExpiry = timeUp;
    setBusy(true);
    setError(null);
    try {
      const answer = await submit(exercise, submitted);
      setResults((current) => ({ ...current, [exercise.id]: answer }));
    } catch {
      if (sentAtExpiry) {
        setExpiryFailed(true);
        setError("The answer could not be sent when time ran out.");
      } else {
        setError("We could not check that answer. Check your connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleContinue() {
    if (!isLast) {
      setIndex((current) => current + 1);
      return;
    }
    setEnded(true);
  }

  async function handleFinish() {
    setFinishing(true);
    setError(null);
    try {
      await onFinish();
    } catch {
      setError("We could not save this run. Try again.");
      setFinishing(false);
    }
  }

  async function handleSelfRate(rating: "got_it" | "needs_practice") {
    if (!exercise || !rate) return false;
    setRatingSaving(true);
    try {
      await rate(exercise, rating);
      return true;
    } catch {
      setError("We could not save your self-rating. Your answer is still recorded.");
      return false;
    } finally {
      setRatingSaving(false);
    }
  }

  if (exercises.length === 0) {
    return <p className="t-small">There are no exercises for this day yet.</p>;
  }

  const answered = Object.keys(results).length;

  if (showEnd) {
    return (
      <>
        <ExerciseEndScreen
          exercises={exercises}
          results={results}
          finishLabel={finishLabel}
          finishing={finishing}
          onFinish={handleFinish}
        />
        {error ? (
          <p className="t-small" role="alert" style={{ color: "var(--bad)", marginTop: "var(--s-3)" }}>
            {error}
          </p>
        ) : null}
      </>
    );
  }

  const timer: ExerciseTimer | undefined = timedItem
    ? { running: deadline !== null, expired: timeUp, secondsLeft }
    : undefined;

  return (
    <div className="stack">
      <ProgressBar value={(answered / exercises.length) * 100} label={`Question ${index + 1} of ${exercises.length}`} />

      <section className="card" aria-live="polite">
        <p className="t-label">{exercise.instructions}</p>
        {timer && exercise.kind === "timed_recall" ? (
          <div
            style={{ marginTop: "var(--s-3)", display: "flex", flexWrap: "wrap", gap: "var(--s-3)", alignItems: "center", justifyContent: "space-between" }}
          >
            <span className="chip">
              Time left <strong style={{ fontVariantNumeric: "tabular-nums" }}>{formatClock(timer.secondsLeft)}</strong>
            </span>
            {timer.expired ? (
              <span className="chip bad">Time is up</span>
            ) : timer.running ? (
              <span className="chip sun">Running</span>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={startClock}>
                Start timer
              </button>
            )}
          </div>
        ) : null}
        <div style={{ marginTop: "var(--s-3)" }}>
          <ExerciseRenderer
            key={exercise.id}
            exercise={exercise}
            result={result}
            busy={busy}
            onSubmit={handleSubmit}
            onSelfRate={rate ? handleSelfRate : undefined}
            timer={timer}
          />
        </div>

        {result ? (
          <Feedback tone={feedbackTone(exercise, result)} title={feedbackTitle(exercise, result)}>
            {result.explanation}
            {!result.isCorrect && result.expected && exercise.kind !== "self_check" ? ` The answer is: ${result.expected}` : null}
          </Feedback>
        ) : null}
      </section>

      {error ? (
        <p className="t-small" role="alert" style={{ color: "var(--bad)" }}>
          {error}
        </p>
      ) : null}

      {result ? (
        <button type="button" className="btn btn-primary btn-block" onClick={handleContinue} disabled={ratingSaving}>
          {isLast ? "See my results" : "Continue"}
        </button>
      ) : null}

      {expiryFailed && !result ? (
        <button type="button" className="btn btn-primary btn-block" onClick={() => setEnded(true)}>
          See my results
        </button>
      ) : null}
    </div>
  );
}
