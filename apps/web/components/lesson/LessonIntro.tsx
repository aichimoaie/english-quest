import { ProgressBar } from "@/components/ui/ProgressBar";

/** One supporting panel on a lesson screen. Each kind has its own look. */
export type LessonPanel =
  | { kind: "tip"; title: string; body: string }
  | { kind: "example"; title: string; items: string[] }
  | { kind: "hint"; title: string; body: string }
  | { kind: "explain"; title: string; body: string };

export interface LessonIntroProps {
  /** Optional part heading, shown above the day, such as a foreword. */
  part?: { label: string; title: string; text: string };
  /** The day heading and its introduction. */
  day?: { label: string; title: string; intro: string };
  panels?: LessonPanel[];
  ctaLabel: string;
  onContinue: () => void;
}

/**
 * A lesson screen shown before a block of exercises. It is read-only: the
 * learner reads the part, the day and its panels, then continues.
 */
export function LessonIntro({ part, day, panels = [], ctaLabel, onContinue }: LessonIntroProps) {
  return (
    <div className="stack">
      <ProgressBar value={0} label="Lesson" />
      <section className="stack" style={{ gap: "var(--s-3)" }}>
        {part ? (
          <article className="card stack" style={{ gap: "var(--s-3)" }}>
            <p className="t-label">{part.label}</p>
            <h2 className="t-head">{part.title}</h2>
            <p className="t-body">{part.text}</p>
          </article>
        ) : null}
        {day ? (
          <article className="card stack" style={{ gap: "var(--s-3)" }}>
            <p className="t-label">{day.label}</p>
            <h2 className="t-head">{day.title}</h2>
            <p className="t-body">{day.intro}</p>
          </article>
        ) : null}
        {panels.map((panel, position) => (
          <LessonPanelView key={position} panel={panel} />
        ))}
      </section>
      <button type="button" className="btn btn-primary btn-block" onClick={onContinue}>
        {ctaLabel}
      </button>
    </div>
  );
}

function LessonPanelView({ panel }: { panel: LessonPanel }) {
  if (panel.kind === "tip") {
    return (
      <section className="card tint stack" style={{ gap: "var(--s-2)" }}>
        <h2 className="t-head">{panel.title}</h2>
        <p className="t-body">{panel.body}</p>
      </section>
    );
  }
  if (panel.kind === "example") {
    return (
      <section className="card stack" style={{ gap: "var(--s-2)" }}>
        <h2 className="t-head">{panel.title}</h2>
        <ul className="notes" style={{ background: "var(--brand-soft)" }}>
          {panel.items.map((item) => (
            <li key={item} style={{ color: "var(--ink)" }}>
              {item}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (panel.kind === "hint") {
    return (
      <section className="notes">
        <h4>{panel.title}</h4>
        <p>{panel.body}</p>
      </section>
    );
  }
  return (
    <section className="card stack" style={{ gap: "var(--s-2)" }}>
      <h2 className="t-head">{panel.title}</h2>
      <p className="t-body">{panel.body}</p>
    </section>
  );
}
