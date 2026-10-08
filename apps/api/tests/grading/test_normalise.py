import string

from english_quest_api.grading.normalise import normalise_text
from hypothesis import given
from hypothesis import strategies as st

WORDS = st.from_regex(r"[a-z]+( [a-z]+)*", fullmatch=True)


def test_case_whitespace_and_final_punctuation_are_ignored() -> None:
    assert normalise_text("  Receive.  ") == "receive"
    assert normalise_text("Don't stop!") == "don't stop"
    assert normalise_text("a\t\nb") == "a b"


def test_only_sentence_end_punctuation_is_dropped() -> None:
    assert normalise_text("e.g. this") == "e.g. this"
    assert normalise_text("wow ! ?") == "wow"


def test_typographic_quotes_become_ascii() -> None:
    assert normalise_text("don\N{RIGHT SINGLE QUOTATION MARK}t") == normalise_text(
        "don't"
    )


@given(st.text(max_size=60))
def test_normalise_is_idempotent(text: str) -> None:
    once = normalise_text(text)
    assert normalise_text(once) == once


@given(st.text(alphabet=string.ascii_letters + " ", min_size=1, max_size=40))
def test_case_and_padding_variants_are_equal(text: str) -> None:
    assert normalise_text(f"  {text.upper()}\t") == normalise_text(text.lower())


@given(WORDS)
def test_adding_a_final_full_stop_changes_nothing(text: str) -> None:
    assert normalise_text(text + ".") == normalise_text(text)
