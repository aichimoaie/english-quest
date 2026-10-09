"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/IconSprite";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { useDay } from "@/lib/api/hooks";

export function LessonView({ day: dayNumber }: { day: number }) {
  const day = useDay(dayNumber);

  if (day.isPending) return <LoadingState label="Loading the lesson…" />;
  if (day.isError) return <ErrorState />;

  const { lesson, title, status, exercises } = day.data;
  const hasLesson = lesson.vocabulary.length > 0 || lesson.grammar.length > 0;

  return (
    <div className="stack">
      <Link href={`/days/${dayNumber}`} className="back">
        <Icon name="back" /> Day {dayNumber}
      </Link>

      <header className="stack" style={{ gap: "var(--s-2)" }}>
        <p className="t-label">Lesson</p>
        <h1 className="t-title">{title}</h1>
      </header>

      {status === "locked" ? (
        <div className="card tint">
          <p>Finish day {dayNumber - 1} to unlock this lesson.</p>
        </div>
      ) : !hasLesson ? (
        <div className="card flat">
          <p>This lesson is not published yet.</p>
        </div>
      ) : (
        <>
          {lesson.grammar.map((point) => (
            <section key={point.title} className="card stack" style={{ gap: "var(--s-3)" }}>
              <h2 className="t-head">{point.title}</h2>
              <p className="t-body">{point.explanation}</p>
              {point.watchOut ? (
                <p className="t-body">
                  <strong>Watch out:</strong> {point.watchOut}
                </p>
              ) : null}
              <ul className="notes" style={{ background: "var(--brand-soft)" }}>
                {point.examples.map((example) => (
                  <li key={example} style={{ color: "var(--ink)" }}>
                    {example}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {lesson.vocabulary.length > 0 ? (
            <section className="stack" style={{ gap: "var(--s-3)" }}>
              <h2 className="section-title">New words</h2>
              {lesson.vocabulary.map((item) => (
                <article key={item.word} className="card vocab">
                  <p className="word">{item.word}</p>
                  <p className="t-body">{item.definition}</p>
                  <p className="example">“{item.example}”</p>
                </article>
              ))}
            </section>
          ) : null}

          {exercises.length > 0 ? (
            <Link className="btn btn-primary btn-block" href={`/days/${dayNumber}/play`}>
              Start practice
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
