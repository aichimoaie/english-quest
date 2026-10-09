/*
 * TEMPORARY fixture content for the frontend skeleton. Remove when apps/api serves
 * GET /api/v1/days/{day}. Real curriculum lives in content/days (workstream 6).
 *
 * All wording here is original, written for English Quest. Days 1 and 2 have
 * exercises (a subset of content/days/day-01.yaml and day-02.yaml, with the same
 * ids and wording); the other days are placeholders until their content is reviewed.
 */
import type { DaySummary, Exercise, Lesson } from "@/lib/api/types";

export { TOTAL_DAYS } from "@/lib/course";

export const DAY_TITLES: { title: string; objective: string }[] = [
  { title: "Test Your Pronunciation", objective: "Choose the preferred pronunciation of common, educated and unfamiliar words." },
  { title: "Test Your Vocabulary", objective: "Match words to their meanings and spot similar and opposite words." },
  { title: "Test Your Spelling", objective: "Spell common words correctly and find the misspelled one." },
  { title: "Test Your Grammar", objective: "Choose correct grammar, pronouns and verb forms." },
  { title: "Just for Fun (I)", objective: "Play word games: opposites that start with R and words named after people." },
  { title: "Possessives: my, your, his", objective: "Show who owns something." },
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
      word: "library",
      definition: "A room or building where books are kept for people to read or borrow.",
      example: "I study at the library on Tuesdays.",
    },
    {
      word: "espresso",
      definition: "Strong coffee made by forcing hot water through finely ground beans.",
      example: "He ordered a small espresso after dinner.",
    },
    {
      word: "forehead",
      definition: "The front part of the head above the eyes.",
      example: "She wiped the sweat from her forehead.",
    },
  ],
  grammar: [
    {
      title: "Stress makes a word easy to recognise",
      explanation:
        "Each word with more than one syllable has one syllable said with more force. A word can be understood with a wrong vowel, but a wrong stress often sounds strange.",
      examples: [
        "In pruh-nun-see-AY-shun the stress falls on the fourth syllable.",
        "Say eh-SPRES-oh, not ex-PRESS-oh, for espresso.",
      ],
    },
    {
      title: "Weak syllables are short and quiet",
      explanation:
        "In many unstressed syllables the vowel becomes a short, quiet sound called schwa, written as ə in respellings. The middle syllable of library is often quiet.",
      examples: ["LY-brer-ee has three syllables when spoken carefully."],
    },
    {
      title: "Some letters are silent",
      explanation:
        "Some letters are written but not spoken. The h in hour is silent, the w in sword is silent, and the gh in height is silent, leaving a long i sound.",
      examples: ["The hour passed quickly.", "She drew a sword in the play."],
    },
    {
      title: "Preferred pronunciations of common words",
      explanation:
        "Say ask with a k sound before the s. Burglar has two syllables, not three, and mischievous has three syllables with the middle one quiet.",
      examples: ["Please ask the teacher a question.", "The burglar was caught on camera."],
    },
  ],
};

export const DAY_ONE_EXERCISES: Exercise[] = [
  {
    id: "d01-pron-common-01",
    kind: "multiple_choice",
    instructions: "Pick the preferred pronunciation.",
    points: 1,
    content: { prompt: "Which is the preferred pronunciation of library?", options: ["LY-bree", "LY-brer-ee"] },
  },
  {
    id: "d01-pron-common-02",
    kind: "multiple_choice",
    instructions: "Pick the preferred pronunciation.",
    points: 1,
    content: { prompt: "Which is the preferred pronunciation of mischievous?", options: ["MIS-chee-vee-us", "MIS-chuh-vus"] },
  },
  {
    id: "d01-pron-educated-02",
    kind: "multiple_choice",
    instructions: "Pick the preferred pronunciation.",
    points: 1,
    content: { prompt: "Which is the preferred pronunciation of burglar?", options: ["BUR-gu-lar", "BUR-glur"] },
  },
  {
    id: "d01-pron-educated-03",
    kind: "multiple_choice",
    instructions: "Pick the preferred pronunciation.",
    points: 1,
    content: { prompt: "Which is the preferred pronunciation of ask?", options: ["AKS", "ASK"] },
  },
  {
    id: "d01-pron-affected-03",
    kind: "multiple_choice",
    instructions: "Pick the preferred pronunciation.",
    points: 1,
    content: { prompt: "Which is the preferred pronunciation of width?", options: ["WITH", "WIDTH"] },
  },
];

export const DAY_TWO_LESSON: Lesson = {
  vocabulary: [
    {
      word: "wary",
      definition: "Cautious, because you expect something bad might happen.",
      example: "Stay wary of offers that sound too good to be true.",
    },
    {
      word: "frugal",
      definition: "Careful with money and not wasteful.",
      example: "Her frugal habits helped her save for a flat.",
    },
    {
      word: "lucid",
      definition: "Clear and easy to understand.",
      example: "The teacher gave a lucid explanation of the rule.",
    },
  ],
  grammar: [
    {
      title: "Match a word to its meaning",
      explanation:
        "A good vocabulary means you know what a word means, not only how it looks. Read the word, think of a situation where you would use it, then choose the meaning that fits.",
      examples: ["A lucid explanation is clear, so you can follow it easily."],
    },
    {
      title: "Similar or opposite",
      explanation:
        "Many words come in pairs of similar and opposite meanings. Frugal means careful with money, so its opposite is extravagant, and its similar word is thrifty.",
      examples: ["A frugal shopper compares prices before buying.", "An extravagant gift costs far more than planned."],
    },
    {
      title: "Judge a statement with a word",
      explanation:
        "Some sentences use a word correctly and some use it wrongly. Read the whole sentence, then decide whether the word's meaning makes sense in it.",
      examples: ["An austere room has few decorations, so it is plain."],
    },
  ],
};

export const DAY_TWO_EXERCISES: Exercise[] = [
  {
    id: "d02-match-01",
    kind: "vocabulary_matching",
    instructions: "Match each word to its meaning.",
    points: 1,
    content: {
      words: ["wary", "frugal", "lucid", "tenacious", "ephemeral"],
      meanings: [
        "lasting only briefly",
        "refusing to give up",
        "careful with money",
        "clear and easy to follow",
        "cautious about possible danger",
      ],
    },
  },
  {
    id: "d02-sim-opp-01",
    kind: "multiple_choice",
    instructions: "Pick the word with the opposite meaning.",
    points: 1,
    content: { prompt: "Which word is the opposite of frugal?", options: ["extravagant", "thrifty", "careful"] },
  },
  {
    id: "d02-sim-opp-07",
    kind: "multiple_choice",
    instructions: "Pick the word with the opposite meaning.",
    points: 1,
    content: { prompt: "Which word is the opposite of meticulous?", options: ["careless", "careful", "precise"] },
  },
  {
    id: "d02-judge-01",
    kind: "multiple_choice",
    instructions: "Decide whether the statement is true.",
    points: 1,
    content: { prompt: "Is this statement true? A frugal person spends money carelessly.", options: ["True", "False"] },
  },
];
