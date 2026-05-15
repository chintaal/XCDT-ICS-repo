"""
main.py
=======
FastAPI application entry-point for the XCDT-ICS Intelligent Infrastructure
Command Center backend.

Key capabilities
----------------
* REST API    — dataset info, inference control, incident CRUD, attack sandbox
* WebSocket   — /ws/stream for real-time anomaly score streaming to dashboards
* SQLite DB   — persistent incident log + operator feedback (via aiosqlite)
* ML engine   — async wrapper around the research inference_engine.py

Run
---
    cd backend
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.inference_service import inference_service
from app.models import Incident
from app.ws_manager import ws_manager

logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("main")


# ---------------------------------------------------------------------------
# Async callbacks wired at startup — records → WS, incidents → DB
# ---------------------------------------------------------------------------

async def _ws_broadcast_cb(record: dict) -> None:
    """Broadcast every inference record to all connected WS clients."""
    await ws_manager.broadcast(record)


async def _incident_save_cb(incident_dict: dict) -> None:
    """Persist a closed incident to SQLite."""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            incident = Incident(
                dataset=incident_dict.get("dataset", "unknown"),
                start_time=str(incident_dict.get("start_time", "")),
                end_time=str(incident_dict.get("end_time", "")),
                peak_score=float(incident_dict.get("peak_score", 0.0)),
                threshold=float(incident_dict.get("threshold", 0.0)),
                duration_windows=int(incident_dict.get("duration_windows", 0)),
                top_sensors_json=json.dumps(
                    incident_dict.get("top_sensors", []), default=str
                ),
                attribution_method=str(incident_dict.get("attribution_method", "unknown")),
                heatmap_path=incident_dict.get("heatmap_path"),
            )
            db.add(incident)
            await db.commit()
            log.info(
                "Incident persisted — dataset=%s peak=%.2f",
                incident.dataset, incident.peak_score,
            )
        except Exception as exc:
            log.error("Failed to save incident: %s", exc)


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    log.info("═══ XCDT-ICS Backend starting up ═══")
    log.info("ML source : %s", settings.ml_src)
    log.info("ML assets : %s", settings.ml_assets)

    await init_db()
    log.info("Database initialised: %s", settings.database_url)

    # Wire up pure-async callbacks — no cross-thread plumbing needed
    inference_service.register_on_record(_ws_broadcast_cb)
    inference_service.register_on_incident(_incident_save_cb)
    log.info("Inference callbacks registered (async).")
    log.info("API docs: http://localhost:%d/docs", settings.port)
    log.info("═══ Ready ═══")

    yield

    # --- Shutdown ---
    log.info("Shutting down ...")
    await inference_service.stop()
    log.info("Inference service stopped.")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="XCDT-ICS — Intelligent Infrastructure Command Center",
    description=(
        "Real-time ICS anomaly detection powered by self-supervised deep learning. "
        "Provides live WebSocket streaming, incident persistence, XAI attribution, "
        "and a red-team attack simulation sandbox."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
from app.routers import health, datasets, inference, incidents, attacks  # noqa: E402

app.include_router(health.router)
app.include_router(datasets.router)
app.include_router(inference.router)
app.include_router(incidents.router)
app.include_router(attacks.router)

# --- Static files: serve heatmap PNGs generated by inference engine ---
_heatmap_root = Path(settings.ml_assets) / "runs" / "heatmaps"
_heatmap_root.mkdir(parents=True, exist_ok=True)
app.mount(
    "/heatmaps",
    StaticFiles(directory=str(_heatmap_root)),
    name="heatmaps",
)


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    Real-time anomaly score stream.

    Each message is a JSON object matching the ``InferenceRecord`` schema::

        {
          "timestamp": "...",
          "anomaly_score": 45.3,
          "is_alert": false,
          "threshold": 79.0,
          "top_sensors": [{"sensor": "FIT101", "score": 0.42}],
          "latent_vector_2d": [0.12, -0.34],
          ...
        }

    The client can send any text (e.g. ``"ping"``) to keep the connection alive.
    """
    await ws_manager.connect(websocket)
    try:
        # Send initial state snapshot
        state = inference_service.get_state()
        await ws_manager.send_to(websocket, {
            "type": "connected",
            "inference_status": state["status"],
            "dataset": state["dataset"],
            "threshold": state["threshold"],
            "ws_clients": ws_manager.connection_count,
        })

        # Keep connection alive (client can send pings)
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if msg == "ping":
                    await ws_manager.send_to(websocket, {"type": "pong"})
            except asyncio.TimeoutError:
                # Send heartbeat every 30 s
                await ws_manager.send_to(websocket, {
                    "type": "heartbeat",
                    "inference_status": inference_service.get_state()["status"],
                })
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        log.warning("WS error: %s", exc)
        ws_manager.disconnect(websocket)


# ---------------------------------------------------------------------------
# Root redirect
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": "XCDT-ICS API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "websocket": "ws://localhost:8000/ws/stream",
    }
