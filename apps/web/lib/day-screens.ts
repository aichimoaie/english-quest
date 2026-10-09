import type { DayScreen, Exercise, ReviewItem } from "@/lib/api/types";

/** Every test item in a day, in the order the learner meets them. Text screens have no items. */
export function dayItems(screens: DayScreen[]): Exercise[] {
  return screens.flatMap((screen) => (screen.kind === "test" ? screen.exercises : []));
}

/** Every test item in a day with its test's explain flag. */
export function dayReviewItems(screens: DayScreen[]): ReviewItem[] {
  return screens.flatMap((screen) =>
    screen.kind === "test" ? screen.exercises.map((exercise) => ({ exercise, explain: screen.explain })) : [],
  );
}
