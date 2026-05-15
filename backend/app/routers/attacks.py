"""
routers/attacks.py
==================
Endpoints to inject and clear simulated attacks for red-team / sandbox mode.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException

from app.inference_service import inference_service
from app.models import AttackInjectRequest, AttackTypeInfo

router = APIRouter(prefix="/api/attacks", tags=["attacks"])

ATTACK_TYPES = [
    AttackTypeInfo(
        type="freeze",
        description="Hold sensor reading constant (variance collapse). "
                    "Simulates a stuck sensor or replay of a single value.",
        example_magnitude=0.0,
    ),
    AttackTypeInfo(
        type="offset",
        description="Shift sensor reading by a fixed additive bias. "
                    "Simulates calibration tampering or steady state manipulation.",
        example_magnitude=1.5,
    ),
    AttackTypeInfo(
        type="noise",
        description="Inject Gaussian noise N(0, σ) into sensor readings. "
                    "Simulates measurement interference or sensor degradation.",
        example_magnitude=0.5,
    ),
]


@router.get("/types", response_model=List[AttackTypeInfo])
async def get_attack_types() -> List[AttackTypeInfo]:
    """List all available attack types with descriptions."""
    return ATTACK_TYPES


@router.post("/inject")
async def inject_attack(request: AttackInjectRequest) -> dict:
    """
    Inject a simulated attack into the running inference stream.
    The attack takes effect immediately at the next stride boundary.
    """
    state = inference_service.get_state()
    if state["status"] != "running":
        raise HTTPException(
            400,
            detail=f"Cannot inject attack: inference engine is '{state['status']}' (must be 'running')."
        )
    sensor_cols = state.get("sensor_cols") or []
    if sensor_cols and request.sensor not in sensor_cols:
        raise HTTPException(
            422,
            detail=f"Sensor '{request.sensor}' not found. "
                   f"Available sensors: {sensor_cols[:10]}{'...' if len(sensor_cols) > 10 else ''}"
        )

    inference_service.inject_attack(
        sensor=request.sensor,
        attack_type=request.attack_type,
        magnitude=request.magnitude,
        duration_ticks=request.duration_ticks,
    )
    return {
        "status": "injected",
        "sensor": request.sensor,
        "attack_type": request.attack_type,
        "magnitude": request.magnitude,
        "duration_ticks": request.duration_ticks,
    }


@router.delete("/clear")
async def clear_attack() -> dict:
    """Cancel any active attack injection immediately."""
    inference_service.clear_attack()
    return {"status": "cleared"}


@router.get("/status")
async def attack_status() -> dict:
    """Return the current attack injection state."""
    with inference_service._attack_lock:
        state = dict(inference_service._attack_state)
    # Also read from the IPC file to reflect what the engine actually sees
    try:
        from app.config import settings
        import json
        from pathlib import Path
        ipc_path = Path(settings.ml_src) / "runs" / "attack_state.json"
        if ipc_path.exists():
            with open(ipc_path) as f:
                state["ipc_file"] = json.load(f)
    except Exception:
        pass
    return state
