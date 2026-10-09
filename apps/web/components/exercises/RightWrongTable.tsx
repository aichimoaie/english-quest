"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import type { ExerciseOf, ExerciseProps } from "./types";

/** Index 0 is "Right" and index 1 is "Wrong", matching the server's option order. */
const CHOICES = ["Right", "Wrong"];

/** Two large tap targets for judging one sentence as right or wrong. */
export function RightWrongTable({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"right_wrong">>) {
  const [selected, setSelected] = useState<number | null>(null);
  const locked = result !== null || busy;

  return (
    <>
      <p className="ex-prompt">{exercise.content.prompt}</p>
      <p className="t-label" style={{ marginTop: "var(--s-3)" }}>
        Right or wrong?
      </p>
      <div className="pair-grid" role="group" aria-label="Right or wrong">
        {CHOICES.map((label, index) => (
          <button
            key={label}
            type="button"
            className={cx(
              "pair",
              selected === index && !locked && "picked",
              // The server names the right answer once the learner has checked, so the key is never sent earlier.
              result?.expected === label && "matched",
            )}
            aria-pressed={selected === index}
            disabled={locked}
            onClick={() => setSelected(index)}
          >
            {label}
          </button>
        ))}
      </div>
      {result === null ? (
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={selected === null || busy}
          onClick={() => selected !== null && onSubmit({ optionIndex: selected })}
          style={{ marginTop: "var(--s-4)" }}
        >
          {busy ? "Checking…" : "Check answer"}
        </button>
      ) : null}
    </>
  );
}
