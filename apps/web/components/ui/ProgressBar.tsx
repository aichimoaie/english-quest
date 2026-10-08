import { cx } from "@/lib/cx";

export function ProgressBar({ value, label, tone = "brand" }: { value: number; label: string; tone?: "brand" | "sun" }) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="progress-meta">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className={cx("bar-track", tone === "sun" && "sun")} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
