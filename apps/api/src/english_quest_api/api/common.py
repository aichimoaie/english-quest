from typing import NoReturn

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    """Base for every DTO: Python snake_case fields, camelCase JSON, as in the API sketch."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


def not_implemented(feature: str) -> NoReturn:
    """Placeholder for routes whose service lands in another workstream."""
    raise NotImplementedError(f"{feature} is not implemented yet.")
