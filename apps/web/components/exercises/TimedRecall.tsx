"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { cx } from "@/lib/cx";
import type { ExerciseOf, ExerciseProps } from "./types";

/**
 * A fill-in-the-blank item in a timed set. The player owns the clock for the
 * whole set. When it runs out, whatever the learner has typed is sent, even
 * without a check.
 */
export function TimedRecall({ exercise, result, busy, onSubmit, timer }: ExerciseProps<ExerciseOf<"timed_recall">>) {
  const { sentence, hint } = exercise.content;
  const [text, setText] = useState("");
  const expired = timer?.expired ?? false;
  const canType = timer?.running === true && !expired && result === null && !busy;

  // The expiry send reads the latest text without restarting when the text changes.
  const textRef = useRef(text);
  const expirySent = useRef(false);
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!expired || result !== null || expirySent.current) return;
    expirySent.current = true;
    onSubmit({ text: textRef.current });
  }, [expired, result, onSubmit]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canType || !text.trim()) return;
    onSubmit({ text });
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <p className="ex-prompt">{sentence}</p>
      {hint ? <p className="ex-hint">{hint}</p> : null}
      <label className="sr-only" htmlFor={`answer-${exercise.id}`}>
        Your answer
      </label>
      <input
        id={`answer-${exercise.id}`}
        className={cx("blank-input", result && (result.isCorrect ? "correct" : "wrong"))}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type here"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        disabled={!canType}
      />
      {result === null && !expired ? (
        <button type="submit" className="btn btn-primary btn-block" disabled={!canType || !text.trim()}>
          {busy ? "Checking…" : "Check answer"}
        </button>
      ) : null}
    </form>
  );
}
