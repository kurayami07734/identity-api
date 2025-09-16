from fastapi import Body, Depends, FastAPI
from fastapi.responses import RedirectResponse
from sqlmodel import Session

from src.dependencies import get_session
from src.models import IdentifyRequest


app = FastAPI(title="Identity Reconciliation Task", description="")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
async def health():
    return {"health": "ok"}
