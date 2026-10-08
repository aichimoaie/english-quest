"""Validate every day file in a content directory (content/days)."""

from dataclasses import dataclass, field
from pathlib import Path

from english_quest_api.curriculum.loader import ContentIssue, LoadedDay, load_day_file


@dataclass(frozen=True)
class ContentReport:
    days: tuple[LoadedDay, ...] = ()
    issues: tuple[ContentIssue, ...] = field(default=())

    @property
    def ok(self) -> bool:
        return not self.issues


def validate_content_dir(directory: Path) -> ContentReport:
    """Load every entry in `directory` as a day file and collect all issues.

    Every entry is checked, so a misnamed file such as `day-02.yml` is reported
    rather than skipped. Each day file is checked on its own. Ids are prefixed
    with the day number, so they cannot collide across files. The day number is
    tied to the file name, so two files cannot claim the same day.
    """
    paths = sorted(directory.glob("*"))
    if not paths:
        issue = ContentIssue(str(directory), "", "no day files found")
        return ContentReport(issues=(issue,))

    days: list[LoadedDay] = []
    issues: list[ContentIssue] = []
    for path in paths:
        loaded, file_issues = load_day_file(path)
        issues.extend(file_issues)
        if loaded is not None:
            days.append(loaded)
    return ContentReport(days=tuple(days), issues=tuple(issues))
