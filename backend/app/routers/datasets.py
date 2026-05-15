"""
routers/datasets.py
===================
Endpoints for listing available datasets and fetching sensor graph topology.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models import DatasetInfo, SensorEdge, SensorGraphResponse, SensorNode

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


def _import_config() -> None:
    """Import config_registry only (no torch required)."""
    from app.config import settings
    from app.inference_service import _ensure_ml_src
    _ensure_ml_src()


def _get_registry():
    _import_config()
    from config_registry import DATASET_REGISTRY, audit_config
    from app.config import patch_ml_config_paths

    result = {}
    for key, cfg in DATASET_REGISTRY.items():
        import copy
        cfg_copy = copy.copy(cfg)
        patch_ml_config_paths(cfg_copy)
        errors = audit_config(cfg_copy)
        result[key] = (cfg_copy, errors)
    return result


@router.get("", response_model=List[DatasetInfo])
async def list_datasets() -> List[DatasetInfo]:
    """List all registered datasets and whether their asset files exist."""
    registry = _get_registry()
    return [
        DatasetInfo(
            key=key,
            display_name=cfg.display_name,
            n_sensors=cfg.n_sensors,
            checkpoint_path=cfg.checkpoint_path,
            normal_csv=cfg.normal_csv,
            attack_csv=cfg.attack_csv,
            assets_ok=len(errors) == 0,
            missing_files=errors,
        )
        for key, (cfg, errors) in registry.items()
    ]


@router.get("/{dataset_key}", response_model=DatasetInfo)
async def get_dataset(dataset_key: str) -> DatasetInfo:
    """Get details for a single dataset."""
    registry = _get_registry()
    if dataset_key not in registry:
        raise HTTPException(404, detail=f"Dataset '{dataset_key}' not found.")
    cfg, errors = registry[dataset_key]
    return DatasetInfo(
        key=dataset_key,
        display_name=cfg.display_name,
        n_sensors=cfg.n_sensors,
        checkpoint_path=cfg.checkpoint_path,
        normal_csv=cfg.normal_csv,
        attack_csv=cfg.attack_csv,
        assets_ok=len(errors) == 0,
        missing_files=errors,
    )


@router.get("/{dataset_key}/sensor-graph", response_model=SensorGraphResponse)
async def get_sensor_graph(dataset_key: str) -> SensorGraphResponse:
    """
    Return the sensor dependency graph (nodes + edges) for the given dataset.
    Nodes are sensors grouped by process stage; edges connect co-located sensors.
    """
    from app.inference_service import inference_service
    _import_config()
    from config_registry import DATASET_REGISTRY
    if dataset_key not in DATASET_REGISTRY:
        raise HTTPException(404, detail=f"Dataset '{dataset_key}' not found.")

    try:
        nodes_raw, edges_raw = inference_service.get_sensor_graph(dataset_key)
    except Exception as exc:
        raise HTTPException(500, detail=f"Failed to build sensor graph: {exc}")

    return SensorGraphResponse(
        dataset=dataset_key,
        nodes=[SensorNode(**n) for n in nodes_raw],
        edges=[SensorEdge(**e) for e in edges_raw],
    )
