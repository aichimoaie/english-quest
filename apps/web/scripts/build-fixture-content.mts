/*
 * Builds the fixture server's curriculum data from content/days, so the frontend
 * has one source of truth. Output is generated and git-ignored. Run through the
 * pretest, pretypecheck, prelint, predev and prebuild scripts in package.json.
 *
 * Dev and test only: the fixture server is removed when apps/api serves the days.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const contentDir = fileURLToPath(new URL("../../../content/days/", import.meta.url));
const outFile = fileURLToPath(new URL("../lib/fixtures/generated/curriculum.ts", import.meta.url));

/** Only the days that have content files are generated. The rest are placeholders in days.ts. */
const dayFiles = readdirSync(contentDir)
  .filter((name) => /^day-\d{2}\.yaml$/.test(name))
  .sort();

const INSTRUCTIONS: Record<string, string> = {
  multiple_choice: "Choose one option.",
  fill_blank: "Type the missing word.",
  spelling_correction: "Type the correct spelling.",
  vocabulary_matching: "Match each word with its meaning.",
  self_check: "Choose the answer that is true for you.",
};

interface SourceExercise {
  id: string;
  type: string;
  topics: string[];
  /** Self-check items are unscored and have no points. */
  points?: number;
  prompt: string;
  choices?: string[];
  answer?: string;
  accepted?: string[];
  text?: string;
  pairs?: { word: string; meaning: string }[];
  explanation: string;
}

function fail(file: string, message: string): never {
  throw new Error(`${file}: ${message}`);
}

/** Maps one authored exercise onto the renderer type and the answer check the server grades with. */
function convertExercise(file: string, source: SourceExercise) {
  const base = { id: source.id, instructions: INSTRUCTIONS[source.type], points: source.points ?? 0 };
  const feedbackKey = source.topics[0];
  const common = { expected: "", explanation: source.explanation, feedbackKey };

  if (source.type === "self_check") {
    // No right answer: the grader records the learner's yes or no, and the page shows the explanation as a note.
    return {
      exercise: { ...base, kind: "self_check", content: { prompt: source.prompt } },
      answer: { ...common, check: { option: 0 } },
    };
  }

  if (source.type === "multiple_choice") {
    const choices = source.choices ?? [];
    const index = choices.indexOf(source.answer ?? "");
    if (index < 0) fail(file, `${source.id}: answer is not one of the choices`);
    return {
      exercise: { ...base, kind: "multiple_choice", content: { prompt: source.prompt, options: choices } },
      answer: { ...common, expected: choices[index], check: { option: index } },
    };
  }
  if (source.type === "fill_blank" || source.type === "spelling_correction") {
    const accepted = source.accepted ?? [];
    if (accepted.length === 0) fail(file, `${source.id}: no accepted answer`);
    const isFill = source.type === "fill_blank";
    const hasBlank = /_{3,}/.test(source.prompt);
    return {
      exercise: {
        ...base,
        instructions: isFill ? (hasBlank ? base.instructions : "Type your answer.") : source.prompt,
        kind: isFill ? "fill_blank" : "spelling_correction",
        content: isFill ? { sentence: source.prompt, hint: null } : { sentence: source.text ?? "" },
      },
      answer: { ...common, expected: accepted[0], check: { accepted } },
    };
  }
  if (source.type === "vocabulary_matching") {
    const pairs = source.pairs ?? [];
    const pairMap = Object.fromEntries(pairs.map((pair) => [pair.word, pair.meaning]));
    const meanings = pairs.map((pair) => pair.meaning);
    // Shuffle the meanings by one place so the learner cannot match by position.
    const shuffled = [...meanings.slice(1), meanings[0]];
    return {
      exercise: {
        ...base,
        instructions: source.prompt,
        kind: "vocabulary_matching",
        content: { words: pairs.map((pair) => pair.word), meanings: shuffled },
      },
      answer: {
        ...common,
        expected: pairs.map((pair) => `${pair.word}: ${pair.meaning}`).join(". ") + ".",
        check: { pairs: pairMap },
      },
    };
  }
  fail(file, `${source.id}: unsupported type ${source.type}`);
}

interface SourceCard {
  title: string;
  body: string;
  examples?: string[];
  watch_out?: string;
}

function convertCard(card: SourceCard) {
  return {
    title: card.title,
    explanation: card.body,
    watchOut: card.watch_out ?? null,
    examples: card.examples ?? [],
  };
}

const days = dayFiles.map((name) => {
  const file = name;
  const source = parse(readFileSync(`${contentDir}${name}`, "utf8"));
  const answers: Record<string, ReturnType<typeof convertExercise>["answer"]> = {};
  const exercises: unknown[] = [];

  const screens = (source.screens as { kind: string; id: string; title: string; cards?: SourceCard[]; intro?: string; items?: SourceExercise[]; explain?: boolean }[]).map(
    (screen) => {
      if (screen.kind === "text") {
        return { kind: "text", id: screen.id, title: screen.title, cards: (screen.cards ?? []).map(convertCard) };
      }
      const converted = (screen.items ?? []).map((item) => convertExercise(file, item));
      for (const item of converted) {
        answers[item.exercise.id] = item.answer;
        exercises.push(item.exercise);
      }
      return {
        kind: "test",
        id: screen.id,
        title: screen.title,
        intro: screen.intro,
        exercises: converted.map((item) => item.exercise),
        explain: screen.explain === true,
      };
    },
  );

  return {
    dayNumber: source.day as number,
    title: source.title as string,
    vocabulary: (source.vocabulary ?? []).map((item: { word: string; definition: string; example: string }) => ({
      word: item.word,
      definition: item.definition,
      example: item.example,
    })),
    screens,
    exercises,
    answers,
  };
});

const header = `// Generated by apps/web/scripts/build-fixture-content.mts from content/days. Do not edit.
import type { DayScreen, Exercise, VocabularyItem } from "@/lib/api/types";
import type { AnswerCheck } from "@/lib/fixtures/answer-keys";

export interface GeneratedAnswer {
  check: AnswerCheck;
  expected: string;
  explanation: string;
  feedbackKey: string;
}

export interface GeneratedDay {
  dayNumber: number;
  title: string;
  vocabulary: VocabularyItem[];
  /** The day's screens in order. Test screens hold their items. */
  screens: DayScreen[];
  /** Every test item of the day, in order. Used to start and grade a run. */
  exercises: Exercise[];
  answers: Record<string, GeneratedAnswer>;
}

export const GENERATED_DAYS: GeneratedDay[] = `;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${header}${JSON.stringify(days, null, 2)};\n`);
console.log(`Wrote ${days.length} day(s) to ${outFile}`);
