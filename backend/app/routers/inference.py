"""
routers/inference.py
====================
Endpoints to control the inference engine lifecycle and fetch current state.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.inference_service import inference_service
from app.models import InferenceStatus, StartInferenceRequest, ThresholdUpdateRequest

log = logging.getLogger("routers.inference")

router = APIRouter(prefix="/api/inference", tags=["inference"])


@router.post("/start", response_model=InferenceStatus)
async def start_inference(request: StartInferenceRequest) -> InferenceStatus:
    """
    Start the inference streaming loop for the specified dataset.
    The engine will continuously replay the attack CSV, emitting window
    records over the WebSocket at /ws/stream.
    """
    try:
        await inference_service.start(request)
    except RuntimeError as exc:
        raise HTTPException(409, detail=str(exc))
    except Exception as exc:
        log.exception("Failed to start inference: %s", exc)
        raise HTTPException(500, detail=f"Failed to start: {exc}")
    return InferenceStatus(**inference_service.get_state())


@router.post("/stop", response_model=InferenceStatus)
async def stop_inference() -> InferenceStatus:
    """Gracefully stop the inference loop."""
    await inference_service.stop()
    return InferenceStatus(**inference_service.get_state())


@router.get("/status", response_model=InferenceStatus)
async def get_status() -> InferenceStatus:
    """Get the current status and latest record from the inference engine."""
    return InferenceStatus(**inference_service.get_state())


@router.get("/snapshot")
async def get_snapshot() -> dict:
    """Return just the latest inference record (no wrapper)."""
    state = inference_service.get_state()
    rec = state.get("current_record")
    if rec is None:
        raise HTTPException(404, detail="No record available yet.")
    return rec


@router.post("/threshold", response_model=InferenceStatus)
async def update_threshold(request: ThresholdUpdateRequest) -> InferenceStatus:
    """
    Override the operating threshold at runtime.
    The new value takes effect immediately on the next emitted window.
    """
    state = inference_service.get_state()
    if state["status"] not in ("running", "stopped"):
        raise HTTPException(400, detail="Engine must be running to update threshold.")

    # Thread-safe threshold update
    with inference_service._state_lock:
        inference_service._state.threshold = request.threshold

    # Also record in audit log (best-effort, non-blocking)
    return InferenceStatus(**inference_service.get_state())
