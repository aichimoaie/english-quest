"""The real Day 1 content must pass every rule and cover the pronunciation tests."""

from pathlib import Path

from english_quest_api.curriculum import LearningArea, validate_content_dir
from english_quest_api.curriculum.models import Day

CONTENT_DAYS = Path(__file__).resolve().parents[4] / "content" / "days"


def _day_one() -> Day:
    report = validate_content_dir(CONTENT_DAYS)
    assert report.issues == ()
    return next(loaded.day for loaded in report.days if loaded.day.day == 1)


def test_day_one_passes_validation() -> None:
    report = validate_content_dir(CONTENT_DAYS)

    assert report.issues == ()
    assert [loaded.day.day for loaded in report.days] == [1, 2, 3, 4, 5]


def test_day_one_loads_with_its_title() -> None:
    assert _day_one().title == "Test Your Pronunciation"


def test_day_one_uses_multiple_choice_for_the_pronunciation_tests() -> None:
    assert {exercise.type for exercise in _day_one().exercises} == {"multiple_choice"}


def test_every_day_one_exercise_is_original_and_explained() -> None:
    for exercise in _day_one().exercises:
        assert exercise.origin == "original", exercise.id
        assert exercise.explanation.strip(), exercise.id


def test_day_one_ids_use_the_day_prefix() -> None:
    day = _day_one()

    assert all(exercise.id.startswith("d01-") for exercise in day.exercises)
    assert all(lesson.id.startswith("d01-") for lesson in day.lessons)


def test_day_one_covers_the_four_pronunciation_tests() -> None:
    topics = {topic for exercise in _day_one().exercises for topic in exercise.topics}

    assert topics == {
        "pronunciation.common_errors",
        "pronunciation.educated_standard",
        "pronunciation.unknown_words",
        "pronunciation.affected",
    }


def test_day_one_is_all_pronunciation() -> None:
    covered = {exercise.learning_area for exercise in _day_one().exercises}

    assert covered == {LearningArea.PRONUNCIATION}
