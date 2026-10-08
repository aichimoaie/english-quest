from __future__ import annotations

from api_package import api_package_is_absent


def test_missing_top_level_package_counts_as_absent() -> None:
    assert api_package_is_absent(ModuleNotFoundError("No module named 'english_quest_api'", name="english_quest_api"))


def test_missing_submodule_of_the_api_is_a_broken_import() -> None:
    assert not api_package_is_absent(
        ModuleNotFoundError("No module named 'english_quest_api.routes'", name="english_quest_api.routes")
    )


def test_missing_third_party_dependency_is_a_broken_import() -> None:
    assert not api_package_is_absent(ModuleNotFoundError("No module named 'fastapi'", name="fastapi"))
