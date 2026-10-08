"use client";

import { useState } from "react";
import type { ExerciseOf, ExerciseProps } from "./types";
import { OptionList } from "./OptionList";

export function MultipleChoice({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"multiple_choice">>) {
  const [selected, setSelected] = useState<number | null>(null);
  const locked = result !== null || busy;

  return (
    <>
      <p className="ex-prompt">{exercise.content.prompt}</p>
      <OptionList
        options={exercise.content.options}
        selected={selected}
        onSelect={setSelected}
        locked={locked}
        verdict={result ? result.isCorrect : null}
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
