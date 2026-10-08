"use client";

import { useState, type FormEvent } from "react";
import { cx } from "@/lib/cx";
import type { ExerciseOf, ExerciseProps } from "./types";

/** The sentence is pre-filled with the misspelling so the learner only edits one word. */
export function SpellingCorrection({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"spelling_correction">>) {
  const [text, setText] = useState(exercise.content.sentence);
  const locked = result !== null || busy;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || locked) return;
    onSubmit({ text });
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <p className="ex-prompt">{exercise.instructions}</p>
      <label className="sr-only" htmlFor={`answer-${exercise.id}`}>
        Corrected sentence
      </label>
      <input
        id={`answer-${exercise.id}`}
        className={cx("blank-input", result && (result.isCorrect ? "correct" : "wrong"))}
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        disabled={locked}
      />
      {result === null ? (
        <button type="submit" className="btn btn-primary btn-block" disabled={!text.trim() || busy}>
          {busy ? "Checking…" : "Check answer"}
        </button>
      ) : null}
    </form>
  );
}
