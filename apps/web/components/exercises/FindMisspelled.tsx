"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import { OptionList } from "./OptionList";
import type { ExerciseOf, ExerciseProps } from "./types";

/**
 * Pick the misspelled word on a line, then type its correct spelling. Both
 * parts go to the server together; it grades the pair.
 */
export function FindMisspelled({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"find_misspelled">>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState("");
  const locked = result !== null || busy;
  const canCheck = selected !== null && text.trim() !== "";

  function handleSubmit() {
    if (selected === null || !text.trim() || locked) return;
    onSubmit({ optionIndex: selected, text });
  }

  return (
    <>
      <p className="ex-prompt">{exercise.content.prompt}</p>
      <p className="t-label" style={{ marginTop: "var(--s-3)" }}>
        Pick the misspelled word
      </p>
      <OptionList
        options={exercise.content.options}
        selected={selected}
        onSelect={setSelected}
        locked={locked}
        verdict={result ? result.isCorrect : null}
        label={exercise.content.prompt}
      />
      <label className="t-small" htmlFor={`fix-${exercise.id}`} style={{ display: "block", margin: "var(--s-4) 0 var(--s-2)", fontWeight: 800 }}>
        Correct spelling
      </label>
      <input
        id={`fix-${exercise.id}`}
        className={cx("blank-input", result && (result.isCorrect ? "correct" : "wrong"))}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type the correct spelling"
        autoComplete="off"
        spellCheck={false}
        disabled={locked}
      />
      {result === null ? (
        <button type="button" className="btn btn-primary btn-block" disabled={!canCheck || busy} onClick={handleSubmit} style={{ marginTop: "var(--s-4)" }}>
          {busy ? "Checking…" : "Check answer"}
        </button>
      ) : null}
    </>
  );
}
