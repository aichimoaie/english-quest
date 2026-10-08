"use client";

import { useState } from "react";
import type { ExerciseOf, ExerciseProps } from "./types";

interface PlacedWord {
  /** Index into the bank, so a tapped tile can go back to its own slot. */
  bankIndex: number;
  word: string;
}

export function SentenceOrdering({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"sentence_ordering">>) {
  const [placed, setPlaced] = useState<PlacedWord[]>([]);
  const locked = result !== null || busy;
  const usedBankIndexes = new Set(placed.map((item) => item.bankIndex));

  function place(bankIndex: number) {
    if (locked || usedBankIndexes.has(bankIndex)) return;
    setPlaced((current) => [...current, { bankIndex, word: exercise.content.words[bankIndex] }]);
  }

  function take(position: number) {
    if (locked) return;
    setPlaced((current) => current.filter((_, index) => index !== position));
  }

  return (
    <>
      <p className="ex-prompt">Put the words in order.</p>
      <div className="tiles" aria-label="Your sentence" aria-live="polite">
        {placed.length === 0 ? <span className="t-small">Tap words in order</span> : null}
        {placed.map((item, position) => (
          <button key={`${item.bankIndex}`} type="button" className="tile" onClick={() => take(position)} disabled={locked}>
            {item.word}
          </button>
        ))}
      </div>
      <div className="tiles bank" style={{ marginTop: "var(--s-3)" }} aria-label="Word bank">
        {exercise.content.words.map((word, bankIndex) => (
          <button
            key={`${bankIndex}-${word}`}
            type="button"
            className="tile bank"
            onClick={() => place(bankIndex)}
            disabled={locked || usedBankIndexes.has(bankIndex)}
            aria-label={word}
          >
            {word}
          </button>
        ))}
      </div>
      {result === null ? (
        <div className="row" style={{ marginTop: "var(--s-4)" }}>
          <button type="button" className="btn btn-ghost" onClick={() => setPlaced([])} disabled={placed.length === 0 || busy}>
            Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={placed.length !== exercise.content.words.length || busy}
            onClick={() => onSubmit({ order: placed.map((item) => item.word) })}
          >
            {busy ? "Checking…" : "Check answer"}
          </button>
        </div>
      ) : null}
    </>
  );
}
