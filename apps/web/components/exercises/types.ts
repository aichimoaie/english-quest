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
  onSelfRate?: (rating: "got_it" | "needs_practice") => Promise<boolean>;
  /** Only timed items use this: the clock shared by the whole set. */
  timer?: ExerciseTimer;
}

export type ExerciseOf<K extends Exercise["kind"]> = Extract<Exercise, { kind: K }>;

/** The set-wide clock for a timed test. The player owns it; renderers only read it. */
export interface ExerciseTimer {
  /** True once the learner has started the clock. */
  running: boolean;
  /** True once the time has run out. No more typing is accepted after this. */
  expired: boolean;
  secondsLeft: number;
}
