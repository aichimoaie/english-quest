interface DayEndScreenProps {
  dayNumber: number;
  title: string;
  finishing: boolean;
  error: string | null;
  onFinish: () => void;
}

/**
 * The screen after a day's last test. It ends the run and leads to the day result.
 * The server saves the run when the learner presses the button.
 */
export function DayEndScreen({ dayNumber, title, finishing, error, onFinish }: DayEndScreenProps) {
  return (
    <div className="stack">
      <section className="card stack" style={{ gap: "var(--s-3)" }} aria-labelledby="day-end-title">
        <p className="t-label">Day {dayNumber} finished</p>
        <h2 id="day-end-title" className="t-title" tabIndex={-1}>
          {title}
        </h2>
        <p className="lede">You have reached the end of this day.</p>
      </section>

      {error ? (
        <p className="t-small" role="alert" style={{ color: "var(--bad)" }}>
          {error}
        </p>
      ) : null}

      <button type="button" className="btn btn-primary btn-block" onClick={onFinish} disabled={finishing}>
        {finishing ? "Saving…" : "See my result"}
      </button>
    </div>
  );
}
