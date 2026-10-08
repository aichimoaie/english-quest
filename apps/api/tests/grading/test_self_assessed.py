import pytest
from english_quest_api.grading.choice import evaluate_choice
from english_quest_api.grading.results import Family, InvalidResponseError
from english_quest_api.grading.self_assessed import (
    evaluate_pronunciation,
    evaluate_self_rating,
)


@pytest.mark.parametrize(("rating", "credit"), [("got_it", 1.0), ("unsure", 0.0)])
def test_self_rating_credit_is_recorded_but_not_counted_for_accuracy(
    rating: str, credit: float
) -> None:
    result = evaluate_self_rating(rating)
    assert result.credit == credit
    assert result.counts_toward_accuracy is False
    assert result.recorded is True
    assert result.family is Family.SELF_ASSESSED


def test_skipped_rating_records_nothing() -> None:
    result = evaluate_self_rating("skipped")
    assert result.recorded is False
    assert result.credit is None


def test_unknown_rating_is_rejected() -> None:
    with pytest.raises(InvalidResponseError):
        evaluate_self_rating("maybe")


def test_pronunciation_credit_comes_from_recognition_only() -> None:
    recognition = evaluate_choice(
        option_ids=["a", "b"], correct_option_ids=["a"], selected_option_ids=["a"]
    )
    result = evaluate_pronunciation(recognition=recognition, self_rating="unsure")
    assert result.credit == 1.0
    assert result.counts_toward_accuracy is True
    assert result.normalized_response == {
        "selected_option_ids": ["a"],
        "self_rating": "unsure",
    }


def test_pronunciation_with_wrong_recognition_still_records_the_rating() -> None:
    recognition = evaluate_choice(
        option_ids=["a", "b"], correct_option_ids=["a"], selected_option_ids=["b"]
    )
    result = evaluate_pronunciation(recognition=recognition, self_rating="got_it")
    assert result.credit == 0.0
    assert result.recorded is True


def test_pronunciation_skipped_rating_keeps_the_recognition_result() -> None:
    recognition = evaluate_choice(
        option_ids=["a", "b"], correct_option_ids=["a"], selected_option_ids=["a"]
    )
    result = evaluate_pronunciation(recognition=recognition, self_rating="skipped")
    assert result.credit == 1.0
    assert result.counts_toward_accuracy is True
    assert result.recorded is True
    assert result.normalized_response == {
        "selected_option_ids": ["a"],
        "self_rating": "skipped",
    }
