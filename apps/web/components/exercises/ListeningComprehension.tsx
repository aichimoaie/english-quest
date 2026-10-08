"use client";

import { useState } from "react";
import type { ExerciseOf, ExerciseProps } from "./types";
import { AudioButton } from "./AudioButton";
import { OptionList } from "./OptionList";

/** Transcript is hidden until asked for, so the clip is listened to first. */
export function ListeningComprehension({ exercise, result, busy, onSubmit }: ExerciseProps<ExerciseOf<"listening_comprehension">>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const locked = result !== null || busy;
  const { audioUrl, transcript, prompt, options } = exercise.content;

  return (
    <>
      <AudioButton audioUrl={audioUrl} />
      <button type="button" className="btn btn-ghost" aria-expanded={showTranscript} onClick={() => setShowTranscript((open) => !open)}>
        {showTranscript ? "Hide transcript" : "Show transcript"}
      </button>
      {showTranscript ? <p className="t-small">{transcript}</p> : null}
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
