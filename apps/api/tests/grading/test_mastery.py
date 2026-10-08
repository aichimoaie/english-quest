from datetime import date, timedelta

import pytest
from english_quest_api.grading.mastery import (
    AttemptRecord,
    TopicWeight,
    derive_progress,
    first_scored_answers,
)
from hypothesis import given
from hypothesis import strategies as st

TODAY = date(2026, 10, 8)
SPELLING = (TopicWeight("spelling.ie_ei", 1.0),)


def attempt(
    sequence: int,
    exercise: str,
    credit: float,
    *,
    points: int = 1,
    days_ago: int = 0,
    topics: tuple[TopicWeight, ...] = SPELLING,
    practice: bool = False,
    counts: bool = True,
) -> AttemptRecord:
    return AttemptRecord(
        sequence=sequence,
        exercise_id=exercise,
        answered_on=TODAY - timedelta(days=days_ago),
        points=points,
        credit=credit,
        topics=topics,
        is_practice=practice,
        counts_toward_accuracy=counts,
    )


def test_accuracy_counts_only_the_first_answer_per_exercise() -> None:
    summary = derive_progress(
        [attempt(1, "ex_a", 0.0, points=2), attempt(2, "ex_a", 1.0, points=2)],
        today=TODAY,
    )
    assert summary.accuracy == 0.0
    assert summary.scored_items == 1


def test_accuracy_is_points_weighted() -> None:
    summary = derive_progress(
        [attempt(1, "ex_a", 1.0, points=2), attempt(2, "ex_b", 0.5, points=2)],
        today=TODAY,
    )
    assert summary.accuracy == pytest.approx(0.75)


def test_practice_answers_never_change_accuracy() -> None:
    base = [attempt(1, "ex_a", 1.0)]
    with_practice = [*base, attempt(2, "ex_b", 0.0, practice=True)]
    assert derive_progress(base, today=TODAY) == derive_progress(
        with_practice, today=TODAY
    )


def test_a_wrong_first_answer_is_not_replaced_by_a_later_right_one() -> None:
    summary = derive_progress(
        [attempt(1, "ex_a", 0.0), attempt(2, "ex_a", 1.0)],
        today=TODAY,
    )
    assert summary.accuracy == 0.0
    assert summary.scored_items == 1


@pytest.mark.parametrize("weight", [0.0, -1.0, float("nan")])
def test_non_positive_topic_weight_is_rejected(weight: float) -> None:
    with pytest.raises(ValueError, match="topic weight must be positive"):
        TopicWeight("spelling.ie_ei", weight)


def test_self_rated_answers_are_excluded_from_accuracy() -> None:
    summary = derive_progress([attempt(1, "ex_a", 0.0, counts=False)], today=TODAY)
    assert summary.accuracy is None
    assert summary.topics == ()


def test_three_wrong_answers_make_a_topic_weak() -> None:
    attempts = [attempt(i, f"ex_{i}", 0.0) for i in range(1, 4)]
    (topic,) = derive_progress(attempts, today=TODAY).topics
    assert topic.smoothed_accuracy == pytest.approx(2 / 7)
    assert topic.is_weak is True


def test_two_right_and_one_wrong_is_not_weak() -> None:
    attempts = [
        attempt(1, "ex_1", 1.0),
        attempt(2, "ex_2", 1.0),
        attempt(3, "ex_3", 0.0),
    ]
    (topic,) = derive_progress(attempts, today=TODAY).topics
    assert topic.smoothed_accuracy == pytest.approx(4 / 7)
    assert topic.is_weak is False


def test_two_wrong_answers_are_not_enough_evidence() -> None:
    attempts = [attempt(1, "ex_1", 0.0), attempt(2, "ex_2", 0.0)]
    (topic,) = derive_progress(attempts, today=TODAY).topics
    assert topic.smoothed_accuracy < 0.5
    assert topic.is_weak is False


def test_old_mistakes_decay_with_a_21_day_half_life() -> None:
    old = [attempt(i, f"ex_{i}", 0.0, days_ago=21) for i in range(1, 4)]
    (topic,) = derive_progress(old, today=TODAY).topics
    # Three wrong answers aged one half-life weigh 1.5 in total, below the minimum of 3.
    assert topic.effective_n == pytest.approx(1.5)
    assert topic.is_weak is False


def test_weak_topics_are_ranked_lowest_first() -> None:
    attempts = [
        attempt(1, "ex_1", 0.0, topics=(TopicWeight("grammar.a", 1.0),)),
        attempt(2, "ex_2", 0.0, topics=(TopicWeight("grammar.a", 1.0),)),
        attempt(3, "ex_3", 0.0, topics=(TopicWeight("grammar.a", 1.0),)),
        attempt(4, "ex_4", 0.0, topics=(TopicWeight("grammar.b", 1.0),)),
        attempt(5, "ex_5", 0.0, topics=(TopicWeight("grammar.b", 1.0),)),
        attempt(6, "ex_6", 0.0, topics=(TopicWeight("grammar.b", 1.0),)),
        attempt(7, "ex_7", 0.0, topics=(TopicWeight("grammar.b", 1.0),)),
        attempt(8, "ex_8", 1.0, topics=(TopicWeight("grammar.b", 1.0),)),
    ]
    weak = derive_progress(attempts, today=TODAY).weak_topics
    # grammar.a: 2/7 (about 0.29). grammar.b: 3/9 (about 0.33). Lowest first.
    assert [topic.topic for topic in weak] == ["grammar.a", "grammar.b"]
    assert all(topic.smoothed_accuracy < 0.5 for topic in weak)


def test_future_answers_are_rejected() -> None:
    future = AttemptRecord(
        sequence=1,
        exercise_id="ex_a",
        answered_on=TODAY + timedelta(days=1),
        points=1,
        credit=1.0,
        topics=SPELLING,
    )
    with pytest.raises(ValueError):
        derive_progress([future], today=TODAY)


def test_first_answer_is_chosen_by_sequence_not_input_order() -> None:
    later = attempt(5, "ex_a", 1.0)
    earlier = attempt(2, "ex_a", 0.0)
    assert first_scored_answers([later, earlier])["ex_a"] is earlier


@given(
    st.lists(
        st.tuples(st.sampled_from(["ex_a", "ex_b", "ex_c"]), st.floats(0, 1)),
        min_size=1,
        max_size=12,
    )
)
def test_adding_a_retry_never_changes_accuracy(
    history: list[tuple[str, float]],
) -> None:
    attempts = [
        attempt(i, ex, credit) for i, (ex, credit) in enumerate(history, start=1)
    ]
    before = derive_progress(attempts, today=TODAY)
    retry = attempt(len(attempts) + 1, history[0][0], 0.0)
    after = derive_progress([*attempts, retry], today=TODAY)
    assert before.accuracy == after.accuracy


@given(st.lists(st.floats(0, 1), min_size=1, max_size=10), st.integers(0, 60))
def test_smoothed_accuracy_stays_inside_the_unit_interval(
    credits: list[float], age: int
) -> None:
    attempts = [
        attempt(i, f"ex_{i}", c, days_ago=age) for i, c in enumerate(credits, start=1)
    ]
    for topic in derive_progress(attempts, today=TODAY).topics:
        assert 0.0 < topic.smoothed_accuracy < 1.0
