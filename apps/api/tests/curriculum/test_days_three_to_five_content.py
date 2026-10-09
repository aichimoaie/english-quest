"""Days 3 to 5 must pass every rule and use only the tag vocabulary in content/tags.yaml."""

from pathlib import Path

import yaml

from english_quest_api.curriculum import validate_content_dir
from english_quest_api.curriculum.models import Day

CONTENT = Path(__file__).resolve().parents[4] / "content"
CONTENT_DAYS = CONTENT / "days"
TAGS = yaml.safe_load((CONTENT / "tags.yaml").read_text(encoding="utf-8"))

NEW_DAY_TITLES = {
    3: "Test Your Spelling",
    4: "Test Your Grammar",
    5: "Just for Fun (I)",
}


def _days() -> dict[int, Day]:
    report = validate_content_dir(CONTENT_DAYS)
    assert report.issues == ()
    return {loaded.day.day: loaded.day for loaded in report.days}


def test_days_three_to_five_load_with_their_titles() -> None:
    days = _days()

    assert {number: days[number].title for number in NEW_DAY_TITLES} == NEW_DAY_TITLES


def test_every_exercise_is_tagged_from_the_vocabulary() -> None:
    days = _days()
    topics = {topic for group in TAGS["topics"].values() for topic in group}

    for number in NEW_DAY_TITLES:
        for exercise in days[number].exercises:
            assert exercise.learning_area in TAGS["skills"], exercise.id
            assert exercise.type in TAGS["exercise_types"], exercise.id
            assert exercise.difficulty in TAGS["difficulty"], exercise.id
            assert set(exercise.topics) <= topics, exercise.id


def test_topics_belong_to_the_skill_of_their_exercise() -> None:
    days = _days()

    for number in NEW_DAY_TITLES:
        for exercise in days[number].exercises:
            skill = exercise.learning_area.value
            assert all(topic.split(".")[0] == skill.lower() for topic in exercise.topics), (
                exercise.id
            )


def test_exercise_ids_use_their_day_prefix() -> None:
    days = _days()

    for number in NEW_DAY_TITLES:
        prefix = f"d{number:02d}-"
        assert all(exercise.id.startswith(prefix) for exercise in days[number].exercises)
        assert all(lesson.id.startswith(prefix) for lesson in days[number].lessons)


def test_every_new_day_exercise_is_original_and_explained() -> None:
    days = _days()

    for number in NEW_DAY_TITLES:
        for exercise in days[number].exercises:
            assert exercise.origin == "original", exercise.id
            assert exercise.explanation.strip(), exercise.id
