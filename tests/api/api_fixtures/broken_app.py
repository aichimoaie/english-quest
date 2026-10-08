"""An app that fails on some inputs. The contract harness must report it (negative control)."""

from fastapi import FastAPI

app = FastAPI()


@app.get("/api/v1/items/{item_id}")
def item(item_id: int) -> dict[str, int]:
    if item_id > 1000:
        raise RuntimeError("unhandled server error")
    return {"id": item_id}
