"""Derived accuracy and topic mastery from the attempt list.

Attempts are the only source of truth. This module takes them as input and
returns the derived view; nothing is stored here. Pure module: "today" is an
argument, never read from the clock.

Rules (report section 8, PRD section 6):
- Only the first-ever answer to each exercise counts, right or wrong.
- Practice answers (daily and mixed review) never change accuracy or mastery.
- Topic mastery decays each observation by a 21-day half-life, then applies a
  Beta(2, 2) prior. A topic is weak when its decayed weight is at least 3 and
  its smoothed accuracy is below 0.5.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date
from typing import Final

# Provisional: the weak-topic values below await tuning on real learner data.
HALF_LIFE_DAYS: Final = 21.0
PRIOR_RIGHT: Final = 2.0
PRIOR_WRONG: Final = 2.0
MIN_EVIDENCE: Final = 3.0
WEAK_THRESHOLD: Final = 0.5


@dataclass(frozen=True, slots=True)
class TopicWeight:
    topic: str
    weight: float

    def __post_init__(self) -> None:
        if not self.weight > 0:
            raise ValueError(f"topic weight must be positive: {self.topic}")


@dataclass(frozen=True, slots=True)
class AttemptRecord:
    """One stored attempt, reduced to what derivation needs.

    ``sequence`` is the append-only order of the attempt store and decides which
    answer was first. ``answered_on`` is the learner's local calendar date.
    """

    sequence: int
    exercise_id: str
    answered_on: date
    points: int
    credit: float
    topics: tuple[TopicWeight, ...] = ()
    counts_toward_accuracy: bool = True
    is_practice: bool = False


@dataclass(frozen=True, slots=True)
class TopicMastery:
    topic: str
    raw_accuracy: float
    smoothed_accuracy: float
    effective_n: float
    is_weak: bool


@dataclass(frozen=True, slots=True)
class ProgressSummary:
    accuracy: float | None
    scored_items: int
    topics: tuple[TopicMastery, ...]

    @property
    def weak_topics(self) -> tuple[TopicMastery, ...]:
        """Weak topics, lowest smoothed accuracy first."""
        return tuple(topic for topic in self.topics if topic.is_weak)


def first_scored_answers(attempts: Iterable[AttemptRecord]) -> dict[str, AttemptRecord]:
    """Return the earliest attempt for each exercise."""
    first: dict[str, AttemptRecord] = {}
    for attempt in sorted(attempts, key=lambda record: record.sequence):
        first.setdefault(attempt.exercise_id, attempt)
    return first


def derive_progress(
    attempts: Iterable[AttemptRecord], *, today: date
) -> ProgressSummary:
    counted: list[tuple[AttemptRecord, float]] = []
    for attempt in first_scored_answers(attempts).values():
        if attempt.is_practice or not attempt.counts_toward_accuracy:
            continue
        counted.append((attempt, attempt.credit))

    points_total = sum(attempt.points for attempt, _ in counted)
    accuracy = (
        sum(attempt.points * credit for attempt, credit in counted) / points_total
        if points_total
        else None
    )

    topics = sorted(
        _topic_mastery(counted, today),
        key=lambda topic: (topic.smoothed_accuracy, topic.topic),
    )
    return ProgressSummary(
        accuracy=accuracy, scored_items=len(counted), topics=tuple(topics)
    )


def _topic_mastery(
    counted: list[tuple[AttemptRecord, float]], today: date
) -> list[TopicMastery]:
    decayed_correct: dict[str, float] = {}
    decayed_total: dict[str, float] = {}
    raw_correct: dict[str, float] = {}
    raw_total: dict[str, float] = {}

    for attempt, credit in counted:
        age_days = (today - attempt.answered_on).days
        if age_days < 0:
            raise ValueError("answered_on cannot be after today")
        decay = 0.5 ** (age_days / HALF_LIFE_DAYS)
        for topic_weight in attempt.topics:
            topic = topic_weight.topic
            weight = topic_weight.weight
            decayed_correct[topic] = (
                decayed_correct.get(topic, 0.0) + decay * weight * credit
            )
            decayed_total[topic] = decayed_total.get(topic, 0.0) + decay * weight
            raw_correct[topic] = raw_correct.get(topic, 0.0) + weight * credit
            raw_total[topic] = raw_total.get(topic, 0.0) + weight

    result: list[TopicMastery] = []
    for topic in sorted(decayed_total):
        n = decayed_total[topic]
        smoothed = (decayed_correct[topic] + PRIOR_RIGHT) / (
            n + PRIOR_RIGHT + PRIOR_WRONG
        )
        result.append(
            TopicMastery(
                topic=topic,
                raw_accuracy=raw_correct[topic] / raw_total[topic],
                smoothed_accuracy=smoothed,
                effective_n=n,
                is_weak=n >= MIN_EVIDENCE and smoothed < WEAK_THRESHOLD,
            )
        )
    return result
