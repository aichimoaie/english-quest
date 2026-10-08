"use client";

import { useState, type FormEvent } from "react";
import { cx } from "@/lib/cx";
import type { ExerciseOf, ExerciseProps } from "./types";

export function FillBlank({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"fill_blank">>) {
  const [text, setText] = useState("");
  const locked = result !== null || busy;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || locked) return;
    onSubmit({ text });
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <p className="ex-prompt">{exercise.content.sentence}</p>
      {exercise.content.hint ? <p className="ex-hint">{exercise.content.hint}</p> : null}
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
