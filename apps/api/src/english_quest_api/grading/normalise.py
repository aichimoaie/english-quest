"""Text normalisation and edit distance for the text_input family.

Pure module: no I/O, no clock, no randomness.
"""

import re
import unicodedata

_CURLY_TO_STRAIGHT = str.maketrans(
    {
        "\N{LEFT SINGLE QUOTATION MARK}": "'",
        "\N{RIGHT SINGLE QUOTATION MARK}": "'",
        "\N{LEFT DOUBLE QUOTATION MARK}": '"',
        "\N{RIGHT DOUBLE QUOTATION MARK}": '"',
    }
)
# Sentence-end punctuation and any whitespace around it, at the very end only.
_TRAILING_SENTENCE_END = re.compile(r"[\s.!?]+$")


def normalise_text(text: str) -> str:
    """Return the canonical form used for every text comparison.

    Steps, in order: Unicode NFC, case-fold, typographic quotes to ASCII,
    collapse runs of whitespace, then drop trailing sentence-end punctuation.
    Punctuation inside the sentence is kept, so "don't" and "don't." differ
    only by the final full stop.
    """
    folded = unicodedata.normalize("NFC", text).casefold()
    straight = folded.translate(_CURLY_TO_STRAIGHT)
    collapsed = " ".join(straight.split())
    return _TRAILING_SENTENCE_END.sub("", collapsed)


def edit_distance(left: str, right: str) -> int:
    """Levenshtein distance counting insertions, deletions and substitutions."""
    if left == right:
        return 0
    if not left:
        return len(right)
    if not right:
        return len(left)
    previous = list(range(len(right) + 1))
    for i, left_char in enumerate(left, start=1):
        current = [i]
        for j, right_char in enumerate(right, start=1):
            cost = 0 if left_char == right_char else 1
            current.append(
                min(
                    previous[j] + 1,
                    current[j - 1] + 1,
                    previous[j - 1] + cost,
                )
            )
        previous = current
    return previous[-1]
