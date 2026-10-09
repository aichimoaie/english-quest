"use client";

import { useState, type FormEvent } from "react";
import { cx } from "@/lib/cx";
import type { ExerciseOf, ExerciseProps } from "./types";

/** A fill-in-the-blank recall item. The learner types the missing word and checks it. */
export function TimedRecall({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"timed_recall">>) {
  const { sentence, hint } = exercise.content;
  const [text, setText] = useState("");
  const canType = result === null && !busy;

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
      {result === null ? (
        <button type="submit" className="btn btn-primary btn-block" disabled={!canType || !text.trim()}>
          {busy ? "Checking…" : "Check answer"}
        </button>
      ) : null}
    </form>
  );
}
