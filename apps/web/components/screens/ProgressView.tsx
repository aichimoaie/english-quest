"use client";

import { Icon } from "@/components/ui/IconSprite";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProgress, useVocabulary } from "@/lib/api/hooks";

export function ProgressView() {
  const progress = useProgress();
  const vocabulary = useVocabulary();

  if (progress.isPending) return <LoadingState label="Loading your progress…" />;
  if (progress.isError) return <ErrorState />;

  const data = progress.data;
  const inProgress = vocabulary.data?.filter((entry) => entry.timesCorrect < 2) ?? [];

  return (
    <div className="stack">
      <header className="stack" style={{ gap: "var(--s-2)" }}>
        <p className="t-label">Progress</p>
        <h1 className="t-title">How you are doing</h1>
      </header>

      <section className="card stack" style={{ gap: "var(--s-3)" }}>
        <ProgressBar value={data.overallPct} label={`${data.completedDays} of ${data.totalDays} days complete`} />
      </section>

      <div className="grid two">
        <section className="card">
          <p className="t-label">Accuracy</p>
          <p className="t-display">{data.accuracyPct}%</p>
          <p className="t-small">Based on each question’s first answer.</p>
        </section>
        <section className="card">
          <p className="t-label">Streak</p>
          <p className="t-display">
            <span className="streak">
              <Icon name="flame" /> {data.streak.current}
            </span>
          </p>
          <p className="t-small">Longest: {data.streak.longest} days</p>
        </section>
      </div>

      <section className="card stack" style={{ gap: "var(--s-3)" }}>
        <h2 className="t-head">Words</h2>
        <p className="t-body">Learned: {data.vocabularyLearned}</p>
        {inProgress.length > 0 ? (
          <ul className="t-small" style={{ paddingLeft: "18px", margin: 0 }}>
            {inProgress.map((entry) => (
              <li key={entry.id}>{entry.word} (in progress)</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card stack" style={{ gap: "var(--s-2)" }}>
        <h2 className="t-head">Pronunciation practice</h2>
        <p className="t-body">
          {data.pronunciation.recognitionItems} recognition items · {data.pronunciation.selfRatings} self-ratings
        </p>
      </section>

      <section className="card stack" style={{ gap: "var(--s-2)" }}>
        <h2 className="t-head">Topics to practise</h2>
        {data.weakTopics.length === 0 ? (
          <p className="t-body">No weak topics yet. Keep going.</p>
        ) : (
          <ul className="t-body" style={{ paddingLeft: "18px", margin: 0 }}>
            {data.weakTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
