"""The grading package must stay free of I/O, clock and randomness."""

import ast
from pathlib import Path

import english_quest_api.grading as grading

FORBIDDEN_MODULES = {
    "os",
    "pathlib",
    "io",
    "socket",
    "subprocess",
    "random",
    "secrets",
    "time",
    "sqlalchemy",
    "fastapi",
    "pydantic",
    "urllib",
    "http",
    "json",
    "english_quest_api.exercises",
    "english_quest_api.db",
}


def _imported_modules(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    names: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.add(node.module)
    return names


CLOCK_READS = ("now(", "today(", "utcnow(", "time(")


def test_grading_modules_never_read_the_clock() -> None:
    package_dir = Path(grading.__file__).parent
    for module in package_dir.glob("*.py"):
        source = module.read_text(encoding="utf-8")
        for read in CLOCK_READS:
            assert read not in source, f"{module.name} calls {read[:-1]}"


def test_grading_modules_import_no_io_clock_or_random_code() -> None:
    package_dir = Path(grading.__file__).parent
    modules = sorted(package_dir.glob("*.py"))
    assert len(modules) >= 8
    for module in modules:
        for name in _imported_modules(module):
            root = name.split(".")[0]
            assert root not in FORBIDDEN_MODULES and name not in FORBIDDEN_MODULES, (
                f"{module.name} imports {name}"
            )
