"use client";

import { useState } from "react";
import type { ExerciseOf, ExerciseProps } from "./types";
import { AudioButton } from "./AudioButton";
import { OptionList } from "./OptionList";

/**
 * Recognition only: the learner hears a word and picks the written option.
 * The self-rating after it is recorded for progress and is not scored.
 * Rating labels are an open PRD decision (section 18, item 9); these are placeholders.
 */
export function PronunciationPractice({ exercise, result, busy, onSubmit, onSelfRate }: ExerciseProps<ExerciseOf<"pronunciation_practice">>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [rated, setRated] = useState<"got_it" | "needs_practice" | null>(null);
  const locked = result !== null || busy;

  function rate(rating: "got_it" | "needs_practice") {
    setRated(rating);
    onSelfRate?.(rating);
  }

  return (
    <>
      <p className="ex-prompt">Listen, then choose the word you hear.</p>
      <AudioButton audioUrl={exercise.content.audioUrl} label="Play the word" />
      <div style={{ marginTop: "var(--s-4)" }}>
        <OptionList
          options={exercise.content.options}
          selected={selected}
          onSelect={setSelected}
          locked={locked}
          verdict={result ? result.isCorrect : null}
          label="Words you might hear"
        />
      </div>
      {result === null ? (
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={selected === null || busy}
          onClick={() => selected !== null && onSubmit({ optionIndex: selected })}
        >
          {busy ? "Checking…" : "Check answer"}
        </button>
      ) : (
        <div className="stack" style={{ marginTop: "var(--s-4)" }}>
          <p className="t-small">How did your pronunciation feel?</p>
          <div className="rate">
            <button type="button" className="btn btn-secondary" aria-pressed={rated === "got_it"} onClick={() => rate("got_it")}>
              Got it
            </button>
            <button type="button" className="btn btn-secondary" aria-pressed={rated === "needs_practice"} onClick={() => rate("needs_practice")}>
              Needs practice
            </button>
          </div>
        </div>
      )}
    </>
  );
}
