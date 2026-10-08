"""Command line: `python -m english_quest_api.curriculum validate content/days`."""

import argparse
import sys
from collections.abc import Sequence
from pathlib import Path

from english_quest_api.curriculum.validator import validate_content_dir


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="english_quest_api.curriculum")
    commands = parser.add_subparsers(dest="command", required=True)
    validate = commands.add_parser("validate", help="check every day file")
    validate.add_argument("directory", type=Path)
    args = parser.parse_args(argv)

    report = validate_content_dir(args.directory)
    for issue in report.issues:
        print(issue, file=sys.stderr)
    if not report.ok:
        print(f"{len(report.issues)} issue(s) found", file=sys.stderr)
        return 1
    days = ", ".join(str(loaded.day.day) for loaded in report.days)
    print(f"ok: {len(report.days)} day file(s) valid (days {days})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
