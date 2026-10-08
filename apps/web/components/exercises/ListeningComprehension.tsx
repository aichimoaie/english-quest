"use client";

import { useState } from "react";
import type { ExerciseOf, ExerciseProps } from "./types";
import { AudioButton } from "./AudioButton";
import { OptionList } from "./OptionList";

export function ListeningComprehension({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"listening_comprehension">>) {
  const [selected, setSelected] = useState<number | null>(null);
  const locked = result !== null || busy;
  const { audioUrl, prompt, options } = exercise.content;

  return (
    <>
      <AudioButton audioUrl={audioUrl} />
      <p className="ex-prompt" style={{ marginTop: "var(--s-3)" }}>
        {prompt}
      </p>
      <OptionList
        options={options}
        selected={selected}
        onSelect={setSelected}
        locked={locked}
        verdict={result ? result.isCorrect : null}
        label={prompt}
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
