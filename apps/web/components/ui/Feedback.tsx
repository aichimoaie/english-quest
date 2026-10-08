import { Icon } from "./IconSprite";

export type FeedbackTone = "ok" | "bad" | "note";

/** Feedback panel shown under an exercise once the server has answered. */
export function Feedback({ tone, title, children }: { tone: FeedbackTone; title: string; children?: React.ReactNode }) {
  const icon = tone === "ok" ? "check" : tone === "bad" ? "x" : "bulb";
  return (
    <div className={`feedback ${tone}`} role="status">
      <Icon name={icon} />
      <div>
        <h4>{title}</h4>
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
}
