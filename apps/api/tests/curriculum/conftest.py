"""Shared fixtures for curriculum tests.

Broken fixtures are made from the prototype Day 1 file in fixtures/: each test
loads it, breaks one thing, and writes the result to a temporary content
directory. The file is kept as a test fixture so the rule tests keep covering
every exercise kind, which the book's Day 1 does not use.
"""

from collections.abc import Callable
from copy import deepcopy
from pathlib import Path
from typing import Any

import pytest
import yaml

REPO_ROOT = Path(__file__).resolve().parents[4]
CONTENT_DAYS = REPO_ROOT / "content" / "days"
DAY_ONE_FILE = Path(__file__).resolve().parent / "fixtures" / "prototype_day_01.yaml"

WriteDay = Callable[..., Path]


@pytest.fixture
def day_one_data() -> dict[str, Any]:
    raw = yaml.safe_load(DAY_ONE_FILE.read_text(encoding="utf-8"))
    assert isinstance(raw, dict)
    return deepcopy(raw)


@pytest.fixture
def content_dir(tmp_path: Path) -> Path:
    directory = tmp_path / "days"
    directory.mkdir()
    return directory


@pytest.fixture
def write_day(content_dir: Path) -> WriteDay:
    """Write `data` as YAML into the temporary content directory."""

    def write(data: Any, name: str = "day-01.yaml") -> Path:
        path = content_dir / name
        path.write_text(
            yaml.safe_dump(data, sort_keys=False, allow_unicode=True),
            encoding="utf-8",
        )
        return path

    return write
