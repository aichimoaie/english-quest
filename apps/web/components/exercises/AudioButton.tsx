/**
 * Plays a clip on demand; replays are free and do not affect the score.
 * The audio source is still open (PRD section 18), so a null URL shows a clear
 * "not ready" note instead of a broken control.
 */
export function AudioButton({ audioUrl, label = "Play audio" }: { audioUrl: string | null; label?: string }) {
  if (!audioUrl) {
    return <p className="t-small">Audio for this item is not ready yet. Read the text instead.</p>;
  }

  return <audio src={audioUrl} preload="none" controls aria-label={label} style={{ width: "100%", minHeight: 48 }} />;
}
