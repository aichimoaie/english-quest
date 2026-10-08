# English Quest — Product Requirements Document

Status: Draft v0.1 · Owner: product · Scope: MVP

Items marked **Open** are not decided and are collected in section 18. Everything else is settled.

## 1. Product goal

English Quest helps one learner improve their English in 30 days. Each day is a short, focused session that teaches a little, practises it, and checks the result. The learner starts at A1 to A2 and should finish the 30 days with a clearer grasp of everyday vocabulary, core grammar, spelling, listening, and pronunciation recognition, and with a habit of reviewing what they have learned.

Success for the MVP means the learner completes the 30 days on the app and can see their own progress at every step.

## 2. Target user

- **Who:** one adult learner at A1 to A2 who wants steady, short daily practice.
- **Accounts:** a single learner signs in with email and password. There is no public sign-up; the learner's account is created by the operator.
- **Language of instruction:** all explanations are in English. The learner is expected to read simple English.
- **Device:** most sessions happen on a phone, so the app is mobile-first.

## 3. 30-day learning model

- The course has 30 days. Each day has a fixed set of lessons and exercises, usually 15 to 20 minutes.
- **Order:** days unlock in order. Day N+1 unlocks only after Day N is complete.
- **Completion:** a day counts as complete at **70%** (see section 6).
- **Missed days:** a missed day pauses the schedule. It does not break the streak, and the learner resumes at the next unlocked day.
- **Retries:** the learner can retry any exercise without limit. Retries give feedback but do not change the recorded score.
- **Content:** each day has one focus area, but every day also includes a short review of earlier days.

## 4. Learning areas

| Area | What the learner does |
|---|---|
| Pronunciation | Recognises a spoken word or sentence and self-rates (recognition only, see section 9) |
| Grammar | Chooses, fills in, corrects, and transforms sentences |
| Vocabulary | Learns and matches words to meanings, synonyms, and opposites |
| Spelling | Corrects and types words accurately |
| Listening | Answers questions about short audio clips |
| Sentence construction | Orders words and rewrites sentences |
| Review and retention | Revisits earlier items on a schedule (section 8) |

## 5. Exercise types

Each type has one line of definition and one scoring rule. The rules are proposed defaults; section 6 gives the general principle.

| # | Type | Definition | Scoring rule |
|---|---|---|---|
| 1 | Multiple choice | Pick the one correct option from three or four written options. | 1 point if the first attempt is correct. |
| 2 | Fill in the blank | Type the missing word or short phrase in a sentence. | 1 point if the first attempt matches an accepted answer (case and extra spaces ignored). |
| 3 | Choose the correct word | Select the word that fits a sentence from a row of similar-looking words. | 1 point if the first attempt is correct. |
| 4 | Spelling correction | Retype a word or sentence that contains one misspelling, with the error fixed. | 1 point if the first attempt matches the correct spelling exactly (case ignored). |
| 5 | Word matching | Pair each English word with its opposite or synonym. | 1 point per pair correct on the first attempt. |
| 6 | Sentence ordering | Put shuffled words or chunks into the correct sentence order. | 1 point per sentence correct on the first attempt. |
| 7 | Vocabulary matching | Pair each word with its short English definition. | 1 point per pair correct on the first attempt. |
| 8 | Grammar correction | Fix the one grammar error in a sentence. | 1 point if the first attempt matches an accepted correction. |
| 9 | Listening comprehension | Listen to a short clip and answer a multiple-choice question. | 1 point if the first attempt is correct. Replays are free and do not affect the score. |
| 10 | Pronunciation practice | Listen to a word or sentence, choose which written option matches it, then self-rate (section 9). | The recognition choice scores 1 point on the first attempt. The self-rating is not scored. |
| 11 | Sentence transformation | Rewrite a sentence in a new form given a cue (for example, affirmative to negative). | 1 point if the first attempt matches an accepted answer. |
| 12 | Daily review | A short set drawn from earlier completed days and from vocabulary due for review (section 8). | Each item is scored by its own type. Counts toward accuracy, not toward the day's 70% threshold. |
| 13 | Mixed review | A larger set across all completed days, mixing types. Offered periodically. | Scored as daily review. Cadence is **Open**. |

## 6. Scoring

- **Points:** each scored item gives points as shown in section 5. Items are scored on the **first attempt only**.
- **Accuracy:** accuracy = points earned on first attempts ÷ points available on first attempts, shown as a percentage. Retries never change accuracy.
- **Day completion threshold: 70%.** A day is complete when its first-attempt accuracy is at least 70%. The day's score uses its lesson exercises; daily review does not count toward it.
- **Skill threshold: 80%.** A skill (for example, past simple, or spelling) is treated as mastered at 80% first-attempt accuracy. The 80% value is the working figure; the measurement window and the weak-topic rule are **Open** (section 18).
- **Vocabulary learned:** a word counts as learned when it is answered correctly on two separate days (section 10).
- **Feedback:** the learner sees the result of each item immediately, with a short English explanation.

**Open:** what happens to a day below 70%. The rules above allow a retry, but a redo does not change the recorded first-attempt score, so the day would stay incomplete and block the next unlock. A redo rule is needed before launch.

## 7. Progress tracking

The learner can always see:

- **Completed days:** for example, "12 of 30 days complete".
- **Exercise results:** per exercise and per day, with points and first-attempt accuracy.
- **Accuracy:** overall, and per learning area.
- **Weak topics:** topics below the skill threshold, with a link to practise them. The weak-topic rule is **Open**.
- **Vocabulary learned:** the count of words learned, with a list of words still in progress.
- **Pronunciation practice:** the number of recognition items completed and the self-ratings given.
- **Streak:** the number of consecutive completed days. A missed day pauses the schedule and neither adds to nor resets the streak.
- **Overall progress:** a single view of the 30-day path, showing completed, current, and locked days.

## 8. Review system

- **Daily review** is shown at the start of each session. It picks items from earlier completed days, and it includes vocabulary that is due for review.
- **Mixed review** is a larger set across all completed days. It is offered periodically; its cadence is **Open**.
- **Vocabulary due for review:** a word the learner has answered correctly once, but not yet on two separate days, stays in the review pool. A word answered incorrectly is shown again soon.
- **Retention goal:** review keeps earlier days visible without making the session longer than the planned 15 to 20 minutes.

The exact spacing and the weighting toward weak topics are **Open**.

## 9. Pronunciation requirements

- **v1 is recognition only.** The learner hears a word or sentence and chooses the written option that matches it (for example, from two words that sound alike).
- **Self-rating:** after each item, the learner rates their own pronunciation ("Got it" or "Needs practice"). The rating is recorded for progress but is not scored.
- **Speech scoring is excluded.** The app does not use the microphone and does not grade the learner's speech.
- Audio plays on demand and can be replayed without limit.
- Pronunciation practice counts toward progress (section 7) but not toward the day's 70% threshold.

## 10. Vocabulary requirements

- Each day introduces a small set of words. Each word has: the English word, part of speech, a short English definition, one new example sentence, and audio.
- Example (new wording): *"The shop opens early, so we can buy bread before work."*
- A word is **learned** when the learner answers it correctly on two separate days. The date rule uses the learner's time zone (**Open**, section 18).
- Vocabulary is practised through the matching, multiple-choice, fill-in, and listening types.
- Words are never copied from published books; all content is written for this app (section 11 and section 14 content policy).

## 11. Grammar requirements

- Grammar lessons cover the core A1 to A2 structures, such as present simple vs present continuous, articles, basic past forms, comparatives, and question forms. The final list is part of content drafting.
- Each grammar point has one short English explanation (a few sentences), at least one worked example, and a set of exercises.
- Example (new wording): *"She has worked here since May."* is correct; *"She has worked here since last May."* is shown as a contrast only with an explanation, not as a rule.
- Grammar correction and sentence transformation are the main exercise types for grammar.

**Content policy (all content):** exercise content is drafted with an LLM and **reviewed by a human before publication**. Nothing is published unreviewed. Wording must be original; no exercise, answer, explanation, or arrangement may be taken from published learning books.

## 12. Spelling requirements

- Spelling words come from the vocabulary list, so the learner practises words they are learning.
- Spelling correction and fill-in exercises accept a typed answer after trimming spaces and ignoring letter case.
- Each spelling item shows the correct form after the answer, with a short English note when a rule applies (for example, doubling a consonant).
- Accepted spelling variants (for example, British and American forms) are **Open**.

## 13. Listening requirements

- Every vocabulary word and every listening item has audio.
- Audio can be played, paused, and replayed without limit. Replays do not change the score.
- Listening comprehension items use short clips (a few seconds to about 20 seconds).
- The audio source and whether files are pre-generated and stored are **Open**.
- Playback works on mobile browsers with a single large play button.

## 14. UX principles

- **Clean and friendly, not academic.** Short sentences, plain labels, no jargon. Explanations are in simple English.
- **Mobile-first.** Layouts are designed for a phone first. Touch targets are at least 44 × 44 CSS pixels, with a 16 px side margin. There is no horizontal page scrolling.
- **Clear, immediate feedback.** Each answer is marked correct or incorrect at once, with the right answer and a short explanation.
- **Low cognitive load.** One task per screen. The next step is always obvious.
- **Motivation without manipulation.** Progress is shown plainly (days, accuracy, streak). No timers that pressure the learner, no loss-aversion tricks, no pop-up upsells.
- **Obvious progress through the 30 days.** A visible path shows where the learner is, what is done, and what is next.

## 15. MVP scope

The MVP includes:

- Email and password sign-in for one learner (account created by the operator).
- The 30-day path with ordered unlocking, the 70% day threshold, and pause-on-missed-day behaviour.
- All 13 exercise types in section 5, with first-attempt scoring and unlimited retries.
- Immediate feedback with English explanations.
- Daily review and mixed review.
- Progress tracking as described in section 7.
- Recognition-only pronunciation practice with self-rating.
- Vocabulary, grammar, spelling, and listening content for all 30 days, LLM-drafted and human-reviewed.
- A responsive web app that works on phones and desktop browsers.

## 16. Explicitly excluded features

The following are **out of scope** for the MVP:

- Placement quiz (deferred; see section 18).
- Speech scoring and any use of the microphone.
- Public sign-up or social login.
- Multiple learners, family or teacher accounts.
- Leaderboards and any comparison with other learners.
- Streak freezes or purchasable streak protection.
- Native mobile apps (iOS and Android).
- Microservices, message queues, and any infrastructure beyond the one web app, one API, and one PostgreSQL database.
- Payments, subscriptions, and certificates.
- Offline mode.
- AI chat tutor or free-form conversation practice.

## 17. Technical requirements

- **Repository:** a monorepo holding the web app, the API, and shared code.
- **Environments:** separate **dev** and **prod** environments.
- **Web app:** built as a **static export** and served as static files. It does not need a server-side rendering runtime.
- **API:** runs on its **own hostname**, separate from the web app. *(Chosen option: static web app and API on separate hostnames. The exact domain names are part of setup.)*
- **Database:** PostgreSQL, using the **newest major version Azure offers in the chosen region**.
- **Hosting region:** **East US**.
- **Cost guard:** a **monthly budget alert at 40 USD** on the Azure subscription.
- **Architecture:** one API service and one database. No microservices, no message queues, and no extra infrastructure in the MVP.
- **Authentication:** email and password, with passwords stored as salted hashes. Session lifetime is **Open**.
- **Accessibility:** text meets readable contrast, controls are keyboard reachable, and audio has visible controls.

## 18. Open questions

These are not decided. Each needs an answer before the feature that depends on it is built.

1. **80% skill-mastery threshold:** confirm the value, and define the measurement window (for example, the last N attempts or all attempts).
2. **Weak-topic rule:** define when a topic is "weak" (threshold, minimum attempts, and how recent the attempts must be).
3. **Placement quiz deferral:** confirm that the placement quiz is deferred past the MVP, and what the learner starts with until then.
4. **Grace days:** decide whether any missed days are forgiven before the schedule pauses.
5. **Time-zone source:** decide whether the learner's time zone comes from the browser, the account profile, or a setting, and how day boundaries are set.
6. **Failed day (below 70%):** decide how a redo is recorded and whether completion can be reached by a later redo (section 6).
7. **Vocabulary counting after retries:** decide whether a word answered correctly only after a retry counts toward "learned".
8. **Review spacing and weighting:** the intervals for due vocabulary, the cadence of mixed review, and how much weak topics are weighted in daily review.
9. **Audio source:** text-to-speech or recorded audio, and whether audio files are generated once and stored.
10. **Spelling variants:** whether British and American spellings are both accepted.
11. **Session lifetime:** how long a sign-in lasts.
12. **Content volume per day:** exact count of words, grammar points, and exercises per day.
13. **Domain names:** the names for the web app and API hostnames, and the dev and prod variants.
14. **Browser support:** the minimum supported mobile and desktop browser versions.
