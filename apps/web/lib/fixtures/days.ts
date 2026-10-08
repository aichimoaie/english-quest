/*
 * TEMPORARY fixture content for the frontend skeleton. Remove when apps/api serves
 * GET /api/v1/days/{day}. Real curriculum lives in content/days (workstream 6).
 *
 * All wording here is original, written for English Quest. Days 1 and 2 have
 * exercises; the other days are placeholders until their content is reviewed.
 */
import type { DaySummary, Exercise, Lesson } from "@/lib/api/types";

export { TOTAL_DAYS } from "@/lib/course";

export const DAY_TITLES: { title: string; objective: string }[] = [
  { title: "Be: am, is, are", objective: "Choose am, is or are with names, pronouns and places." },
  { title: "Possessives: my, your, his, her", objective: "Use my, your, his and her before a noun to show who owns something." },
  { title: "Present simple: I work", objective: "Use the base verb with I, you, we and they." },
  { title: "Present simple: he, she, it", objective: "Add -s to the verb with he, she and it." },
  { title: "Question words", objective: "Ask who, what, where, when and how." },
  { title: "Possessives: my, your, his, her", objective: "Use my, your, his and her before a noun to show who owns something." },
  { title: "There is, there are", objective: "Say what exists in a place." },
  { title: "Can and can't", objective: "Talk about ability and rules." },
  { title: "Present continuous", objective: "Describe what is happening now." },
  { title: "Simple past: regular verbs", objective: "Talk about finished actions with -ed." },
  { title: "Simple past: irregular verbs", objective: "Use common past forms such as went and had." },
  { title: "Comparatives", objective: "Compare two things with -er and more." },
  { title: "Superlatives", objective: "Name the most or the least in a group." },
  { title: "Going to: plans", objective: "Talk about plans you already made." },
  { title: "Will: quick decisions", objective: "Decide something at the moment you speak." },
  { title: "Prepositions of time", objective: "Use in, on and at with time words." },
  { title: "Prepositions of place", objective: "Describe where things are." },
  { title: "Countable and uncountable", objective: "Use much, many, a lot of and some." },
  { title: "Have got and have", objective: "Talk about possessions and routines with have." },
  { title: "Adverbs of frequency", objective: "Place always, often and never correctly." },
  { title: "Object pronouns", objective: "Use me, you, him, her, us and them." },
  { title: "Present perfect: experience", objective: "Talk about life experiences with have been." },
  { title: "Present perfect: since and for", objective: "Describe actions that started in the past." },
  { title: "Modal verbs: must and should", objective: "Give advice and talk about obligation." },
  { title: "First conditional", objective: "Talk about likely results with if and will." },
  { title: "Relative clauses", objective: "Add information with who and that." },
  { title: "Phrasal verbs for daily life", objective: "Understand and use common two-word verbs." },
  { title: "Linking words", objective: "Join ideas with because, but and so." },
  { title: "Reported speech: basics", objective: "Report what someone said." },
  { title: "Review and practice", objective: "Bring together the grammar from the first 29 days." },
];

export const DAY_SUMMARIES: DaySummary[] = DAY_TITLES.map((entry, index) => ({
  dayNumber: index + 1,
  title: entry.title,
  objective: entry.objective,
  status: index === 0 ? "current" : "locked",
  bestScorePct: null,
}));

export const DAY_ONE_LESSON: Lesson = {
  vocabulary: [
    {
      word: "teacher",
      definition: "A person whose job is to help others learn.",
      example: "Our teacher explains each lesson slowly.",
    },
    {
      word: "student",
      definition: "A person who is learning something.",
      example: "The student writes a short story every week.",
    },
    {
      word: "doctor",
      definition: "A person who treats sick people.",
      example: "The doctor is kind and very patient.",
    },
  ],
  grammar: [
    {
      title: "Be: am, is, are",
      explanation: "Use am with I. Use is with he, she, it and one name. Use are with you, we and they.",
      examples: ["I am tired.", "She is a teacher.", "They are from Spain."],
    },
  ],
};

export const DAY_ONE_EXERCISES: Exercise[] = [
  {
    id: "ex_d1_choice",
    kind: "multiple_choice",
    instructions: "Pick the correct sentence.",
    points: 1,
    content: {
      prompt: "Which sentence is correct?",
      options: ["She are a teacher.", "She is a teacher.", "She be a teacher."],
    },
  },
  {
    id: "ex_d1_fill",
    kind: "fill_blank",
    instructions: "Type the missing word.",
    points: 1,
    content: { sentence: "They ____ from Spain.", hint: "Type one word." },
  },
  {
    id: "ex_d1_order",
    kind: "sentence_ordering",
    instructions: "Tap the words in the right order.",
    points: 1,
    content: { words: ["is", "Ana", "name", "My"] },
  },
  {
    id: "ex_d1_match",
    kind: "vocabulary_matching",
    instructions: "Match each word to its meaning.",
    points: 3,
    content: {
      words: ["teacher", "student", "doctor"],
      meanings: ["someone who learns", "someone who treats sick people", "someone who teaches"],
    },
  },
  {
    id: "ex_d1_spell",
    kind: "spelling_correction",
    instructions: "One word is misspelled. Type the sentence with the word fixed.",
    points: 1,
    content: { sentence: "I recieve a letter every week." },
  },
  {
    id: "ex_d1_listen",
    kind: "listening_comprehension",
    instructions: "Listen to the clip, then answer the question.",
    points: 1,
    content: {
      audioUrl: null,
      prompt: "What time does the shop open?",
      options: ["At seven", "At eight", "At nine"],
    },
  },
  {
    id: "ex_d1_say",
    kind: "pronunciation_practice",
    instructions: "Listen, then choose the word you hear. Then rate your own pronunciation.",
    points: 1,
    content: { audioUrl: null, options: ["ship", "sheep"] },
  },
];

export const DAY_TWO_LESSON: Lesson = {
  vocabulary: [
    {
      word: "backpack",
      definition: "A bag that you wear on your back.",
      example: "My backpack has three pockets.",
    },
    {
      word: "umbrella",
      definition: "Something you hold over your head to stay dry in the rain.",
      example: "Take your umbrella, because it might rain.",
    },
    {
      word: "passport",
      definition: "An official document that shows who you are when you travel.",
      example: "His passport expires next year.",
    },
  ],
  grammar: [
    {
      title: "My and your",
      explanation: "Put a possessive word before the noun it describes. Use my for I and your for you.",
      examples: ["My bag is red.", "Is this your umbrella?"],
    },
    {
      title: "His and her",
      explanation: "Use his for a man or boy, and her for a woman or girl. Look at the owner, not the object.",
      examples: ["He loves his new bicycle.", "She forgot her passport."],
    },
  ],
};

export const DAY_TWO_EXERCISES: Exercise[] = [
  {
    id: "ex_d2_choice_my",
    kind: "multiple_choice",
    instructions: "Pick the word that completes the sentence.",
    points: 1,
    content: { prompt: "___ name is Lena.", options: ["My", "Me", "I"] },
  },
  {
    id: "ex_d2_choice_her",
    kind: "multiple_choice",
    instructions: "Pick the correct sentence.",
    points: 1,
    content: {
      prompt: "Which sentence is correct?",
      options: ["She dog is friendly.", "Her dog is friendly.", "Hers dog is friendly."],
    },
  },
  {
    id: "ex_d2_fill",
    kind: "fill_blank",
    instructions: "Type the missing word.",
    points: 1,
    content: { sentence: "Tom lost ____ keys on the bus.", hint: "Type one word." },
  },
  {
    id: "ex_d2_match",
    kind: "vocabulary_matching",
    instructions: "Match each word to its meaning.",
    points: 4,
    content: {
      words: ["backpack", "notebook", "umbrella", "passport"],
      meanings: [
        "an official document that shows who you are when you travel",
        "a bag that you wear on your back",
        "a small book with empty pages for writing notes",
        "something you hold over your head to stay dry in the rain",
      ],
    },
  },
  {
    id: "ex_d2_spell",
    kind: "spelling_correction",
    instructions: "One word is misspelled. Type the sentence with the word fixed.",
    points: 1,
    content: { sentence: "I left my umbrela at the station." },
  },
  {
    id: "ex_d2_order",
    kind: "sentence_ordering",
    instructions: "Tap the words in the right order.",
    points: 1,
    content: { words: ["is", "door.", "by", "bicycle", "Your", "the"] },
  },
  {
    id: "ex_d2_listen",
    kind: "listening_comprehension",
    instructions: "Listen to the clip, then answer the question.",
    points: 1,
    content: {
      audioUrl: null,
      prompt: "Whose jacket is it?",
      options: ["Jen", "The speaker", "Tom"],
    },
  },
];
