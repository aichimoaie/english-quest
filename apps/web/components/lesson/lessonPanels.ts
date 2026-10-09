import type { Lesson } from "@/lib/api/types";
import type { LessonPanel } from "./LessonIntro";

/**
 * Turns a day's lesson into the panels of its intro screen: each grammar point
 * with its examples, then the new words. Only the day's own text is used.
 */
export function lessonPanels(lesson: Lesson): LessonPanel[] {
  const panels: LessonPanel[] = [];
  for (const point of lesson.grammar) {
    panels.push({ kind: "explain", title: point.title, body: point.explanation });
    if (point.examples.length > 0) {
      panels.push({ kind: "example", title: "Examples", items: point.examples });
    }
  }
  if (lesson.vocabulary.length > 0) {
    panels.push({
      kind: "example",
      title: "New words",
      items: lesson.vocabulary.map((item) => `${item.word}: ${item.definition}`),
    });
  }
  return panels;
}
