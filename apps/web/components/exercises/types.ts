import type { AnswerResult, Exercise, Submitted } from "@/lib/api/types";

/**
 * Props every exercise renderer receives. A renderer collects the learner's
 * input and calls `onSubmit`. It shows the server's `result` once it arrives and
 * never decides correctness itself.
 */
export interface ExerciseProps<E extends Exercise = Exercise> {
  exercise: E;
  /** Server feedback for this item, or null until the learner has checked it. */
  result: AnswerResult | null;
  busy: boolean;
  onSubmit: (submitted: Submitted) => void;
  /** Only pronunciation items use this: the learner's self-rating after the recognition answer. */
  onSelfRate?: (rating: "got_it" | "needs_practice") => void;
}

export type ExerciseOf<K extends Exercise["kind"]> = Extract<Exercise, { kind: K }>;
