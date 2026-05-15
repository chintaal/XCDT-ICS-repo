"""
inference_service.py
====================
Manages the ML inference engine as an **external subprocess** and tails its
JSONL output to broadcast records to WebSocket clients.

Architecture
------------

    ┌─────────────────────────────────────────────────────────┐
    │  XCDT-ICS-ml/  (ML venv — torch, sklearn, etc.)        │
    │  $ python inference_engine.py --dataset SWaT ...        │
    │                           ↓ writes                       │
    │  runs/SWaT_replay_log.jsonl  (line-buffered JSONL)     │
    └──────────────────────┬──────────────────────────────────┘
                           │  tail-follow (asyncio)
    ┌──────────────────────▼──────────────────────────────────┐
    │  FastAPI backend  (no torch required)                    │
    │  InferenceService._tail_jsonl()                          │
    │        ↓ broadcasts                                      │
    │  ws_manager  →  all connected WebSocket clients         │
    │        ↓ persists                                        │
    │  SQLite incidents table                                   │
    └─────────────────────────────────────────────────────────┘

Attack injection uses the existing IPC mechanism in inference_engine.py:
  write JSON → XCDT-ICS-ml/runs/attack_state.json
  the inference engine polls this file at every stride boundary.

This means the FastAPI backend has **zero torch dependency** at runtime.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import threading
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

from app.config import settings

log = logging.getLogger("inference_service")


# ---------------------------------------------------------------------------
# Ensure ML src on sys.path (only needed for config_registry + data_loader)
# ---------------------------------------------------------------------------

def _ensure_ml_src() -> None:
    ml_src = str(Path(settings.ml_src).resolve())
    if ml_src not in sys.path:
        sys.path.insert(0, ml_src)


_ensure_ml_src()


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

@dataclass
class ServiceState:
    status: str = "idle"          # idle | initializing | running | stopped | error
    dataset: Optional[str] = None
    threshold: Optional[float] = None
    sensor_cols: Optional[List[str]] = None
    n_sensors: Optional[int] = None
    pass_number: int = 0
    total_windows: int = 0
    error: Optional[str] = None
    current_record: Optional[dict] = None


# ---------------------------------------------------------------------------
# Incident tracker — runs entirely inside the async event loop
# ---------------------------------------------------------------------------

class _IncidentTracker:
    """Detects incident open/close transitions from the record stream."""

    def __init__(self) -> None:
        self.in_incident = False
        self.start_time = ""
        self.peak_score = 0.0
        self.top_sensors: list = []
        self.attribution_method = "unknown"
        self.heatmap_path: Optional[str] = None
        self.threshold = 0.0
        self.duration = 0

    def update(self, record: dict) -> Optional[dict]:
        """
        Returns a closed-incident dict when an incident just ended, else None.
        """
        is_alert = bool(record.get("is_alert", False))
        score = float(record.get("anomaly_score", 0.0))
        ts = str(record.get("timestamp", ""))

        if is_alert and not self.in_incident:
            self.in_incident = True
            self.start_time = ts
            self.peak_score = score
            self.top_sensors = record.get("top_sensors", [])
            self.attribution_method = record.get("attribution_method", "unknown")
            self.heatmap_path = record.get("heatmap_path")
            self.threshold = float(record.get("threshold", 0.0))
            self.duration = 0

        elif is_alert and self.in_incident:
            self.duration += 1
            if score > self.peak_score:
                self.peak_score = score
                self.top_sensors = record.get("top_sensors", self.top_sensors)
                self.heatmap_path = record.get("heatmap_path", self.heatmap_path)

        elif not is_alert and self.in_incident:
            self.in_incident = False
            return {
                "dataset":           record.get("dataset", "unknown"),
                "start_time":        self.start_time,
                "end_time":          ts,
                "peak_score":        self.peak_score,
                "threshold":         self.threshold,
                "duration_windows":  self.duration,
                "top_sensors":       self.top_sensors,
                "attribution_method": self.attribution_method,
                "heatmap_path":      self.heatmap_path,
            }

        return None


# ---------------------------------------------------------------------------
# InferenceService
# ---------------------------------------------------------------------------

class InferenceService:
    """
    Spawns ``inference_engine.py`` as a child process, tails its JSONL output,
    and broadcasts records to registered async callbacks.
    """

    def __init__(self) -> None:
        self._state = ServiceState()
        self._state_lock = threading.Lock()
        self._process: Optional[asyncio.subprocess.Process] = None
        self._tail_task: Optional[asyncio.Task] = None
        self._monitor_task: Optional[asyncio.Task] = None
        self._incident_tracker = _IncidentTracker()

        # Async callbacks — called directly from the event loop
        self._on_record: List[Callable[[dict], Awaitable[None]]] = []
        self._on_incident: List[Callable[[dict], Awaitable[None]]] = []

        # Attack injection state (lock protects _attack_state dict)
        self._attack_lock = threading.Lock()
        self._attack_state: dict = {"active": False}

    # ------------------------------------------------------------------
    # Callback registration
    # ------------------------------------------------------------------

    def register_on_record(self, cb: Callable[[dict], Awaitable[None]]) -> None:
        self._on_record.append(cb)

    def register_on_incident(self, cb: Callable[[dict], Awaitable[None]]) -> None:
        self._on_incident.append(cb)

    # ------------------------------------------------------------------
    # Public async API
    # ------------------------------------------------------------------

    async def start(self, request) -> None:
        """
        Spawn ``inference_engine.py`` and begin tailing its output.
        ``request`` is a ``StartInferenceRequest`` Pydantic model.
        """
        with self._state_lock:
            if self._state.status in ("initializing", "running"):
                raise RuntimeError(
                    f"Cannot start: service already in state '{self._state.status}'."
                )

        # Resolve paths — do NOT resolve() ml_py (would follow venv symlink)
        ml_src   = Path(settings.ml_src).resolve()
        ml_py    = Path(settings.ml_python).absolute()
        out_path = ml_src / "runs" / f"{request.dataset}_replay_log.jsonl"
        out_path.parent.mkdir(parents=True, exist_ok=True)

        # Resolve sensor_cols early (no torch — just reads CSV header)
        self._resolve_sensor_cols(request.dataset)

        # Build inference_engine.py CLI args
        cmd = [
            str(ml_py),
            str(ml_src / "inference_engine.py"),
            "--dataset",       request.dataset,
            "--emit-interval", str(float(request.emit_interval)),
            "--threshold-pct", str(float(request.threshold_pct)),
            "--persistence",   str(int(request.persistence_k)),
            "--cooldown",      str(int(request.cooldown_k)),
            "--out",           str(out_path),
        ]
        if request.max_rows:
            cmd += ["--max-rows", str(int(request.max_rows))]

        log.info("Spawning inference engine: %s", " ".join(cmd))
        self._process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(ml_src),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        log.info("Inference engine PID=%d", self._process.pid)

        self._set_state(
            status="initializing",
            dataset=request.dataset,
            error=None,
        )

        # Reset incident tracker for new session
        self._incident_tracker = _IncidentTracker()

        # Start background tasks
        self._tail_task    = asyncio.create_task(
            self._tail_jsonl(out_path, request.dataset),
            name="tail_jsonl",
        )
        self._monitor_task = asyncio.create_task(
            self._monitor_stderr(),
            name="monitor_stderr",
        )

    async def stop(self) -> None:
        """Gracefully terminate the inference process and cancel tasks."""
        if self._process and self._process.returncode is None:
            try:
                self._process.terminate()
                await asyncio.wait_for(self._process.wait(), timeout=5.0)
            except (asyncio.TimeoutError, ProcessLookupError):
                try:
                    self._process.kill()
                except ProcessLookupError:
                    pass
        for task in (self._tail_task, self._monitor_task):
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        self._set_state(status="stopped")
        log.info("Inference service stopped.")

    def inject_attack(
        self,
        sensor: str,
        attack_type: str,
        magnitude: float,
        duration_ticks: int,
    ) -> None:
        """Write attack parameters to the IPC file the engine polls."""
        state = {
            "active":         True,
            "sensor":         sensor,
            "type":           attack_type,
            "magnitude":      float(magnitude),
            "duration_ticks": int(duration_ticks),
        }
        self._write_attack_state(state)
        with self._attack_lock:
            self._attack_state = dict(state)
        log.info("Attack injected: %s", state)

    def clear_attack(self) -> None:
        """Cancel any active attack immediately."""
        self._write_attack_state({"active": False})
        with self._attack_lock:
            self._attack_state = {"active": False}

    def get_state(self) -> dict:
        with self._state_lock:
            return {
                "status":         self._state.status,
                "dataset":        self._state.dataset,
                "threshold":      self._state.threshold,
                "sensor_cols":    self._state.sensor_cols,
                "n_sensors":      self._state.n_sensors,
                "pass_number":    self._state.pass_number,
                "total_windows":  self._state.total_windows,
                "error":          self._state.error,
                "current_record": self._state.current_record,
            }

    def get_sensor_graph(self, dataset_key: str) -> Tuple[List[dict], List[dict]]:
        """
        Build sensor dependency graph from config_registry.
        Torch-free — only needs pandas + config_registry.
        """
        _ensure_ml_src()
        from config_registry import get_config as _gc
        from app.config import patch_ml_config_paths
        from data_loader import sensor_column_names as _scn
        import copy, pandas as pd

        cfg = copy.copy(_gc(dataset_key))
        patch_ml_config_paths(cfg)

        try:
            df = pd.read_csv(cfg.normal_csv, nrows=0, skipinitialspace=True)
            df.columns = [c.strip() for c in df.columns]
            cols = _scn(df.columns, cfg.exclude_cols)
        except Exception as exc:
            log.warning("Could not read CSV for sensor graph: %s", exc)
            cols = [f"S{i}" for i in range(cfg.n_sensors or 10)]

        nodes: List[dict] = []
        stage_buckets: Dict[str, List[str]] = {}
        for c in cols:
            stage = cfg.stage_fn(c)
            nodes.append({
                "id":          c,
                "stage":       stage,
                "stage_short": stage.split()[0] if stage else "?",
            })
            stage_buckets.setdefault(stage, []).append(c)

        edges: List[dict] = []
        for sensors_in_stage in stage_buckets.values():
            for i, s1 in enumerate(sensors_in_stage):
                for s2 in sensors_in_stage[i + 1:]:
                    edges.append({"source": s1, "target": s2, "weight": 0.7})

        return nodes, edges

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _set_state(self, **kwargs) -> None:
        with self._state_lock:
            for k, v in kwargs.items():
                setattr(self._state, k, v)

    def _resolve_sensor_cols(self, dataset_key: str) -> None:
        """Read CSV header to get sensor columns without loading the model."""
        try:
            _ensure_ml_src()
            from config_registry import get_config as _gc
            from app.config import patch_ml_config_paths
            from data_loader import sensor_column_names as _scn
            import copy, pandas as pd

            cfg = copy.copy(_gc(dataset_key))
            patch_ml_config_paths(cfg)
            df = pd.read_csv(cfg.normal_csv, nrows=0, skipinitialspace=True)
            df.columns = [c.strip() for c in df.columns]
            cols = _scn(df.columns, cfg.exclude_cols)
            self._set_state(sensor_cols=cols, n_sensors=len(cols))
            log.info("Resolved %d sensor columns for %s", len(cols), dataset_key)
        except Exception as exc:
            log.warning("Could not resolve sensor_cols: %s", exc)

    def _attack_state_path(self) -> Path:
        return Path(settings.ml_src) / "runs" / "attack_state.json"

    def _write_attack_state(self, state: dict) -> None:
        path = self._attack_state_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = str(path) + ".tmp"
        try:
            with open(tmp, "w") as f:
                json.dump(state, f, indent=2)
            os.replace(tmp, str(path))
        except OSError as exc:
            log.warning("Failed to write attack_state.json: %s", exc)

    # ------------------------------------------------------------------
    # Background tasks (run in the asyncio event loop)
    # ------------------------------------------------------------------

    async def _monitor_stderr(self) -> None:
        """Log stderr from the subprocess (shows training progress, errors)."""
        if self._process is None or self._process.stderr is None:
            return
        try:
            async for line in self._process.stderr:
                decoded = line.decode(errors="replace").rstrip()
                if decoded:
                    # Propagate engine logs as INFO; show ERRORS prominently
                    if "ERROR" in decoded or "error" in decoded.lower():
                        log.error("[engine] %s", decoded)
                    else:
                        log.info("[engine] %s", decoded)
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            log.warning("stderr monitor error: %s", exc)

    async def _tail_jsonl(self, path: Path, dataset: str) -> None:
        """
        Tail-follow the inference engine's JSONL output file.

        Waits up to 3 minutes for the file to appear (baseline fitting takes
        ~30–120 s depending on dataset size), then follows new lines
        as they arrive and dispatches each record.
        """
        # --- Wait for file to appear ---
        deadline = asyncio.get_event_loop().time() + 180.0
        while not path.exists():
            if asyncio.get_event_loop().time() > deadline:
                self._set_state(
                    status="error",
                    error=f"Output file never appeared: {path}",
                )
                return
            await asyncio.sleep(1.0)

        log.info("Output file found, beginning tail: %s", path)

        pass_number = 0
        total_windows = 0

        try:
            with open(path, "r", encoding="utf-8", errors="replace") as fh:
                # Seek to end — skip data from any previous run
                fh.seek(0, 2)

                while True:
                    line = fh.readline()

                    if line:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            record = json.loads(line)
                        except json.JSONDecodeError:
                            continue

                        # Augment record with backend-side metadata
                        record["dataset"] = dataset
                        total_windows += 1

                        # Infer pass_number from window_end_index resets
                        win_idx = record.get("window_end_index", 0)
                        if total_windows > 1 and win_idx <= 10:
                            pass_number += 1
                        if total_windows == 1:
                            pass_number = 1

                        record["pass_number"] = pass_number

                        # Switch from "initializing" to "running" on first record
                        if self._state.status == "initializing":
                            self._set_state(
                                status="running",
                                threshold=record.get("threshold"),
                            )
                            log.info(
                                "First record received — engine running (threshold=%.4f)",
                                record.get("threshold", 0.0),
                            )

                        self._set_state(
                            current_record=record,
                            threshold=record.get("threshold", self._state.threshold),
                            total_windows=total_windows,
                            pass_number=pass_number,
                        )

                        # Incident detection
                        closed_incident = self._incident_tracker.update(record)
                        if closed_incident:
                            for cb in self._on_incident:
                                asyncio.create_task(cb(closed_incident))

                        # Broadcast record to WS clients
                        for cb in self._on_record:
                            asyncio.create_task(cb(record))

                    else:
                        # Check if process exited
                        if self._process and self._process.returncode is not None:
                            rc = self._process.returncode
                            if rc != 0:
                                self._set_state(
                                    status="error",
                                    error=f"Inference process exited with code {rc}",
                                )
                                log.error("Inference engine exited: code=%d", rc)
                            else:
                                self._set_state(status="stopped")
                                log.info("Inference engine finished normally.")
                            return

                        await asyncio.sleep(0.01)  # 10 ms poll — low CPU

        except asyncio.CancelledError:
            log.info("JSONL tail task cancelled.")
        except Exception as exc:
            log.exception("JSONL tail error: %s", exc)
            self._set_state(status="error", error=str(exc))


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

inference_service: InferenceService = InferenceService()
