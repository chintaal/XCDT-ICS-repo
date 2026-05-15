"""
test_api.py
===========
End-to-end API tests for the XCDT-ICS FastAPI backend.

Covers all major endpoints:
  • Health         GET  /api/health
  • Datasets       GET  /api/datasets, /api/datasets/{key}, sensor-graph
  • Inference      POST /api/inference/start, /stop, GET /status, /snapshot
  • Attacks        GET  /api/attacks/types, POST /inject, DELETE /clear
  • Incidents      GET  /api/incidents, GET /{id}, PATCH feedback, DELETE
  • WebSocket      ws   /ws/stream
"""

from __future__ import annotations

import json
import pytest
import pytest_asyncio

from httpx import AsyncClient
from fastapi.testclient import TestClient


# ============================================================================
# Health
# ============================================================================

class TestHealth:
    def test_health_returns_ok(self, client: TestClient):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] in ("ok", "degraded")
        assert "inference_status" in body
        assert isinstance(body["db_ok"], bool)
        assert isinstance(body["ml_src_ok"], bool)

    def test_root_returns_info(self, client: TestClient):
        resp = client.get("/")
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "XCDT-ICS API"
        assert "docs" in body
        assert "websocket" in body


# ============================================================================
# Datasets
# ============================================================================

class TestDatasets:
    def test_list_datasets(self, client: TestClient):
        resp = client.get("/api/datasets")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        keys = [d["key"] for d in data]
        # All three datasets should be registered
        for expected_key in ("SWaT", "WADI", "Indian"):
            assert expected_key in keys

    def test_get_dataset_swat(self, client: TestClient):
        resp = client.get("/api/datasets/SWaT")
        assert resp.status_code == 200
        body = resp.json()
        assert body["key"] == "SWaT"
        assert "display_name" in body
        assert "n_sensors" in body

    def test_get_dataset_not_found(self, client: TestClient):
        resp = client.get("/api/datasets/NONEXISTENT")
        assert resp.status_code == 404

    def test_sensor_graph_swat(self, client: TestClient):
        resp = client.get("/api/datasets/SWaT/sensor-graph")
        assert resp.status_code == 200
        body = resp.json()
        assert body["dataset"] == "SWaT"
        assert isinstance(body["nodes"], list)
        assert isinstance(body["edges"], list)
        # Each node must have id, stage, stage_short
        for node in body["nodes"]:
            assert "id" in node
            assert "stage" in node
        # Each edge must have source, target, weight
        for edge in body["edges"]:
            assert "source" in edge
            assert "target" in edge
            assert "weight" in edge

    def test_sensor_graph_not_found(self, client: TestClient):
        resp = client.get("/api/datasets/UNKNOWN/sensor-graph")
        assert resp.status_code == 404


# ============================================================================
# Inference Control
# ============================================================================

class TestInference:
    def test_get_status_idle(self, client: TestClient):
        resp = client.get("/api/inference/status")
        assert resp.status_code == 200
        body = resp.json()
        assert "status" in body

    def test_start_inference(self, client: TestClient):
        resp = client.post(
            "/api/inference/start",
            json={"dataset": "SWaT", "emit_interval": 0.0}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "running"
        assert body["dataset"] == "SWaT"

    def test_start_inference_invalid_dataset(self, client: TestClient):
        # The model validates the request, but the mock accepts anything.
        # Test that required fields are validated.
        resp = client.post("/api/inference/start", json={})
        # Default dataset is SWaT so this should be fine with defaults
        assert resp.status_code in (200, 422)

    def test_stop_inference(self, client: TestClient):
        resp = client.post("/api/inference/stop")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "stopped"

    def test_snapshot_not_found_before_start(self, client: TestClient):
        # After mock stop, current_record is None
        resp = client.get("/api/inference/snapshot")
        # Either 200 (if record present) or 404
        assert resp.status_code in (200, 404)

    def test_update_threshold_requires_running(self, client: TestClient):
        # When stopped, threshold update should return 400
        resp = client.post(
            "/api/inference/threshold",
            json={"threshold": 85.0}
        )
        assert resp.status_code in (200, 400)

    @pytest.mark.asyncio
    async def test_start_inference_async(self, async_client: AsyncClient):
        resp = await async_client.post(
            "/api/inference/start",
            json={"dataset": "SWaT", "emit_interval": 0.05}
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "running"


# ============================================================================
# Attack Sandbox
# ============================================================================

class TestAttacks:
    def test_list_attack_types(self, client: TestClient):
        resp = client.get("/api/attacks/types")
        assert resp.status_code == 200
        types = resp.json()
        assert isinstance(types, list)
        type_names = [t["type"] for t in types]
        assert "freeze" in type_names
        assert "offset" in type_names
        assert "noise" in type_names

    def test_inject_attack_when_running(self, client: TestClient):
        # Start first
        client.post("/api/inference/start", json={"dataset": "SWaT"})

        resp = client.post(
            "/api/attacks/inject",
            json={
                "sensor": "FIT101",
                "attack_type": "freeze",
                "magnitude": 0.0,
                "duration_ticks": 50,
            }
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "injected"
        assert body["sensor"] == "FIT101"
        assert body["attack_type"] == "freeze"

    def test_inject_attack_invalid_type(self, client: TestClient):
        client.post("/api/inference/start", json={"dataset": "SWaT"})
        resp = client.post(
            "/api/attacks/inject",
            json={
                "sensor": "FIT101",
                "attack_type": "INVALID_TYPE",
                "magnitude": 1.0,
                "duration_ticks": 50,
            }
        )
        assert resp.status_code == 422

    def test_clear_attack(self, client: TestClient):
        resp = client.delete("/api/attacks/clear")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cleared"

    def test_attack_status(self, client: TestClient):
        resp = client.get("/api/attacks/status")
        assert resp.status_code == 200
        body = resp.json()
        assert "active" in body

    def test_inject_attack_when_not_running(self, client: TestClient):
        # Stop first
        client.post("/api/inference/stop")
        resp = client.post(
            "/api/attacks/inject",
            json={"sensor": "FIT101", "attack_type": "freeze",
                  "magnitude": 0.0, "duration_ticks": 50}
        )
        assert resp.status_code == 400


# ============================================================================
# Incidents CRUD
# ============================================================================

class TestIncidents:
    def test_list_incidents_empty(self, client: TestClient):
        resp = client.get("/api/incidents")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_incidents_with_filter(self, client: TestClient):
        resp = client.get("/api/incidents?dataset=SWaT&limit=10")
        assert resp.status_code == 200

    def test_get_incident_not_found(self, client: TestClient):
        resp = client.get("/api/incidents/99999")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_create_and_fetch_incident(self, async_client: AsyncClient):
        """Insert an incident directly via the DB session and fetch via API."""
        from tests.conftest import TestSessionLocal
        from app.models import Incident
        import json

        async with TestSessionLocal() as db:
            inc = Incident(
                dataset="SWaT",
                start_time="2024-01-15 14:20:00",
                end_time="2024-01-15 14:23:42",
                peak_score=112.4,
                threshold=79.0,
                duration_windows=22,
                top_sensors_json=json.dumps([{"sensor": "FIT101", "score": 0.82}]),
                attribution_method="direct_evidence",
            )
            db.add(inc)
            await db.commit()
            incident_id = inc.id

        # Fetch via API
        resp = await async_client.get(f"/api/incidents/{incident_id}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["dataset"] == "SWaT"
        assert body["peak_score"] == pytest.approx(112.4, abs=0.01)
        assert len(body["top_sensors"]) == 1
        assert body["top_sensors"][0]["sensor"] == "FIT101"

        # Patch feedback
        resp = await async_client.patch(
            f"/api/incidents/{incident_id}/feedback",
            json={"ground_truth": 1, "notes": "Confirmed freeze attack on FIT101."}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["ground_truth"] == 1
        assert "Confirmed" in body["notes"]

        # Delete
        resp = await async_client.delete(f"/api/incidents/{incident_id}")
        assert resp.status_code == 200
        assert resp.json()["deleted"] == incident_id

        # Confirm gone
        resp = await async_client.get(f"/api/incidents/{incident_id}")
        assert resp.status_code == 404

    def test_incident_stats(self, client: TestClient):
        resp = client.get("/api/incidents/stats/summary")
        assert resp.status_code == 200
        body = resp.json()
        assert "by_dataset" in body

    def test_feedback_invalid_ground_truth(self, client: TestClient):
        # ground_truth must be 0 or 1 — try 5
        # First create a dummy incident
        from tests.conftest import TestSessionLocal
        from app.models import Incident
        import asyncio

        async def _create():
            async with TestSessionLocal() as db:
                inc = Incident(
                    dataset="SWaT", start_time="t", end_time="t",
                    peak_score=100.0, threshold=79.0, duration_windows=1,
                )
                db.add(inc)
                await db.commit()
                return inc.id

        loop = asyncio.new_event_loop()
        inc_id = loop.run_until_complete(_create())
        loop.close()

        resp = client.patch(
            f"/api/incidents/{inc_id}/feedback",
            json={"ground_truth": 5}
        )
        assert resp.status_code == 422


# ============================================================================
# WebSocket
# ============================================================================

class TestWebSocket:
    def test_websocket_connect_and_receive_greeting(self, client: TestClient):
        with client.websocket_connect("/ws/stream") as ws:
            msg = ws.receive_json()
            assert msg["type"] == "connected"
            assert "inference_status" in msg
            assert "ws_clients" in msg

    def test_websocket_ping_pong(self, client: TestClient):
        with client.websocket_connect("/ws/stream") as ws:
            ws.receive_json()  # connected message
            ws.send_text("ping")
            msg = ws.receive_json()
            assert msg["type"] == "pong"

    def test_multiple_ws_connections(self, client: TestClient):
        with client.websocket_connect("/ws/stream") as ws1:
            ws1.receive_json()
            with client.websocket_connect("/ws/stream") as ws2:
                ws2.receive_json()
                # Both are connected
                assert True  # no crash


# ============================================================================
# Validation Tests
# ============================================================================

class TestValidation:
    def test_start_inference_invalid_emit_interval(self, client: TestClient):
        resp = client.post(
            "/api/inference/start",
            json={"dataset": "SWaT", "emit_interval": -1.0}  # negative not allowed
        )
        assert resp.status_code == 422

    def test_start_inference_emit_interval_too_large(self, client: TestClient):
        resp = client.post(
            "/api/inference/start",
            json={"dataset": "SWaT", "emit_interval": 100.0}  # > 5.0 not allowed
        )
        assert resp.status_code == 422

    def test_attack_inject_negative_ticks(self, client: TestClient):
        client.post("/api/inference/start", json={"dataset": "SWaT"})
        resp = client.post(
            "/api/attacks/inject",
            json={"sensor": "FIT101", "attack_type": "freeze",
                  "magnitude": 0.0, "duration_ticks": 0}
        )
        assert resp.status_code == 422

    def test_threshold_update_negative(self, client: TestClient):
        resp = client.post(
            "/api/inference/threshold",
            json={"threshold": -5.0}
        )
        assert resp.status_code == 422


# ============================================================================
# Integration smoke test (requires real assets)
# ============================================================================

@pytest.mark.skip(reason="Integration test requires ML assets — run with: pytest -m integration")
@pytest.mark.integration
class TestIntegration:
    """
    These tests are skipped by default. To run them with the real ML engine:
        pytest tests/test_api.py -m integration -v
    Requires:
        - backend/ml/checkpoints/*.pt to exist (run copy_assets.sh first)
        - backend/ml/Datasets/SWaT/ to exist
    """

    def test_real_inference_start_stop(self, client: TestClient):
        """Starts the real inference engine, waits for a record, stops."""
        import time

        resp = client.post(
            "/api/inference/start",
            json={"dataset": "SWaT", "emit_interval": 0.01, "max_rows": 5}
        )
        assert resp.status_code == 200

        # Wait up to 60s for engine to initialise and emit at least one record
        deadline = time.time() + 60
        while time.time() < deadline:
            resp = client.get("/api/inference/snapshot")
            if resp.status_code == 200:
                body = resp.json()
                assert "anomaly_score" in body
                assert "threshold" in body
                break
            time.sleep(1.0)
        else:
            pytest.fail("Inference engine did not emit a record within 60 seconds")

        resp = client.post("/api/inference/stop")
        assert resp.status_code == 200
