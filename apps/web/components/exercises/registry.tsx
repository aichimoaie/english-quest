import type { ComponentType } from "react";
import type { Exercise, ExerciseKind } from "@/lib/api/types";
import { FillBlank } from "./FillBlank";
import { FindMisspelled } from "./FindMisspelled";
import { ListeningComprehension } from "./ListeningComprehension";
import { MultipleChoice } from "./MultipleChoice";
import { PronunciationPractice } from "./PronunciationPractice";
import { RightWrongTable } from "./RightWrongTable";
import { SelfCheck } from "./SelfCheck";
import { SentenceOrdering } from "./SentenceOrdering";
import { SpellingCorrection } from "./SpellingCorrection";
import { TimedRecall } from "./TimedRecall";
import type { ExerciseOf, ExerciseProps } from "./types";
import { VocabularyMatching } from "./VocabularyMatching";

/**
 * One renderer per exercise type. Adding a type means one file here and one
 * entry below; the player never switches on the kind itself.
 */
export const exerciseRegistry: { [K in ExerciseKind]: ComponentType<ExerciseProps<ExerciseOf<K>>> } = {
  multiple_choice: MultipleChoice,
  fill_blank: FillBlank,
  sentence_ordering: SentenceOrdering,
  vocabulary_matching: VocabularyMatching,
  spelling_correction: SpellingCorrection,
  listening_comprehension: ListeningComprehension,
  pronunciation_practice: PronunciationPractice,
  find_misspelled: FindMisspelled,
  self_check: SelfCheck,
  right_wrong: RightWrongTable,
  timed_recall: TimedRecall,
};

export function ExerciseRenderer(props: ExerciseProps<Exercise>) {
  // The registry is keyed by kind, so the renderer always matches the exercise's shape.
  const Renderer = exerciseRegistry[props.exercise.kind] as ComponentType<ExerciseProps<Exercise>>;
  return <Renderer {...props} />;
}
