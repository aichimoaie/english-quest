import type { GrammarPoint } from "@/lib/api/types";
import type { LessonPanel } from "./LessonIntro";

/**
 * Turns a text screen's cards into the panels it shows: each card with its
 * examples. Only the screen's own text is used.
 */
export function lessonPanels(cards: GrammarPoint[]): LessonPanel[] {
  const panels: LessonPanel[] = [];
  for (const card of cards) {
    panels.push({ kind: "explain", title: card.title, body: card.explanation });
    if (card.examples.length > 0) {
      panels.push({ kind: "example", title: "Examples", items: card.examples });
    }
  }
  return panels;
}
