import Link from "next/link";
import { Icon } from "@/components/ui/IconSprite";

export default function LandingPage() {
  return (
    <div className="stack">
      <header className="stack" style={{ gap: "var(--s-3)", paddingTop: "var(--s-4)" }}>
        <p className="t-label">30 days · A1 to A2</p>
        <h1 className="t-display">Learn a little English every day</h1>
        <p className="lede">
          Short lessons, quick practice and clear feedback. Explanations are in simple English, and every day ends with a result you can see.
        </p>
      </header>

      <div className="stack">
        <Link className="btn btn-primary btn-block" href="/course">
          Open my course
        </Link>
        <Link className="btn btn-secondary btn-block" href="/progress">
          See my progress
        </Link>
      </div>

      <section className="card stack" style={{ gap: "var(--s-4)" }} aria-labelledby="how-a-day-works">
        <h2 id="how-a-day-works" className="t-head">
          How a day works
        </h2>
        <ol className="stack" style={{ gap: "var(--s-3)", paddingLeft: 0, listStyle: "none", margin: 0 }}>
          <li className="row" style={{ alignItems: "flex-start" }}>
            <Icon name="book" />
            <span>
              <strong>Learn.</strong> Read a short lesson with a few examples.
            </span>
          </li>
          <li className="row" style={{ alignItems: "flex-start" }}>
            <Icon name="play" />
            <span>
              <strong>Practise.</strong> One question per screen. Retries are free.
            </span>
          </li>
          <li className="row" style={{ alignItems: "flex-start" }}>
            <Icon name="check" />
            <span>
              <strong>Check.</strong> Reach 70% in one run to finish the day and open the next.
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}
