import pytest
from english_quest_api.grading.results import Family
from english_quest_api.grading.text_input import evaluate_text
from hypothesis import given
from hypothesis import strategies as st

WORD = st.text(alphabet="abcdefghijklmnopqrstuvwxyz", min_size=4, max_size=12)


def test_exact_match_ignores_case_and_surrounding_spaces() -> None:
    result = evaluate_text(response="  WALKS ", accepted=["walks"])
    assert result.credit == 1.0
    assert result.feedback_code == "correct"
    assert result.normalized_response == {"text": "walks"}
    assert result.family is Family.TEXT_INPUT


def test_any_accepted_answer_matches() -> None:
    result = evaluate_text(response="color", accepted=["colour", "color"])
    assert result.credit == 1.0


def test_wrong_answer_gets_zero_and_reveals_first_accepted() -> None:
    result = evaluate_text(response="walk", accepted=["walks"])
    assert result.credit == 0.0
    assert result.feedback_code == "wrong"
    assert result.feedback_params == {"correct_answer": "walks"}


@pytest.mark.parametrize("response", ["receve", "recieve", "receives"])
def test_spelling_is_all_or_nothing(response: str) -> None:
    result = evaluate_text(response=response, accepted=["receive"])
    assert result.credit == 0.0
    assert result.feedback_code == "wrong"


@pytest.mark.parametrize("response", ["dont", "dont.", "don't."])
def test_punctuation_inside_or_after_the_answer_must_match(response: str) -> None:
    result = evaluate_text(response=response, accepted=["don't"])
    assert result.credit == 0.0


def test_missing_final_full_stop_is_wrong() -> None:
    result = evaluate_text(
        response="She does not like tea", accepted=["She does not like tea."]
    )
    assert result.credit == 0.0


def test_inner_whitespace_must_match() -> None:
    result = evaluate_text(response="ice  cream", accepted=["ice cream"])
    assert result.credit == 0.0


def test_empty_response_never_matches() -> None:
    result = evaluate_text(response="   ", accepted=["a", "."])
    assert result.credit == 0.0


def test_unmatched_sentence_transformation_is_wrong_not_pending() -> None:
    result = evaluate_text(
        response="She doesn't like tea.", accepted=["She does not like tea."]
    )
    assert result.credit == 0.0
    assert result.feedback_code == "wrong"


def test_empty_accepted_set_is_a_content_error() -> None:
    with pytest.raises(ValueError):
        evaluate_text(response="x", accepted=[])


@given(word=WORD, extra=st.text(alphabet="xyz", min_size=1, max_size=3))
def test_any_extra_letters_are_wrong(word: str, extra: str) -> None:
    assert evaluate_text(response=word + extra, accepted=[word]).credit == 0.0


@given(word=WORD, letter=st.sampled_from("xyz"))
def test_a_one_letter_typo_is_wrong(word: str, letter: str) -> None:
    assert evaluate_text(response=word + letter, accepted=[word]).credit == 0.0
