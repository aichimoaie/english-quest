"""Idempotent import of validated day content, keyed by content hash.

`ContentStore` is a port. The database binding is deferred to the database
integration (workstream 3) and is not part of this module. Importing the same
content twice writes nothing the second time.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any, Protocol

from english_quest_api.curriculum.loader import LoadedDay


class ContentStore(Protocol):
    def revision_exists(self, content_hash: str) -> bool: ...

    def save_revision(
        self, day_number: int, content_hash: str, payload: dict[str, Any]
    ) -> None: ...


@dataclass(frozen=True)
class ImportResult:
    inserted: tuple[int, ...]
    unchanged: tuple[int, ...]


def import_days(days: Iterable[LoadedDay], store: ContentStore) -> ImportResult:
    inserted: list[int] = []
    unchanged: list[int] = []
    for loaded in days:
        day_number = loaded.day.day
        if store.revision_exists(loaded.content_hash):
            unchanged.append(day_number)
            continue
        payload = loaded.day.model_dump(mode="json")
        store.save_revision(day_number, loaded.content_hash, payload)
        inserted.append(day_number)
    return ImportResult(inserted=tuple(inserted), unchanged=tuple(unchanged))
