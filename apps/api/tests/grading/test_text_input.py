import pytest
from english_quest_api.grading.results import NEAR_MISS_CREDIT, Family
from english_quest_api.grading.text_input import Profile, UnmatchedPolicy, evaluate_text
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


def test_empty_response_is_wrong_even_for_short_answers() -> None:
    result = evaluate_text(
        response="   ",
        accepted=["a"],
        profile=Profile.SPELLING,
        near_miss_max_edits=1,
    )
    assert result.credit == 0.0


@pytest.mark.parametrize(
    ("response", "credit", "code"),
    [
        ("receive", 1.0, "correct"),
        ("receve", NEAR_MISS_CREDIT, "near_miss"),
        ("recieve", 0.0, "wrong"),
    ],
)
def test_spelling_profile_allows_one_marked_edit(
    response: str, credit: float, code: str
) -> None:
    result = evaluate_text(
        response=response,
        accepted=["receive"],
        profile=Profile.SPELLING,
        near_miss_max_edits=1,
    )
    assert result.credit == credit
    assert result.feedback_code == code


def test_unmarked_content_gives_no_near_miss_credit() -> None:
    result = evaluate_text(
        response="receve", accepted=["receive"], profile=Profile.SPELLING
    )
    assert result.credit == 0.0


def test_near_miss_is_refused_for_the_exact_profile() -> None:
    with pytest.raises(ValueError):
        evaluate_text(response="receve", accepted=["receive"], near_miss_max_edits=1)


@pytest.mark.parametrize("bad_limit", [-1, 2])
def test_near_miss_limit_is_capped_at_one_edit(bad_limit: int) -> None:
    with pytest.raises(ValueError):
        evaluate_text(
            response="x",
            accepted=["x"],
            profile=Profile.SPELLING,
            near_miss_max_edits=bad_limit,
        )


def test_sentence_transformation_unmatched_answer_needs_review() -> None:
    result = evaluate_text(
        response="She doesn't like tea.",
        accepted=["She does not like tea."],
        unmatched=UnmatchedPolicy.NEEDS_REVIEW,
    )
    assert result.credit is None
    assert result.feedback_code == "needs_review"


def test_needs_review_never_hides_an_accepted_match() -> None:
    result = evaluate_text(
        response="she does not like tea",
        accepted=["She does not like tea."],
        unmatched=UnmatchedPolicy.NEEDS_REVIEW,
    )
    assert result.credit == 1.0


@given(word=WORD, extra=st.text(alphabet="xyz", min_size=2, max_size=2))
def test_two_extra_letters_are_never_a_near_miss(word: str, extra: str) -> None:
    result = evaluate_text(
        response=word + extra,
        accepted=[word],
        profile=Profile.SPELLING,
        near_miss_max_edits=1,
    )
    assert result.credit == 0.0


@given(word=WORD)
def test_one_extra_letter_is_a_near_miss(word: str) -> None:
    result = evaluate_text(
        response=word + "z",
        accepted=[word],
        profile=Profile.SPELLING,
        near_miss_max_edits=1,
    )
    assert result.credit == NEAR_MISS_CREDIT
