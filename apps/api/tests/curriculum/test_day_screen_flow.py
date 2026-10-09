"""Days 1 to 5 and 11 to 14 must run in the approved screen order, with each test's intro and items in place.

The expected screens below are the owner's confirmed model: a text screen for each day intro or
reading text, and a test screen for each test. A test screen's results screen is implied, so the
order here is what the learner sees, from the first Start button to the day end.
"""

from pathlib import Path

import pytest

from english_quest_api.curriculum import models, validate_content_dir
from english_quest_api.curriculum.models import Day

CONTENT_DAYS = Path(__file__).resolve().parents[4] / "content" / "days"

# (kind, screen id) in the order the learner meets them.
APPROVED_FLOW: dict[int, list[tuple[str, str]]] = {
    1: [
        ("text", "d01-screen-part-one"),
        ("text", "d01-screen-first-day"),
        ("test", "d01-test-1"),
        ("test", "d01-test-2"),
        ("test", "d01-test-3"),
        ("test", "d01-test-4"),
    ],
    2: [
        ("text", "d02-screen-introduction"),
        ("text", "d02-screen-three-tests"),
        ("test", "d02-test-5"),
        ("test", "d02-test-6"),
        ("test", "d02-test-7"),
    ],
    3: [
        ("text", "d03-screen-introduction"),
        ("test", "d03-test-8"),
        ("test", "d03-test-9"),
    ],
    4: [
        ("text", "d04-screen-introduction"),
        ("test", "d04-test-10"),
        ("test", "d04-test-11"),
    ],
    5: [
        ("text", "d05-screen-introduction"),
        ("test", "d05-test-fluency"),
        ("text", "d05-screen-name-behind-word"),
        ("text", "d05-screen-did-you-know"),
        ("test", "d05-test-think-of-words"),
    ],
    11: [
        ("text", "d11-screen-introduction"),
        ("text", "d11-screen-another-way-of-saying-foot"),
        ("test", "d11-test-first-set"),
        ("text", "d11-screen-another-kind-of-ped"),
        ("text", "d11-screen-new-roots"),
        ("test", "d11-test-second-set"),
        ("text", "d11-screen-few-roots"),
        ("text", "d11-screen-tie-it-up"),
    ],
    12: [
        ("text", "d12-screen-introduction"),
        ("text", "d12-screen-livid"),
        ("text", "d12-screen-fervid"),
        ("text", "d12-screen-rabid"),
        ("text", "d12-screen-pallid"),
        ("text", "d12-screen-lucid"),
        ("text", "d12-screen-morbid"),
        ("text", "d12-screen-sordid"),
        ("text", "d12-screen-candid"),
        ("text", "d12-screen-vivid"),
        ("text", "d12-screen-lurid"),
        ("test", "d12-test-complete-words"),
    ],
    13: [
        ("text", "d13-screen-introduction"),
        ("test", "d13-test-people"),
        ("test", "d13-test-sciences"),
        ("test", "d13-test-abnormal-states"),
        ("test", "d13-test-actions"),
        ("test", "d13-test-comparisons"),
        ("text", "d13-screen-test-your-learning"),
        ("test", "d13-test-learning"),
    ],
    14: [
        ("text", "d14-screen-introduction"),
        ("text", "d14-screen-misplaced-months"),
        ("test", "d14-test-whats-wrong"),
        ("text", "d14-screen-how-good"),
        ("test", "d14-test-average"),
        ("test", "d14-test-good"),
        ("test", "d14-test-excellent"),
        ("test", "d14-test-superior"),
    ],
}


EXPLAINED_TESTS = {
    "d03-test-8",
    "d03-test-9",
    "d04-test-10",
    "d04-test-11",
    "d05-test-fluency",
    "d05-test-think-of-words",
    "d14-test-whats-wrong",
}


def _days() -> dict[int, Day]:
    report = validate_content_dir(CONTENT_DAYS)
    assert report.issues == ()
    return {loaded.day.day: loaded.day for loaded in report.days}


@pytest.mark.parametrize("number", sorted(APPROVED_FLOW))
def test_day_screens_run_in_the_approved_order(number: int) -> None:
    day = _days()[number]

    flow = [(screen.kind, screen.id) for screen in day.screens]

    assert flow == APPROVED_FLOW[number]


@pytest.mark.parametrize("number", sorted(APPROVED_FLOW))
def test_every_test_has_an_intro_line_and_items(number: int) -> None:
    day = _days()[number]

    for screen in day.screens:
        if isinstance(screen, models.TestScreen):
            assert screen.intro.strip(), screen.id
            assert screen.items, screen.id


@pytest.mark.parametrize("number", sorted(APPROVED_FLOW))
def test_only_the_approved_tests_show_explanations_on_their_results_screen(number: int) -> None:
    day = _days()[number]

    for screen in day.screens:
        if isinstance(screen, models.TestScreen):
            assert screen.explain == (screen.id in EXPLAINED_TESTS), screen.id


def test_day_three_has_no_closing_text_after_its_last_test() -> None:
    day = _days()[3]

    assert isinstance(day.screens[-1], models.TestScreen)
    assert day.screens[-1].id == "d03-test-9"


def test_day_four_test_ten_is_self_check_with_no_score() -> None:
    day = _days()[4]
    test_ten = next(screen for screen in day.screens if screen.id == "d04-test-10")

    assert isinstance(test_ten, models.TestScreen)
    assert [item.type for item in test_ten.items] == ["self_check"] * 10
    assert not any(hasattr(item, "points") for item in test_ten.items)


def test_day_four_test_eleven_is_scored() -> None:
    day = _days()[4]
    test_eleven = next(screen for screen in day.screens if screen.id == "d04-test-11")

    assert isinstance(test_eleven, models.TestScreen)
    assert all(item.type != "self_check" for item in test_eleven.items)


def test_day_five_text_screens_come_between_the_tests() -> None:
    day = _days()[5]
    texts = [screen for screen in day.screens if isinstance(screen, models.TextScreen)]

    assert [screen.title for screen in texts] == [
        "Just for Fun (I)",
        "II. The Name Behind the Word",
        "III. Did You Know That",
    ]
