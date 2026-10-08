"""A minimal app whose responses match its declared schema. The contract harness must pass on it."""

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Health(BaseModel):
    status: str


@app.get("/api/v1/health", response_model=Health)
def health() -> Health:
    return Health(status="ok")


@app.get("/api/v1/items/{item_id}", response_model=Health)
def item(item_id: int) -> Health:
    return Health(status="ok" if item_id >= 0 else "negative")
