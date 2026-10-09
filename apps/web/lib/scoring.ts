import type { Exercise } from "@/lib/api/types";

/** Self-check items are shown but not scored. */
export function isScored(exercise: Exercise): boolean {
  return exercise.kind !== "self_check";
}

/** Points-weighted percentage of the scored items that were answered correctly. */
export function scorePercent(exercises: Exercise[], isCorrect: (exercise: Exercise) => boolean): number {
  const scored = exercises.filter(isScored);
  const totalPoints = scored.reduce((sum, exercise) => sum + exercise.points, 0);
  const earnedPoints = scored.reduce((sum, exercise) => sum + (isCorrect(exercise) ? exercise.points : 0), 0);
  return totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
}
