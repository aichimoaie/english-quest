"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { cx } from "@/lib/cx";
import type { ExerciseOf, ExerciseProps } from "./types";

/** Formats seconds as m:ss, the same clock the timed test shows. */
function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest < 10 ? "0" : ""}${rest}`;
}

/**
 * A fill-in-the-blank item with its own countdown. The learner starts the clock,
 * types the missing word, and the answer is sent when the clock reaches zero
 * even if the learner has not checked it.
 */
export function TimedRecall({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"timed_recall">>) {
  const { sentence, hint, timeLimitSeconds } = exercise.content;
  const [text, setText] = useState("");
  // The clock's end time, set when the learner starts it. Null until then.
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(timeLimitSeconds);
  const [timedOut, setTimedOut] = useState(false);
  const canType = deadline !== null && !timedOut && result === null && !busy;

  // The expiry timer reads the latest text and handler without restarting when they change.
  const textRef = useRef(text);
  const submitRef = useRef(onSubmit);
  useEffect(() => {
    textRef.current = text;
    submitRef.current = onSubmit;
  }, [text, onSubmit]);

  useEffect(() => {
    if (deadline === null || timedOut || result !== null) return;
    const tick = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 250);
    const expire = window.setTimeout(() => {
      setSecondsLeft(0);
      setTimedOut(true);
      submitRef.current({ text: textRef.current });
    }, Math.max(0, deadline - Date.now()));
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(expire);
    };
  }, [deadline, timedOut, result]);

  function startClock() {
    setDeadline(Date.now() + timeLimitSeconds * 1000);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canType || !text.trim()) return;
    onSubmit({ text });
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-3)", alignItems: "center", justifyContent: "space-between" }}>
        <span className="chip">
          Time left <strong style={{ fontVariantNumeric: "tabular-nums" }}>{formatClock(secondsLeft)}</strong>
        </span>
        {timedOut ? (
          <span className="chip bad">Time is up</span>
        ) : deadline !== null ? (
          <span className="chip sun">Running</span>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={startClock}>
            Start timer
          </button>
        )}
      </div>
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
      {result === null && !timedOut ? (
        <button type="submit" className="btn btn-primary btn-block" disabled={!canType || !text.trim()}>
          {busy ? "Checking…" : "Check answer"}
        </button>
      ) : null}
    </form>
  );
}
