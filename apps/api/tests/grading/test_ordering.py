import itertools

import pytest
from english_quest_api.grading.ordering import evaluate_ordering
from english_quest_api.grading.results import InvalidResponseError
from hypothesis import given
from hypothesis import strategies as st

KEY = ["f2", "f1", "f3"]


@pytest.mark.parametrize(
    ("ordered", "credit", "code"),
    [
        (["f2", "f1", "f3"], 1.0, "correct"),
        (["f2", "f3", "f1"], 2 / 3, "partial"),
        (["f3", "f1", "f2"], 0.0, "wrong"),
    ],
)
def test_sentence_ordering_worked_examples(
    ordered: list[str], credit: float, code: str
) -> None:
    result = evaluate_ordering(correct_order=KEY, ordered_fragment_ids=ordered)
    assert result.credit == pytest.approx(credit)
    assert result.feedback_code == code


def test_missing_fragments_make_their_pairs_discordant() -> None:
    result = evaluate_ordering(correct_order=KEY, ordered_fragment_ids=["f2", "f1"])
    assert result.credit == pytest.approx(1 / 3)


def test_duplicate_or_unknown_fragments_are_rejected() -> None:
    with pytest.raises(InvalidResponseError):
        evaluate_ordering(correct_order=KEY, ordered_fragment_ids=["f2", "f2"])
    with pytest.raises(InvalidResponseError):
        evaluate_ordering(correct_order=KEY, ordered_fragment_ids=["f9"])


def test_key_needs_at_least_three_fragments() -> None:
    with pytest.raises(ValueError):
        evaluate_ordering(correct_order=["f1", "f2"], ordered_fragment_ids=["f1"])


@given(st.permutations(list(range(1, 7))))
def test_credit_is_one_minus_inversions_over_pairs(permutation: list[int]) -> None:
    key = [f"f{i}" for i in range(1, 7)]
    ordered = [f"f{i}" for i in permutation]
    position = {fragment: index for index, fragment in enumerate(ordered)}
    inversions = sum(
        1 for a, b in itertools.combinations(key, 2) if position[a] > position[b]
    )
    total = len(key) * (len(key) - 1) // 2
    credit = evaluate_ordering(correct_order=key, ordered_fragment_ids=ordered).credit
    assert credit == pytest.approx(1 - inversions / total)


@given(st.integers(min_value=3, max_value=8))
def test_identity_scores_one_and_reverse_scores_zero(n: int) -> None:
    key = [f"f{i}" for i in range(1, n + 1)]
    assert evaluate_ordering(correct_order=key, ordered_fragment_ids=key).credit == 1.0
    reverse = list(reversed(key))
    assert (
        evaluate_ordering(correct_order=key, ordered_fragment_ids=reverse).credit == 0.0
    )
