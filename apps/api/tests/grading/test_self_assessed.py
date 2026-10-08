import pytest
from english_quest_api.grading.choice import evaluate_choice
from english_quest_api.grading.results import EvaluationResult, Family
from english_quest_api.grading.self_assessed import evaluate_pronunciation


def _recognition(selected: str) -> EvaluationResult:
    return evaluate_choice(
        option_ids=["a", "b"], correct_option_ids=["a"], selected_option_ids=[selected]
    )


@pytest.mark.parametrize("rating", ["got_it", "unsure", "skipped"])
def test_self_rating_is_stored_without_changing_credit(rating: str) -> None:
    recognition = _recognition("a")
    result = evaluate_pronunciation(recognition=recognition, self_rating=rating)
    assert result.credit == 1.0
    assert result.normalized_response["self_rating"] == rating
    assert result.family is Family.SELF_ASSESSED


def test_pronunciation_credit_comes_from_recognition_only() -> None:
    result = evaluate_pronunciation(recognition=_recognition("a"), self_rating="unsure")
    assert result.credit == 1.0
    assert result.normalized_response == {
        "selected_option_ids": ["a"],
        "self_rating": "unsure",
    }


def test_pronunciation_with_wrong_recognition_still_records_the_rating() -> None:
    result = evaluate_pronunciation(recognition=_recognition("b"), self_rating="got_it")
    assert result.credit == 0.0
    assert result.normalized_response["self_rating"] == "got_it"


def test_pronunciation_skipped_rating_keeps_the_recognition_result() -> None:
    result = evaluate_pronunciation(recognition=_recognition("a"), self_rating="skipped")
    assert result.credit == 1.0
    assert result.normalized_response == {
        "selected_option_ids": ["a"],
        "self_rating": "skipped",
    }
