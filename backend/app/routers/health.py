"""
routers/health.py
=================
Health-check endpoint — verifies DB, ML source, and inference status.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.inference_service import inference_service
from app.models import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    # DB ping
    db_ok = False
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    # ML source check
    ml_src_ok = Path(settings.ml_src).exists()

    state = inference_service.get_state()

    return HealthResponse(
        status="ok" if db_ok else "degraded",
        inference_status=state["status"],
        dataset=state["dataset"],
        db_ok=db_ok,
        ml_src_ok=ml_src_ok,
    )
