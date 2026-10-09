import type { AnswerResult, Exercise } from "@/lib/api/types";
import { isScored, scorePercent } from "@/lib/scoring";

interface ExerciseEndScreenProps {
  exercises: Exercise[];
  /** Server feedback keyed by exercise id. */
  results: Record<string, AnswerResult>;
  finishLabel: string;
  finishing: boolean;
  onFinish: () => void;
  /** Shows each item's explanation under its answer key, as a test's results screen does. */
  explain?: boolean;
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
function answerKey(exercise: Exercise, result: AnswerResult): string {
  if (exercise.kind === "self_check") return "Your answer was noted";
  return result.expected ?? "The server did not send an answer key";
}

/**
 * The end of a set: the score and the answer key for each item. The learner
 * finishes from here, which saves the run.
 */
export function ExerciseEndScreen({ exercises, results, finishLabel, finishing, onFinish, explain = false }: ExerciseEndScreenProps) {
  const scored = exercises.filter(isScored);
  const headline = scored.length > 0
    ? `${scorePercent(exercises, (exercise) => results[exercise.id]?.isCorrect === true)}% correct`
    : "Your answers are in";

  return (
    <div className="stack">
      <section className="card stack" style={{ gap: "var(--s-3)" }} aria-labelledby="end-title">
        <p className="t-label">Your result</p>
        <h2 id="end-title" className="t-title" tabIndex={-1}>
          {headline}
        </h2>
        <p className="lede">Every question was checked.</p>
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
              {explain && results[exercise.id]?.explanation ? (
                <>
                  <br />
                  <span className="t-small">{results[exercise.id].explanation}</span>
                </>
              ) : null}
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
