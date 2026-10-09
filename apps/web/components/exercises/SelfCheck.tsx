"use client";

import { useState } from "react";
import { OptionList } from "./OptionList";
import type { ExerciseOf, ExerciseProps } from "./types";

/** The two answers every self-check offers. The server decides what the learner's choice means. */
const SELF_CHECK_OPTIONS = ["Yes, I often say this", "No, I do not"];

/**
 * A yes or no self-assessment. There is no right or wrong here, so the player
 * shows the server's explanation as a note rather than a verdict.
 */
export function SelfCheck({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"self_check">>) {
  const [selected, setSelected] = useState<number | null>(null);
  const locked = result !== null || busy;

  return (
    <>
      <p className="ex-prompt">{exercise.content.prompt}</p>
      <OptionList
        options={SELF_CHECK_OPTIONS}
        selected={selected}
        onSelect={setSelected}
        locked={locked}
        verdict={null}
        label={exercise.content.prompt}
      />
      {result === null ? (
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={selected === null || busy}
          onClick={() => selected !== null && onSubmit({ optionIndex: selected })}
        >
          {busy ? "Checking…" : "Check answer"}
        </button>
      ) : null}
    </>
  );
}
