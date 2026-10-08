"use client";

import { useState } from "react";
import { Feedback } from "@/components/ui/Feedback";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { AnswerResult, Exercise, Submitted } from "@/lib/api/types";
import { ExerciseRenderer } from "./registry";

interface ExercisePlayerProps {
  exercises: Exercise[];
  /** Sends one answer to the server and resolves with its feedback. */
  submit: (exercise: Exercise, submitted: Submitted) => Promise<AnswerResult>;
  /** Records a pronunciation self-rating. Optional: only pronunciation items use it. */
  rate?: (exercise: Exercise, rating: "got_it" | "needs_practice") => Promise<unknown>;
  /** Called once the learner continues past the last item. */
  onFinish: () => Promise<void>;
  finishLabel: string;
}

/**
 * Runs one pass through a list of exercises, one per screen. Grading happens on
 * the server: this component sends each answer and shows the feedback it gets.
 */
export function ExercisePlayer({ exercises, submit, rate, onFinish, finishLabel }: ExercisePlayerProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exercise = exercises[index];
  const result = exercise ? results[exercise.id] ?? null : null;
  const isLast = index === exercises.length - 1;

  async function handleSubmit(submitted: Submitted) {
    if (!exercise) return;
    setBusy(true);
    setError(null);
    try {
      const answer = await submit(exercise, submitted);
      setResults((current) => ({ ...current, [exercise.id]: answer }));
    } catch {
      setError("We could not check that answer. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleContinue() {
    if (!isLast) {
      setIndex((current) => current + 1);
      return;
    }
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
    try {
      await rate(exercise, rating);
      return true;
    } catch {
      setError("We could not save your self-rating. Your answer is still recorded.");
      return false;
    }
  }

  if (exercises.length === 0) {
    return <p className="t-small">There are no exercises for this day yet.</p>;
  }

  const answered = Object.keys(results).length;

  return (
    <div className="stack">
      <ProgressBar value={(answered / exercises.length) * 100} label={`Question ${index + 1} of ${exercises.length}`} />

      <section className="card" aria-live="polite">
        <p className="t-label">{exercise.instructions}</p>
        <div style={{ marginTop: "var(--s-3)" }}>
          <ExerciseRenderer
            key={exercise.id}
            exercise={exercise}
            result={result}
            busy={busy}
            onSubmit={handleSubmit}
            onSelfRate={rate ? handleSelfRate : undefined}
          />
        </div>

        {result ? (
          <Feedback tone={result.isCorrect ? "ok" : "bad"} title={result.isCorrect ? "Correct" : "Not quite"}>
            {result.explanation}
            {!result.isCorrect && result.expected ? ` The answer is: ${result.expected}` : null}
          </Feedback>
        ) : null}
      </section>

      {error ? (
        <p className="t-small" role="alert" style={{ color: "var(--bad)" }}>
          {error}
        </p>
      ) : null}

      {result ? (
        <button type="button" className="btn btn-primary btn-block" onClick={handleContinue} disabled={finishing}>
          {isLast ? (finishing ? "Saving…" : finishLabel) : "Continue"}
        </button>
      ) : null}
    </div>
  );
}
