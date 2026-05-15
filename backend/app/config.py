"""
config.py
=========
Centralised settings loaded from environment variables (with sensible defaults).
Override any value via a .env file in the backend/ directory.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# ---------------------------------------------------------------------------
# Resolve paths relative to this file's location
# ---------------------------------------------------------------------------

_BACKEND_DIR = Path(__file__).parent.parent.resolve()
_REPO_DIR    = _BACKEND_DIR.parent.resolve()
# The ML research repo sitting next to XCDT-ICS-repo/
_ML_SRC_DEFAULT = str(_REPO_DIR.parent / "XCDT-ICS-ml")
# Local copy of assets (checkpoints + datasets) made by copy_assets.sh
_ML_ASSETS_DEFAULT = str(_BACKEND_DIR / "ml")
# Python interpreter in the ML venv (has torch, sklearn, etc.)
_ML_PYTHON_DEFAULT = str(_REPO_DIR.parent / "XCDT-ICS-ml" / ".venv" / "bin" / "python")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_BACKEND_DIR / ".env"), extra="ignore")

    # ------------------------------------------------------------------
    # ML
    # ------------------------------------------------------------------
    # Path to the ML research repo Python source
    ml_src: str = _ML_SRC_DEFAULT

    # Python interpreter inside the ML venv (has torch, sklearn, PIL, etc.)
    # The inference engine runs as a subprocess using this interpreter.
    ml_python: str = _ML_PYTHON_DEFAULT

    # Path where copy_assets.sh dropped checkpoints + datasets
    ml_assets: str = _ML_ASSETS_DEFAULT

    # Default dataset on startup (can be changed via API)
    default_dataset: str = "SWaT"

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    database_url: str = f"sqlite+aiosqlite:///{_BACKEND_DIR / 'xcdt_ics.db'}"

    # ------------------------------------------------------------------
    # Server
    # ------------------------------------------------------------------
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    # ------------------------------------------------------------------
    # WebSocket
    # ------------------------------------------------------------------
    ws_queue_maxsize: int = 2000
    # Emit interval in seconds between windows (0 = full speed).
    # Set to 0.05–0.2 in demo mode so the frontend sees a live feed.
    emit_interval: float = 0.05

    # ------------------------------------------------------------------
    # Inference defaults (can be overridden per-request)
    # ------------------------------------------------------------------
    window_len: int = 60
    stride: int = 10
    persistence_k: int = 2
    cooldown_k: int = 5


settings = Settings()


def get_ml_asset_path(relative: str) -> Path:
    """Return absolute path to an ML asset (relative to ml_assets dir)."""
    return Path(settings.ml_assets) / relative


def patch_ml_config_paths(dataset_registry_entry) -> None:
    """
    Rewrite relative paths in a DatasetConfig to use ml_assets directory.
    Called once after importing config_registry.
    """
    base = Path(settings.ml_assets)

    def _abs(p: str) -> str:
        pp = Path(p)
        if pp.is_absolute() and pp.exists():
            return p
        candidate = base / p
        if candidate.exists():
            return str(candidate)
        return str(base / Path(p).name)

    dataset_registry_entry.checkpoint_path = _abs(dataset_registry_entry.checkpoint_path)
    dataset_registry_entry.normal_csv      = _abs(dataset_registry_entry.normal_csv)
    dataset_registry_entry.attack_csv      = _abs(dataset_registry_entry.attack_csv)
