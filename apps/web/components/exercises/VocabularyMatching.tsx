"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import type { ExerciseOf, ExerciseProps } from "./types";

/**
 * Tap a word, then its meaning. Tap a paired word again to unpair it.
 * The server decides whether the pairs are right; this only collects them.
 */
export function VocabularyMatching({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"vocabulary_matching">>) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const locked = result !== null || busy;
  const { words, meanings } = exercise.content;
  const pairedMeanings = new Set(Object.values(pairs));

  function tapWord(word: string) {
    if (locked) return;
    if (pairs[word]) {
      setPairs((current) => {
        const next = { ...current };
        delete next[word];
        return next;
      });
      setPendingWord(null);
      return;
    }
    setPendingWord(word);
  }

  function tapMeaning(meaning: string) {
    if (locked || !pendingWord) return;
    setPairs((current) => {
      const next = { ...current };
      for (const word of Object.keys(next)) {
        if (next[word] === meaning) delete next[word];
      }
      next[pendingWord] = meaning;
      return next;
    });
    setPendingWord(null);
  }

  const allPaired = words.every((word) => pairs[word]);

  return (
    <>
      <p className="ex-prompt">Match each word to its meaning.</p>
      <div className="pair-grid" role="group" aria-label="Words and meanings">
        <div className="stack" style={{ gap: "var(--s-2)" }}>
          {words.map((word) => (
            <button
              key={word}
              type="button"
              className={cx("pair", pendingWord === word && "picked", pairs[word] && "matched")}
              onClick={() => tapWord(word)}
              disabled={locked}
              aria-pressed={pendingWord === word}
            >
              {word}
            </button>
          ))}
        </div>
        <div className="stack" style={{ gap: "var(--s-2)" }}>
          {meanings.map((meaning) => (
            <button
              key={meaning}
              type="button"
              className={cx("pair", pairedMeanings.has(meaning) && "picked")}
              onClick={() => tapMeaning(meaning)}
              disabled={locked || !pendingWord}
            >
              {meaning}
            </button>
          ))}
        </div>
      </div>
      <p className="t-small" style={{ marginTop: "var(--s-3)" }}>
        {pendingWord ? `Now tap the meaning for "${pendingWord}".` : "Tap a word, then its meaning."}
      </p>
      {result === null ? (
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: "var(--s-4)" }}
          disabled={!allPaired || busy}
          onClick={() => onSubmit({ pairs })}
        >
          {busy ? "Checking…" : "Check answer"}
        </button>
      ) : null}
    </>
  );
}
