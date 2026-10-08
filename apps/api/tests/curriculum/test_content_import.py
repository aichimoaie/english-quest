"""Import is idempotent: the same content hash is written once."""

from pathlib import Path
from typing import Any

from english_quest_api.curriculum import content_hash, import_days, load_day_file
from english_quest_api.curriculum.loader import LoadedDay

Data = dict[str, Any]


class FakeStore:
    """In-memory stand-in for the database binding of ContentStore."""

    def __init__(self) -> None:
        self.revisions: dict[str, tuple[int, dict[str, Any]]] = {}
        self.save_calls = 0

    def revision_exists(self, content_hash: str) -> bool:
        return content_hash in self.revisions

    def save_revision(
        self, day_number: int, content_hash: str, payload: dict[str, Any]
    ) -> None:
        self.save_calls += 1
        self.revisions[content_hash] = (day_number, payload)


def _load(path: Path) -> LoadedDay:
    loaded, issues = load_day_file(path)
    assert issues == []
    assert loaded is not None
    return loaded


def test_first_import_writes_day_one(day_one_data: Data, write_day: Any) -> None:
    loaded = _load(write_day(day_one_data))
    store = FakeStore()

    result = import_days([loaded], store)

    assert result.inserted == (1,)
    assert result.unchanged == ()
    assert store.save_calls == 1


def test_second_import_of_same_content_writes_nothing(
    day_one_data: Data, write_day: Any
) -> None:
    loaded = _load(write_day(day_one_data))
    store = FakeStore()
    import_days([loaded], store)

    result = import_days([loaded], store)

    assert result.inserted == ()
    assert result.unchanged == (1,)
    assert store.save_calls == 1
    assert len(store.revisions) == 1


def test_changed_content_is_a_new_revision(day_one_data: Data, write_day: Any) -> None:
    store = FakeStore()
    import_days([_load(write_day(day_one_data))], store)

    day_one_data["lessons"][0]["cards"][0]["body"] = "A reworded explanation."
    result = import_days([_load(write_day(day_one_data))], store)

    assert result.inserted == (1,)
    assert len(store.revisions) == 2


def test_hash_ignores_key_order(day_one_data: Data, write_day: Any) -> None:
    original = _load(write_day(day_one_data))
    reordered = dict(reversed(list(day_one_data.items())))
    reordered_loaded = _load(write_day(reordered))

    assert original.content_hash == reordered_loaded.content_hash


def test_hash_changes_with_learner_visible_content(
    day_one_data: Data, write_day: Any
) -> None:
    before = _load(write_day(day_one_data)).content_hash

    day_one_data["exercises"][0]["choices"] = ["Am", "Is", "Are", "Be"]
    after = _load(write_day(day_one_data)).content_hash

    assert before != after


def test_loaded_hash_matches_the_day_model(day_one_data: Data, write_day: Any) -> None:
    loaded = _load(write_day(day_one_data))

    assert loaded.content_hash == content_hash(loaded.day)


def test_day_one_file_imports_into_an_empty_store() -> None:
    day_file = Path(__file__).resolve().parents[4] / "content" / "days" / "day-01.yaml"
    loaded = _load(day_file)
    store = FakeStore()

    result = import_days([loaded], store)

    assert result.inserted == (1,)
    assert store.revisions[loaded.content_hash][0] == 1
