"""
conftest.py
===========
Shared test fixtures for the XCDT-ICS backend test suite.

Strategy
--------
* We use an **in-memory SQLite** database so tests never touch the production DB.
* The ML inference engine is **mocked** so tests run in milliseconds without
  requiring model checkpoints or dataset CSVs.
* A real ``TestClient`` is used for synchronous HTTP tests.
* An ``AsyncClient`` (httpx) is used for async endpoint tests.
"""

from __future__ import annotations

import json
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# ---------------------------------------------------------------------------
# Override database URL to in-memory SQLite before importing app
# ---------------------------------------------------------------------------

import os
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from app.database import Base, get_db  # noqa: E402
from app.main import app               # noqa: E402

# ---------------------------------------------------------------------------
# In-memory async engine + session override
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = async_sessionmaker(
    test_engine, expire_on_commit=False
)


async def override_get_db() -> AsyncGenerator:
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db

# Also patch the AsyncSessionLocal used in main.py's incident saver callback
# so the integration with the incident saver uses the same test DB.
import app.database as _db_module
_db_module.AsyncSessionLocal = TestSessionLocal


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Create tables in the in-memory test DB once per session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Mock the inference service (so no ML is actually loaded)
# ---------------------------------------------------------------------------

MOCK_RECORD = {
    "timestamp": "2024-01-15 14:23:07",
    "window_end_index": 1000,
    "anomaly_score": 45.3,
    "score_mahalanobis": 40.1,
    "score_collapse": 5.2,
    "score_deviation": 0.0,
    "collapse_weight": 1.97,
    "raw_above": False,
    "is_alert": False,
    "threshold": 79.0,
    "true_label": 0,
    "top_sensors": [{"sensor": "FIT101", "score": 0.42}],
    "top_sensors_grad": [{"sensor": "FIT101", "score": 0.42}],
    "top_sensors_direct": [],
    "top_3_sensors": [{"sensor": "FIT101", "score": 0.42}],
    "attribution_method": "channel_input_x_grad",
    "heatmap_path": None,
    "latent_vector_2d": [0.12, -0.34],
    "inference_time_ms": 12.5,
    "dataset": "SWaT",
    "pass_number": 1,
}

MOCK_SENSOR_NODES = [
    {"id": "FIT101", "stage": "Stage 1 — Raw Water Inlet", "stage_short": "Stage"},
    {"id": "MV101",  "stage": "Stage 1 — Raw Water Inlet", "stage_short": "Stage"},
    {"id": "P101",   "stage": "Stage 1 — Raw Water Inlet", "stage_short": "Stage"},
]
MOCK_SENSOR_EDGES = [
    {"source": "FIT101", "target": "MV101", "weight": 0.7},
]


@pytest.fixture(autouse=True)
def mock_inference_service(monkeypatch):
    """Mock the inference service so tests never load ML models."""
    from app import inference_service as svc_module

    svc = svc_module.inference_service

    mock_state = {
        "status": "idle",
        "dataset": None,
        "threshold": None,
        "sensor_cols": ["FIT101", "MV101", "P101"],
        "n_sensors": 3,
        "pass_number": 0,
        "total_windows": 0,
        "error": None,
        "current_record": None,
    }

    monkeypatch.setattr(svc, "get_state", lambda: dict(mock_state))
    monkeypatch.setattr(svc, "inject_attack", MagicMock())
    monkeypatch.setattr(svc, "clear_attack", MagicMock())
    monkeypatch.setattr(svc, "get_sensor_graph",
                        lambda _key: (MOCK_SENSOR_NODES, MOCK_SENSOR_EDGES))

    async def mock_start(request):
        mock_state["status"] = "running"
        mock_state["dataset"] = request.dataset
        mock_state["current_record"] = MOCK_RECORD

    async def mock_stop():
        mock_state["status"] = "stopped"

    monkeypatch.setattr(svc, "start", mock_start)
    monkeypatch.setattr(svc, "stop", mock_stop)
    # The new service uses async callbacks; mock register methods as no-ops
    monkeypatch.setattr(svc, "register_on_record", lambda cb: None)
    monkeypatch.setattr(svc, "register_on_incident", lambda cb: None)

    return svc


@pytest.fixture
def client():
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
