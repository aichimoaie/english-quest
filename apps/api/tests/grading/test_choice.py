import pytest

from english_quest_api.grading.choice import evaluate_choice
from english_quest_api.grading.results import InvalidResponseError

OPTIONS = ["a", "b", "c"]
MISCONCEPTIONS = {"a": "present_perfect_with_finished_time", "c": "present_simple"}


def test_correct_single_choice_scores_one() -> None:
    result = evaluate_choice(
        option_ids=OPTIONS,
        correct_option_ids=["b"],
        selected_option_ids=["b"],
        misconceptions=MISCONCEPTIONS,
    )
    assert result.credit == 1.0
    assert result.feedback_code == "correct"


def test_wrong_choice_returns_the_authored_misconception() -> None:
    result = evaluate_choice(
        option_ids=OPTIONS,
        correct_option_ids=["b"],
        selected_option_ids=["a"],
        misconceptions=MISCONCEPTIONS,
    )
    assert result.credit == 0.0
    assert result.feedback_code == "present_perfect_with_finished_time"


def test_wrong_choice_without_a_code_is_plain_wrong() -> None:
    result = evaluate_choice(
        option_ids=OPTIONS, correct_option_ids=["b"], selected_option_ids=["a"]
    )
    assert result.feedback_code == "wrong"


def _multi(selected: list[str]) -> float | None:
    return evaluate_choice(
        option_ids=OPTIONS,
        correct_option_ids=["a", "c"],
        selected_option_ids=selected,
        allow_multiple=True,
    ).credit


def test_multi_select_is_all_or_nothing() -> None:
    assert _multi(["c", "a"]) == 1.0
    assert _multi(["a"]) == 0.0
    assert _multi(["a", "b", "c"]) == 0.0


def test_multi_select_feedback_uses_first_wrong_option_in_option_order() -> None:
    result = evaluate_choice(
        option_ids=OPTIONS,
        correct_option_ids=["b"],
        selected_option_ids=["c", "a"],
        allow_multiple=True,
        misconceptions=MISCONCEPTIONS,
    )
    assert result.feedback_code == "present_perfect_with_finished_time"


@pytest.mark.parametrize(
    "selected",
    [[], ["z"], ["a", "a"]],
)
def test_invalid_selections_are_rejected(selected: list[str]) -> None:
    with pytest.raises(InvalidResponseError):
        evaluate_choice(option_ids=OPTIONS, correct_option_ids=["b"], selected_option_ids=selected)


def test_single_select_rejects_two_options() -> None:
    with pytest.raises(InvalidResponseError):
        evaluate_choice(
            option_ids=OPTIONS, correct_option_ids=["b"], selected_option_ids=["a", "b"]
        )


def test_content_with_an_unknown_correct_option_is_a_content_error() -> None:
    with pytest.raises(ValueError):
        evaluate_choice(option_ids=OPTIONS, correct_option_ids=["q"], selected_option_ids=["a"])
