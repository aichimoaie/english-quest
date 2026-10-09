# Curriculum content

The 30-day course is authored here as reviewed YAML. One file per day:

```
content/days/day-NN.yaml   # NN is the day number, 01 to 30
```

Every file is checked by the curriculum validator before it is imported.

## Validate

`validate_content_dir` in `apps/api/src/english_quest_api/curriculum` checks
every entry in this directory. It reports each issue as
`file: location: message` (the location is omitted when it is not known), and
all issues are reported in one run. A misnamed file such as `day-02.yml` is
reported, not skipped. A YAML mapping key written twice, and a merge key (`<<`),
is reported as invalid YAML, so no key can silently override another.

## Import

`import_days` writes validated content through the `ContentStore` port, keyed by
content hash, so importing unchanged content writes nothing. The database
binding of `ContentStore` is deferred to the database integration and is not
part of this change.

## Day file layout

A day is an ordered list of screens. A text screen is a day intro or reading
text. A test screen holds one test: its intro, its items, and the results
screen that follows them.

```yaml
day: 1                       # 1 to 30, must match the file name day-01.yaml
title: Greetings and the verb "be"
vocabulary:                  # 1 to 12 words
  - word: brother
    definition: ...          # short English definition
    example: My brother ...  # example sentence
    audio_ref: d01-vocab-brother  # name of the word's audio file (required)
screens:                     # in the order the learner meets them
  - kind: text               # a day intro or reading text
    id: d01-screen-intro     # dNN-screen-<name>, lowercase
    title: ...
    cards:                   # 1 to 6 cards
      - title: ...
        body: ...            # English only
        examples: [...]      # 0 to 3 example sentences
        watch_out: ...       # optional common mistake
  - kind: test               # one test: its intro, its items, then its results
    id: d01-test-1          # dNN-test-<name>, lowercase
    title: ...
    intro: ...               # the test's instructions, shown before its Start button
    explain: true            # optional; shows each item's explanation after its answer and on the results screen
    items:                   # 1 or more exercises
      - id: d01-grammar-mc-01  # dNN-<name>, lowercase, unique within the day
        type: multiple_choice
        ...                  # fields depend on type, see below
        explanation: ...     # English only, shown after the answer
```

Rules for the layout:

- `kind` is `text` or `test`. Every screen has an `id`, and the screen ids and
  exercise ids must be unique within the day together.
- The first screen is a text screen (the day intro). A day may end on a test or
  on a text screen: the day ends after its last screen.
- `vocabulary` is reference material. The lesson page lists it. The practice
  flow does not show it.
- A test's `intro` is required. A test with items is never empty.

## Screen flow

The learner meets a day's screens in order:

1. Text screens. The first one's button is Start, and each later text screen's button is Next.
2. For each test: the test's intro with a Start button, then its items, one per
   screen. Then the test's results screen, which shows that test's score and the
   answer key for each item. A Next button leads on. With `explain: true`, each
   item's explanation shows after the learner answers it and again on the results
   screen. Without it, neither shows one.
3. After the last screen: the day-end screen. Its button saves the run and opens the
   day result.

A test with no scored items (for example, all `self_check`) has no score. Its
results screen says "Your answers are in" and notes each answer instead.

## Learning areas

The seven areas from PRD section 4. Use the exact spelling:

`Pronunciation`, `Grammar`, `Vocabulary`, `Spelling`, `Listening`,
`Sentence construction`, `Review and retention`

## Exercise types

| `type` | Fields | Rule |
|---|---|---|
| `multiple_choice` | `choices` (2 to 5, unique), `answer` | `answer` is one of `choices` |
| `listening_comprehension` | `audio_text`, `choices`, `answer` | As above. `audio_text` is the script the audio reads |
| `pronunciation_practice` | `audio_text`, `choices`, `answer` | Recognition only |
| `pronunciation_self_rating` | `audio_text` | Unscored. No `points`, `answer`, `choices` or `accepted`. The learner says the sentence aloud and rates it |
| `self_check` | (no fields beyond the common ones) | Unscored text item, used only by an unscored self-check test such as Day 4 Test 10. No `points`, `answer`, `choices` or `accepted`. The learner answers yes or no about their own speech or writing, and the answer is a note, not a verdict |
| `fill_blank` | `accepted` (1 or more), `prompt` | None |
| `spelling_correction` | `text`, `accepted` (1 or more) | All-or-nothing (see Scoring) |
| `vocabulary_matching` | `pairs` (2 to 10 of `word` and `meaning`) | None |
| `sentence_ordering` | `tokens`, `answer` | `answer` uses every token exactly once |

Every exercise also needs `id`, `learning_area`, `origin: original`, `topics`
(dotted, such as `grammar.be.present`), `difficulty` (1 to 3), `prompt` and
`explanation`. Every type except `pronunciation_self_rating` and `self_check`
also needs `points` (1 to 10). Unknown keys are rejected.

Choices are unique when letter case and extra spaces are ignored. The grader
compares a typed answer with `accepted` ignoring letter case and surrounding
spaces. Everything else must match (PRD section 5).

## Scoring

The scoring rules are owned by PRD sections 5 and 6. Three content decisions
follow from them:

- Spelling items are all-or-nothing (no partial credit). Do not add
  partial-credit fields.
- Pronunciation recognition items count toward stored accuracy, so they carry
  `points`.
- `pronunciation_self_rating` and `self_check` items are unscored and carry no
  `points`. Rating labels are an open question in PRD section 18.

## Content rules

- **Original wording only.** Write every word, example and explanation for this
  app. Do not copy from any published book, including the book named in the
  project brief. Do not copy the prototype's text either.
  - **Exception: Days 1 to 14.** These are the reference book's text, copied
    verbatim with the owner's written approval. Each file's header says so. Days 15
    and later must use original wording.
- **English-only explanations.** Explanations use simple English (PRD section 2).
- **Human review before publication.** Content is drafted with an LLM, then a
  person reviews it (PRD section 11). A file's status is draft until that review
  is recorded in the pull request.
- **Ids are stable.** Changing an id creates a new exercise. Change the content
  of an existing id only to fix an error.

## Reconciliation with content/schema

The validator mirrors exercise envelope v1 from the exercise engine report
(section 4). The JSON Schemas under `content/schema/` are not on main yet, so
this file is the working reference for now. Before those schemas land, check
the following:

- Field names and kind names match `content/schema`. Day 1 uses the kind names
  in the table above. `vocabulary_matching` is the kind name the engine report
  gives for vocabulary matching.
- Limits match: choices 2 to 5, points 1 to 10, topics 1 to 4 items.
- The schema has a place for `kind_version` and `status`. The day files omit both,
  because the authoring format does not carry them yet.
- The schema has a taxonomy file for `topics`. `content/tags.yaml` is the tag
  vocabulary (skills, difficulty scale, topics, exercise types). The validator
  checks only the dotted shape of `topics`; the tests in
  `apps/api/tests/curriculum/test_tagged_day_content.py` check the other
  tags against `tags.yaml`.

Once the schemas exist, the validator should validate each file against them as
well, and `content/days/day-01.yaml` should pass both checks.

## Adding a day

1. Create `content/days/day-NN.yaml` with the next day number, and lay it out as
   screens: a text screen first, then tests and text screens in the book's order.
2. Tag every exercise with values from `content/tags.yaml`.
3. Run `validate_content_dir` on `content/days` until its report is `ok`. There
   is no command-line entry point yet.
4. Open a pull request. A reviewer checks wording and originality before merge.
