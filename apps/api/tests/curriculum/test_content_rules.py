"""Deliberately broken day files must be rejected with a clear message."""

import re
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest

from english_quest_api.curriculum import ContentIssue, validate_content_dir

Data = dict[str, Any]
Mutation = Callable[[Data], None]

# Index of each exercise in the DAY_ONE_DATA fixture in conftest.py.
MULTIPLE_CHOICE = 0
FILL_BLANK = 1
LISTENING = 3
SELF_RATING = 5
MATCHING = 6
ORDERING = 7
SPELLING = 8


def _exercise(data: Data, index: int) -> Data:
    exercise: Data = data["exercises"][index]
    return exercise


def _messages(issues: tuple[ContentIssue, ...]) -> str:
    return "\n".join(str(issue) for issue in issues)


def _set(index: int, key: str, value: Any) -> Mutation:
    def mutate(data: Data) -> None:
        _exercise(data, index)[key] = value

    return mutate


def _del(index: int, key: str) -> Mutation:
    def mutate(data: Data) -> None:
        del _exercise(data, index)[key]

    return mutate


def _duplicate_exercise_id(data: Data) -> None:
    data["exercises"][FILL_BLANK]["id"] = data["exercises"][MULTIPLE_CHOICE]["id"]


def _vocabulary_del(index: int, key: str) -> Mutation:
    def mutate(data: Data) -> None:
        del data["vocabulary"][index][key]

    return mutate


def _set_day(day: int) -> Mutation:
    def mutate(data: Data) -> None:
        data["day"] = day

    return mutate


RULE_CASES = [
    pytest.param(
        _set(MULTIPLE_CHOICE, "answer", "Be"),
        "answer must be one of the choices",
        id="answer-not-in-choices",
    ),
    pytest.param(
        _set(MULTIPLE_CHOICE, "choices", ["Are", "Are", "Is"]),
        "choices must be unique",
        id="duplicate-choices",
    ),
    pytest.param(
        _set(MULTIPLE_CHOICE, "choices", ["Are", " are ", "Is"]),
        "choices must be unique",
        id="duplicate-choices-ignoring-case-and-spaces",
    ),
    pytest.param(
        _set(MULTIPLE_CHOICE, "choices", ["Am", "Is", "Are", "Be", "Was"]),
        "List should have at most 4 items",
        id="too-many-choices",
    ),
    pytest.param(
        _del(MULTIPLE_CHOICE, "answer"),
        "Field required",
        id="missing-answer",
    ),
    pytest.param(
        _set(FILL_BLANK, "accepted", []),
        "List should have at least 1 item",
        id="fill-blank-empty-accepted-set",
    ),
    pytest.param(
        _set(LISTENING, "audio_text", ""),
        "String should have at least 1 character",
        id="listening-empty-audio",
    ),
    pytest.param(
        _set(MATCHING, "pairs", [{"word": "brother", "meaning": "a man in your family"}]),
        "List should have at least 2 items",
        id="matching-too-few-pairs",
    ),
    pytest.param(
        _set(ORDERING, "answer", ["My", "brother", "is", "a"]),
        "answer must use every token exactly once",
        id="ordering-token-dropped",
    ),
    pytest.param(
        _set(ORDERING, "answer", ["My", "brother", "is", "a", "doctor.", "doctor."]),
        "answer must use every token exactly once",
        id="ordering-token-repeated",
    ),
    pytest.param(
        _set(SPELLING, "accepted", []),
        "List should have at least 1 item",
        id="spelling-empty-accepted-set",
    ),
    pytest.param(
        _set(SELF_RATING, "points", 1),
        "Extra inputs are not permitted",
        id="self-rating-carries-no-points",
    ),
    pytest.param(
        _set(SELF_RATING, "answer", "I have a sheep."),
        "Extra inputs are not permitted",
        id="self-rating-has-no-answer",
    ),
    pytest.param(
        _set(SPELLING, "near_miss_credit", 0.5),
        "Extra inputs are not permitted",
        id="spelling-partial-credit-rejected",
    ),
    pytest.param(
        _set(0, "learning_area", "Speaking"),
        "Input should be 'Pronunciation'",
        id="unknown-learning-area",
    ),
    pytest.param(
        _set(0, "origin", "adapted"),
        "Input should be 'original'",
        id="origin-not-original",
    ),
    pytest.param(
        _del(0, "explanation"),
        "Field required",
        id="missing-explanation",
    ),
    pytest.param(
        _del(0, "difficulty"),
        "Field required",
        id="missing-difficulty",
    ),
    pytest.param(
        _set(0, "points", 0),
        "Input should be greater than or equal to 1",
        id="zero-points",
    ),
    pytest.param(
        _set(0, "topics", ["Grammar"]),
        "String should match pattern",
        id="topic-not-dotted",
    ),
    pytest.param(
        _set(0, "hint", "Think about the subject."),
        "Extra inputs are not permitted",
        id="unknown-field",
    ),
    pytest.param(
        _duplicate_exercise_id,
        "lesson and exercise ids must be unique",
        id="duplicate-exercise-id",
    ),
    pytest.param(
        _vocabulary_del(0, "audio_ref"),
        "Field required",
        id="vocabulary-without-audio-reference",
    ),
    pytest.param(
        _set_day(31),
        "Input should be less than or equal to 30",
        id="day-above-thirty",
    ),
    pytest.param(
        _set_day(0),
        "Input should be greater than or equal to 1",
        id="day-below-one",
    ),
]


@pytest.mark.parametrize(("mutate", "expected"), RULE_CASES)
def test_broken_day_is_rejected(
    day_one_data: Data,
    write_day: Callable[..., Path],
    mutate: Mutation,
    expected: str,
) -> None:
    mutate(day_one_data)
    report = validate_content_dir(write_day(day_one_data).parent)

    assert not report.ok
    assert expected in _messages(report.issues)


def test_issue_points_at_the_exercise(day_one_data: Data, write_day: Callable[..., Path]) -> None:
    _set(MULTIPLE_CHOICE, "answer", "Be")(day_one_data)
    report = validate_content_dir(write_day(day_one_data).parent)

    assert len(report.issues) == 1
    assert report.issues[0].path == "day-01.yaml"
    assert report.issues[0].location.startswith("exercises.0")


def test_every_problem_in_one_run_is_reported(
    day_one_data: Data, write_day: Callable[..., Path]
) -> None:
    _set(MULTIPLE_CHOICE, "answer", "Be")(day_one_data)
    _set(FILL_BLANK, "accepted", [])(day_one_data)
    report = validate_content_dir(write_day(day_one_data).parent)

    assert len(report.issues) >= 2
    assert "answer must be one of the choices" in _messages(report.issues)
    assert "List should have at least 1 item" in _messages(report.issues)


def test_file_name_must_match_day_number(
    day_one_data: Data, write_day: Callable[..., Path]
) -> None:
    report = validate_content_dir(write_day(day_one_data, name="day-02.yaml").parent)

    assert "does not match file name day-02.yaml" in _messages(report.issues)


def test_file_name_must_follow_the_pattern(
    day_one_data: Data, write_day: Callable[..., Path]
) -> None:
    report = validate_content_dir(write_day(day_one_data, name="lesson.yaml").parent)

    assert "file name must be day-NN.yaml" in _messages(report.issues)


def test_invalid_yaml_is_reported_not_raised(content_dir: Path) -> None:
    (content_dir / "day-01.yaml").write_text("day: [1, 2\n", encoding="utf-8")
    report = validate_content_dir(content_dir)

    assert "invalid YAML" in _messages(report.issues)


def test_impossible_date_is_reported_not_raised(content_dir: Path) -> None:
    (content_dir / "day-01.yaml").write_text("day: 1\ntitle: 2026-02-30\n", encoding="utf-8")
    report = validate_content_dir(content_dir)

    assert not report.ok
    assert "invalid YAML" in _messages(report.issues)


def test_merge_key_is_rejected_not_applied(content_dir: Path) -> None:
    (content_dir / "day-01.yaml").write_text(
        "day: 1\ntitle: Greetings\n<<: {day: 2}\n", encoding="utf-8"
    )
    report = validate_content_dir(content_dir)

    assert not report.ok
    assert "merge keys (<<) are not supported" in _messages(report.issues)


def test_top_level_must_be_a_mapping(content_dir: Path) -> None:
    (content_dir / "day-01.yaml").write_text("- one\n- two\n", encoding="utf-8")
    report = validate_content_dir(content_dir)

    assert "top level must be a mapping" in _messages(report.issues)


def test_empty_directory_is_reported(content_dir: Path) -> None:
    report = validate_content_dir(content_dir)

    assert "no day files found" in _messages(report.issues)


def test_non_utf8_file_is_reported_not_raised(content_dir: Path) -> None:
    (content_dir / "day-01.yaml").write_bytes("day: 1\ntitle: “Greetings”\n".encode("cp1252"))
    report = validate_content_dir(content_dir)

    assert not report.ok
    assert "cannot read file" in _messages(report.issues)


def test_unreadable_entry_is_reported_not_raised(content_dir: Path) -> None:
    (content_dir / "day-01.yaml").mkdir()
    report = validate_content_dir(content_dir)

    assert not report.ok
    assert "cannot read file" in _messages(report.issues)


def test_yml_extension_is_reported_not_skipped(
    day_one_data: Data, write_day: Callable[..., Path]
) -> None:
    _set(MULTIPLE_CHOICE, "answer", "Be")(day_one_data)
    report = validate_content_dir(write_day(day_one_data, name="day-01.yml").parent)

    assert not report.ok
    assert "file name must be day-NN.yaml" in _messages(report.issues)


def test_duplicate_key_is_rejected_not_overridden(
    day_one_data: Data, write_day: Callable[..., Path]
) -> None:
    path = write_day(day_one_data)
    text = path.read_text(encoding="utf-8")
    duplicated, count = re.subn(
        r"^(\s*)answer: Are\n",
        r"\1answer: Are\n\1answer: Is\n",
        text,
        count=1,
        flags=re.MULTILINE,
    )
    assert count == 1
    path.write_text(duplicated, encoding="utf-8")
    report = validate_content_dir(path.parent)

    assert not report.ok
    assert "duplicate key" in _messages(report.issues)
