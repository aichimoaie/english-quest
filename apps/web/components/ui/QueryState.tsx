import type { ReactNode } from "react";

/** Shared loading and error copy for data-backed screens. Plain English, no jargon. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <p className="t-small" role="status">
      {label}
    </p>
  );
}

export function ErrorState({ message = "Something went wrong. Try again in a moment.", action }: { message?: string; action?: ReactNode }) {
  return (
    <div className="card" role="alert">
      <p>{message}</p>
      {action ? <div style={{ marginTop: "var(--s-3)" }}>{action}</div> : null}
    </div>
  );
}
