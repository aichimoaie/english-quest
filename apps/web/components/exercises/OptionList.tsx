import { cx } from "@/lib/cx";

interface OptionListProps {
  options: string[];
  selected: number | null;
  onSelect: (index: number) => void;
  /** Set once the server has answered, so the choice cannot change. */
  locked: boolean;
  /** Server verdict for the selected option, if any. */
  verdict: boolean | null;
  label: string;
}

/** A vertical list of tap targets, each at least 56px tall. Used by every choice-based item. */
export function OptionList({ options, selected, onSelect, locked, verdict, label }: OptionListProps) {
  return (
    <div role="group" aria-label={label}>
      {options.map((option, index) => {
        const isSelected = selected === index;
        const letter = String.fromCharCode(65 + index);
        return (
          <button
            key={`${index}-${option}`}
            type="button"
            className={cx(
              "choice",
              isSelected && !locked && "selected",
              isSelected && verdict === true && "correct",
              isSelected && verdict === false && "wrong",
              locked && !isSelected && "dim",
            )}
            aria-pressed={isSelected}
            disabled={locked}
            onClick={() => onSelect(index)}
          >
            <span className="key" aria-hidden="true">
              {isSelected && verdict === true ? "✓" : isSelected && verdict === false ? "✕" : letter}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}
