import Link from "next/link";
import { Icon } from "@/components/ui/IconSprite";

export function ReviewHub() {
  return (
    <div className="stack">
      <header className="stack" style={{ gap: "var(--s-2)" }}>
        <p className="t-label">Review</p>
        <h1 className="t-title">Keep what you learned</h1>
        <p className="lede">Review brings back earlier days. Answers here are practice only: they do not change your accuracy or your day progress.</p>
      </header>

      <Link href="/review/daily" className="card stack" style={{ gap: "var(--s-2)", textDecoration: "none", color: "inherit" }}>
        <span className="chip brand">
          <Icon name="refresh" className="sm" /> Daily
        </span>
        <h2 className="t-head">Daily review</h2>
        <p className="t-small">A short set from the days you have finished.</p>
      </Link>

      <Link href="/review/mixed" className="card stack" style={{ gap: "var(--s-2)", textDecoration: "none", color: "inherit" }}>
        <span className="chip">
          <Icon name="star" className="sm" /> Mixed
        </span>
        <h2 className="t-head">Mixed review</h2>
        <p className="t-small">A bigger set across all finished days, with different kinds of questions.</p>
      </Link>
    </div>
  );
}
