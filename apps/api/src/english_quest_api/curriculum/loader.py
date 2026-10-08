"""Load one curriculum day file and compute its content hash."""

import hashlib
import json
import re
from collections.abc import Hashable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError
from pydantic_core import ErrorDetails

from english_quest_api.curriculum.models import Day

DAY_FILE_PATTERN = re.compile(r"^day-(\d{2})\.yaml$")
MERGE_TAG = "tag:yaml.org,2002:merge"


class _UniqueKeyLoader(yaml.SafeLoader):
    """Safe YAML loader that rejects a mapping key written twice.

    PyYAML keeps the last value silently, which could change an answer key.
    Merge keys (`<<`) are rejected too, because a merged value can be silently
    overridden by an explicit key.
    """

    def construct_mapping(self, node: yaml.MappingNode, deep: bool = False) -> dict[Hashable, Any]:
        if isinstance(node, yaml.MappingNode):
            seen: set[Hashable] = set()
            for key_node, _ in node.value:
                if key_node.tag == MERGE_TAG:
                    raise yaml.constructor.ConstructorError(
                        "while constructing a mapping",
                        node.start_mark,
                        "merge keys (<<) are not supported",
                        key_node.start_mark,
                    )
                key = self.construct_object(key_node, deep=deep)
                if isinstance(key, Hashable):
                    if key in seen:
                        raise yaml.constructor.ConstructorError(
                            "while constructing a mapping",
                            node.start_mark,
                            f"found duplicate key {key!r}",
                            key_node.start_mark,
                        )
                    seen.add(key)
        return super().construct_mapping(node, deep=deep)


@dataclass(frozen=True)
class ContentIssue:
    """One problem found in a day file. `location` is a dotted path, or empty."""

    path: str
    location: str
    message: str

    def __str__(self) -> str:
        where = f"{self.path}: {self.location}" if self.location else self.path
        return f"{where}: {self.message}"


@dataclass(frozen=True)
class LoadedDay:
    path: Path
    day: Day
    content_hash: str


def content_hash(day: Day) -> str:
    """SHA-256 over the canonical JSON of the day.

    Key order and YAML formatting do not change the hash. Any change to the
    learner-visible content does.
    """
    canonical = json.dumps(
        day.model_dump(mode="json"),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _location(error: ErrorDetails) -> str:
    return ".".join(str(part) for part in error["loc"])


def load_day_file(path: Path) -> tuple[LoadedDay | None, list[ContentIssue]]:
    """Parse and validate one `day-NN.yaml` file.

    Returns the loaded day when there are no issues, otherwise `None` and the
    list of issues. Never raises for bad content.
    """
    name = path.name
    match = DAY_FILE_PATTERN.match(name)
    if match is None:
        return None, [ContentIssue(name, "", "file name must be day-NN.yaml")]
    file_day = int(match.group(1))

    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as error:
        return None, [ContentIssue(name, "", f"cannot read file: {error}")]

    try:
        raw = yaml.load(text, Loader=_UniqueKeyLoader)
    except (yaml.YAMLError, ValueError) as error:
        return None, [ContentIssue(name, "", f"invalid YAML: {error}")]
    if not isinstance(raw, dict):
        return None, [ContentIssue(name, "", "top level must be a mapping")]

    try:
        day = Day.model_validate(raw)
    except ValidationError as error:
        issues = [ContentIssue(name, _location(item), item["msg"]) for item in error.errors()]
        return None, issues

    if day.day != file_day:
        message = f"day {day.day} does not match file name day-{file_day:02d}.yaml"
        return None, [ContentIssue(name, "day", message)]

    # The schema normally rejects a lone surrogate before this point, so this guard is defensive.
    try:
        digest = content_hash(day)
    except UnicodeEncodeError as error:
        return None, [ContentIssue(name, "", f"content is not valid Unicode: {error}")]

    return LoadedDay(path=path, day=day, content_hash=digest), []
