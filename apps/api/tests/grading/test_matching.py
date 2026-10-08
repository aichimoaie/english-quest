import pytest
from english_quest_api.grading.matching import evaluate_matching
from english_quest_api.grading.results import Family, InvalidResponseError
from hypothesis import given
from hypothesis import strategies as st

KEY = {"hot": "cold", "big": "small", "fast": "slow"}


def test_all_pairs_correct_scores_one() -> None:
    result = evaluate_matching(answer_key=KEY, response=dict(KEY))
    assert result.credit == 1.0
    assert result.feedback_code == "correct"
    assert result.family is Family.MATCHING


def test_partial_credit_is_per_correct_pair() -> None:
    result = evaluate_matching(
        answer_key=KEY,
        response={"hot": "cold", "big": "cold", "fast": "slow"},
    )
    assert result.credit == pytest.approx(2 / 3)
    assert result.feedback_code == "partial"


def test_no_correct_pairs_is_wrong() -> None:
    result = evaluate_matching(answer_key=KEY, response={"hot": "small"})
    assert result.credit == 0.0
    assert result.feedback_code == "wrong"


def test_missing_pairs_count_as_wrong() -> None:
    result = evaluate_matching(answer_key=KEY, response={"hot": "cold"})
    assert result.credit == pytest.approx(1 / 3)


def test_unknown_left_hand_id_is_rejected() -> None:
    with pytest.raises(InvalidResponseError):
        evaluate_matching(answer_key=KEY, response={"tall": "short"})


def test_right_hand_item_may_appear_once_in_the_key() -> None:
    with pytest.raises(ValueError):
        evaluate_matching(answer_key={"a": "x", "b": "x"}, response={})


@given(
    st.permutations(["cold", "small", "slow", "dry"]),
    st.lists(st.booleans(), min_size=4, max_size=4),
)
def test_credit_equals_share_of_correct_pairs(
    rights: list[str], keep: list[bool]
) -> None:
    lefts = ["hot", "big", "fast", "wet"]
    key = dict(zip(lefts, ["cold", "small", "slow", "dry"], strict=True))
    response = {
        left: (right if ok else "none")
        for left, right, ok in zip(lefts, rights, keep, strict=True)
    }
    expected = sum(1 for left in lefts if response[left] == key[left]) / 4
    assert evaluate_matching(answer_key=key, response=response).credit == pytest.approx(
        expected
    )
