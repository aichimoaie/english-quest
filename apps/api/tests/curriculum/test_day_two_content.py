"""The real Day 2 content must pass every rule and cover the Day 2 exercise types."""

from pathlib import Path

from english_quest_api.curriculum import LearningArea, validate_content_dir
from english_quest_api.curriculum.models import Day

CONTENT_DAYS = Path(__file__).resolve().parents[4] / "content" / "days"

SCORED_TYPES_IN_DAY_TWO = {
    "multiple_choice",
    "fill_blank",
    "vocabulary_matching",
    "spelling_correction",
    "sentence_ordering",
    "listening_comprehension",
}


def _day_two() -> Day:
    report = validate_content_dir(CONTENT_DAYS)
    assert report.issues == ()
    return next(loaded.day for loaded in report.days if loaded.day.day == 2)


def test_day_two_loads_with_its_title() -> None:
    assert _day_two().title == "Possessives: my, your, his, her"


def test_day_two_has_about_six_exercises_covering_the_day_one_types() -> None:
    day = _day_two()
    types = {exercise.type for exercise in day.exercises}

    assert 6 <= len(day.exercises) <= 8
    assert types == SCORED_TYPES_IN_DAY_TWO


def test_every_day_two_exercise_is_original_and_explained() -> None:
    for exercise in _day_two().exercises:
        assert exercise.origin == "original", exercise.id
        assert exercise.explanation.strip(), exercise.id


def test_day_two_ids_use_the_day_prefix() -> None:
    day = _day_two()

    assert all(exercise.id.startswith("d02-") for exercise in day.exercises)
    assert all(lesson.id.startswith("d02-") for lesson in day.lessons)


def test_day_two_teaches_the_four_possessive_words() -> None:
    text = (CONTENT_DAYS / "day-02.yaml").read_text(encoding="utf-8")
    lesson_text = text.split("vocabulary:", 1)[0].lower()

    for word in ("my", "your", "his", "her"):
        assert f" {word} " in lesson_text, word


def test_day_two_covers_the_learning_areas_it_teaches() -> None:
    covered = {exercise.learning_area for exercise in _day_two().exercises}

    assert covered == {
        LearningArea.GRAMMAR,
        LearningArea.VOCABULARY,
        LearningArea.LISTENING,
        LearningArea.SENTENCE_CONSTRUCTION,
        LearningArea.SPELLING,
    }
