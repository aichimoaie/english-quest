"""Text normalisation for the text_input family.

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
