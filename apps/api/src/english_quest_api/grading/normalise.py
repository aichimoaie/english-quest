"""Text normalisation for typed answers.

Pure module: no I/O, no clock, no randomness.
"""


def normalise_text(text: str) -> str:
    """Return the canonical form used for every typed-answer comparison.

    Only lower-casing and stripping of surrounding whitespace apply.
    Punctuation, inner spacing, quote characters and letter forms must match
    exactly.
    """
    return text.lower().strip()
