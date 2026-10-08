# Curriculum content

The 30-day course is authored here as reviewed YAML. One file per day:

```
content/days/day-01.yaml   # Day 1 (1 to 30)
```

Every file is checked by the curriculum validator before it is imported.

## Validate

```sh
python -m english_quest_api.curriculum validate content/days
```

Exit code 0 means every day file is valid. Exit code 1 prints each issue as
`file: location: message` (the location is omitted when it is not known), and
all issues are reported in one run.

## Day file layout

```yaml
day: 1                       # 1 to 30, must match the file name day-01.yaml
title: Greetings and the verb "be"
lessons:                     # 1 to 4 lessons, each made of lesson cards
  - id: d01-lesson-be        # must start with d01-lesson-
    learning_area: Grammar
    title: ...
    cards:                   # 1 to 6 cards
      - title: ...
        body: ...            # English only
        examples: [...]      # 0 to 3 example sentences
        watch_out: ...       # optional common mistake
vocabulary:                  # 1 to 12 words
  - word: brother
    definition: ...          # short English definition
    example: My brother ...  # one sentence that uses the word
exercises:                   # ids must start with d01-
  - id: d01-grammar-mc-01
    type: multiple_choice
    learning_area: Grammar
    origin: original
    topics: [grammar.be.present]
    points: 1
    prompt: ...
    ...                      # fields depend on type, see below
    explanation: ...         # English only, shown after the answer
```

## Learning areas

The seven areas from PRD section 4. Use the exact spelling:

`Pronunciation`, `Grammar`, `Vocabulary`, `Spelling`, `Listening`,
`Sentence construction`, `Review and retention`

## Exercise types

| `type` | Fields | Rule |
|---|---|---|
| `multiple_choice` | `choices` (2 to 4, unique), `answer` | `answer` is one of `choices` |
| `listening_comprehension` | `audio_text`, `choices`, `answer` | As above. `audio_text` is the script the audio reads |
| `pronunciation_practice` | `audio_text`, `choices`, `answer` | `answer` equals `audio_text`. Recognition only; self-rating is not authored |
| `fill_blank` | `accepted` (1 or more), `prompt` | `prompt` contains `___` |
| `spelling_correction` | `text`, `accepted` (1 or more) | `text` differs from every accepted spelling |
| `vocabulary_matching` | `pairs` (2 to 6 of `word` and `meaning`) | Words and meanings are each unique |
| `sentence_ordering` | `tokens`, `answer` | `answer` uses every token exactly once. `tokens` is not already in answer order |

Every exercise also needs `id`, `learning_area`, `origin: original`, `topics`
(dotted, such as `grammar.be.present`), `points` (1 to 10), `prompt` and
`explanation`. Unknown keys are rejected.

The grader compares a typed answer with `accepted` ignoring letter case and
surrounding spaces. Everything else must match (PRD section 5).

## Scoring

Captain decisions that apply to content (recorded on the task):

- **Spelling is all-or-nothing.** `spelling_correction` items give full points
  for an accepted spelling and no points otherwise. Authors must not add
  near-miss or partial-credit fields; the schema rejects unknown keys.
- **Pronunciation recognition counts toward stored accuracy.** A
  `pronunciation_practice` item is scored on its recognition choice, so it
  carries `points` like any other item (at least 1).
- **Self-rating is not scored.** The learner's rating after a pronunciation item
  is recorded for progress only. It is not authored in the content and gives no
  points.

## Content rules

- **Original wording only.** Write every word, example and explanation for this
  app. Do not copy from any published book, including the book named in the
  project brief. Do not copy the prototype's text either.
- **English-only explanations.** Explanations use simple English (PRD section 2).
- **Human review before publication.** Content is drafted with an LLM, then a
  person reviews it (PRD section 11). A file's status is draft until that review
  is recorded in the pull request.
- **Ids are stable.** Changing an id creates a new exercise. Change the content
  of an existing id only to fix an error.

## Reconciliation with content/schema (workstream 4)

The validator mirrors exercise envelope v1 from the exercise engine report
(section 4). The JSON Schemas under `content/schema/` are not on main yet, so
this file is the working reference for now. Before those schemas land, check
the following:

- Field names and kind names match `content/schema`. Day 1 uses the kind names
  in the table above. `vocabulary_matching` is the kind name the engine report
  gives for vocabulary matching.
- Limits match: choices 2 to 4, points 1 to 10, topics 1 to 4 items.
- The schema has a place for `kind_version` and `status`. Day 1 omits both,
  because the authoring format does not carry them yet.
- The schema has a taxonomy file for `topics`. There is none yet, so topics are
  checked only for their dotted shape.

Once the schemas exist, the validator should validate each file against them as
well, and the Day 1 fixture should pass both checks.

## Adding a day

1. Create `content/days/day-NN.yaml` with the next day number.
2. Run the validator until it reports `ok`.
3. Open a pull request. A reviewer checks wording and originality before merge.
