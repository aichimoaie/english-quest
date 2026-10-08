"""The real Day 1 content must pass every rule."""

from pathlib import Path

from english_quest_api.curriculum import LearningArea, validate_content_dir
from english_quest_api.curriculum.models import Day

CONTENT_DAYS = Path(__file__).resolve().parents[4] / "content" / "days"

SEVEN_EXERCISE_TYPES = {
    "multiple_choice",
    "fill_blank",
    "vocabulary_matching",
    "spelling_correction",
    "sentence_ordering",
    "listening_comprehension",
    "pronunciation_practice",
}


def test_day_one_passes_validation() -> None:
    report = validate_content_dir(CONTENT_DAYS)

    assert report.issues == ()
    assert [loaded.day.day for loaded in report.days] == [1]


def test_day_one_uses_the_seven_prototype_exercise_types_and_self_rating() -> None:
    report = validate_content_dir(CONTENT_DAYS)
    day = report.days[0].day

    assert {exercise.type for exercise in day.exercises} == SEVEN_EXERCISE_TYPES | {
        "pronunciation_self_rating"
    }


def test_self_rating_item_validates_and_is_unscored() -> None:
    report = validate_content_dir(CONTENT_DAYS)
    day = report.days[0].day
    self_ratings = [e for e in day.exercises if e.type == "pronunciation_self_rating"]

    assert report.issues == ()
    assert len(self_ratings) == 1
    assert "points" not in self_ratings[0].model_dump(mode="json")


def test_every_day_one_exercise_is_original_and_explained() -> None:
    report = validate_content_dir(CONTENT_DAYS)
    day = report.days[0].day

    for exercise in day.exercises:
        assert exercise.origin == "original", exercise.id
        assert exercise.explanation.strip(), exercise.id


def test_day_one_covers_the_learning_areas_it_teaches() -> None:
    report = validate_content_dir(CONTENT_DAYS)
    day: Day = report.days[0].day
    covered = {exercise.learning_area for exercise in day.exercises}

    assert covered == {
        LearningArea.GRAMMAR,
        LearningArea.VOCABULARY,
        LearningArea.LISTENING,
        LearningArea.PRONUNCIATION,
        LearningArea.SENTENCE_CONSTRUCTION,
        LearningArea.SPELLING,
    }
