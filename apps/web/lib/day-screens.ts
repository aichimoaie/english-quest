import type { DayScreen, Exercise } from "@/lib/api/types";

/** Every test item in a day, in the order the learner meets them. Text screens have no items. */
export function dayItems(screens: DayScreen[]): Exercise[] {
  return screens.flatMap((screen) => (screen.kind === "test" ? screen.exercises : []));
}
