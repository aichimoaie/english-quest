"""The real Day 2 content must pass every rule and cover the vocabulary tests."""

from pathlib import Path

from english_quest_api.curriculum import LearningArea, validate_content_dir
from english_quest_api.curriculum.models import Day

CONTENT_DAYS = Path(__file__).resolve().parents[4] / "content" / "days"

TYPES_IN_DAY_TWO = {"vocabulary_matching", "multiple_choice"}


def _day_two() -> Day:
    report = validate_content_dir(CONTENT_DAYS)
    assert report.issues == ()
    return next(loaded.day for loaded in report.days if loaded.day.day == 2)


def test_day_two_loads_with_its_title() -> None:
    assert _day_two().title == "Test Your Vocabulary"


def test_day_two_uses_matching_and_multiple_choice() -> None:
    day = _day_two()
    types = {exercise.type for exercise in day.exercises}

    assert types == TYPES_IN_DAY_TWO
    assert len(day.exercises) >= 6


def test_every_day_two_exercise_is_original_and_explained() -> None:
    for exercise in _day_two().exercises:
        assert exercise.origin == "original", exercise.id
        assert exercise.explanation.strip(), exercise.id


def test_day_two_ids_use_the_day_prefix() -> None:
    day = _day_two()

    assert all(exercise.id.startswith("d02-") for exercise in day.exercises)
    assert all(screen.id.startswith("d02-") for screen in day.screens)


def test_day_two_teaches_word_meanings_and_opposites() -> None:
    topics = {topic for exercise in _day_two().exercises for topic in exercise.topics}

    assert {"vocabulary.word_meanings", "vocabulary.antonyms", "vocabulary.synonyms"} <= topics


def test_day_two_covers_only_vocabulary() -> None:
    covered = {exercise.learning_area for exercise in _day_two().exercises}

    assert covered == {LearningArea.VOCABULARY}
