import type { AnswerResult, Exercise } from "@/lib/api/types";

interface ExerciseEndScreenProps {
  exercises: Exercise[];
  /** Server feedback keyed by exercise id. Missing entries were not reached. */
  results: Record<string, AnswerResult>;
  finishLabel: string;
  finishing: boolean;
  onFinish: () => void;
}

/** The short text a learner sees for each item on the result screen. */
function exerciseLabel(exercise: Exercise): string {
  switch (exercise.kind) {
    case "multiple_choice":
    case "listening_comprehension":
    case "find_misspelled":
    case "self_check":
    case "right_wrong":
      return exercise.content.prompt;
    case "fill_blank":
    case "spelling_correction":
    case "timed_recall":
      return exercise.content.sentence;
    case "vocabulary_matching":
      return exercise.content.words.join(", ");
    case "sentence_ordering":
      return exercise.content.words.join(" ");
    case "pronunciation_practice":
      return exercise.instructions;
  }
}

/** The answer key line for one item. Self-checks have no right answer, so they get a note instead. */
function answerKey(exercise: Exercise, result: AnswerResult | undefined): string {
  if (!result) return "Not reached";
  if (exercise.kind === "self_check") return "Your answer was noted";
  return result.expected ?? "The server did not send an answer key";
}

/**
 * The end of a set: the score, the items that were not reached, and the answer
 * key for each item. The learner finishes from here, which saves the run.
 */
export function ExerciseEndScreen({ exercises, results, finishLabel, finishing, onFinish }: ExerciseEndScreenProps) {
  const scored = exercises.filter((exercise) => exercise.kind !== "self_check");
  const correct = scored.filter((exercise) => results[exercise.id]?.isCorrect).length;
  const notReached = exercises.filter((exercise) => !results[exercise.id]).length;
  const headline = scored.length > 0 ? `${correct} of ${scored.length} correct` : "Your answers are in";
  const lede = notReached > 0 ? `${notReached} not reached before the test ended.` : "Every question was checked.";

  return (
    <div className="stack">
      <section className="card stack" style={{ gap: "var(--s-3)" }} aria-labelledby="end-title">
        <p className="t-label">Your result</p>
        <h2 id="end-title" className="t-title" tabIndex={-1}>
          {headline}
        </h2>
        <p className="lede">{lede}</p>
      </section>

      <section className="card flat">
        <h2 className="t-head">Check your results</h2>
        <p className="t-small">The answer key for each question, in order.</p>
        <ol className="notes" style={{ background: "var(--surface-2)" }}>
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              {exerciseLabel(exercise)}
              <br />
              <span className="t-small">{answerKey(exercise, results[exercise.id])}</span>
            </li>
          ))}
        </ol>
      </section>

      <button type="button" className="btn btn-primary btn-block" onClick={onFinish} disabled={finishing}>
        {finishing ? "Saving…" : finishLabel}
      </button>
    </div>
  );
}
