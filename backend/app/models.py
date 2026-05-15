"""
models.py
=========
SQLAlchemy ORM models (database tables) + Pydantic schemas (API contracts).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# ============================================================================
# SQLAlchemy ORM
# ============================================================================

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int]           = mapped_column(Integer, primary_key=True, index=True)
    dataset: Mapped[str]      = mapped_column(String(50), nullable=False, index=True)
    start_time: Mapped[str]   = mapped_column(String(64), nullable=False)
    end_time: Mapped[Optional[str]]    = mapped_column(String(64), nullable=True)
    peak_score: Mapped[float] = mapped_column(Float, nullable=False)
    threshold: Mapped[float]  = mapped_column(Float, nullable=False)
    duration_windows: Mapped[int] = mapped_column(Integer, default=0)
    # JSON-serialised list of {"sensor": str, "score": float}
    top_sensors_json: Mapped[str] = mapped_column(Text, default="[]")
    attribution_method: Mapped[str] = mapped_column(String(64), default="unknown")
    heatmap_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    # Operator feedback: null=unlabelled, 0=false positive, 1=true positive
    ground_truth: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    @property
    def top_sensors(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.top_sensors_json or "[]")
        except Exception:
            return []


class Baseline(Base):
    __tablename__ = "baselines"

    id: Mapped[int]            = mapped_column(Integer, primary_key=True, index=True)
    dataset: Mapped[str]       = mapped_column(String(50), nullable=False, index=True)
    threshold: Mapped[float]   = mapped_column(Float, nullable=False)
    threshold_pct: Mapped[float] = mapped_column(Float, nullable=False)
    collapse_weight: Mapped[float] = mapped_column(Float, default=0.0)
    n_sensors: Mapped[int]     = mapped_column(Integer, nullable=False)
    n_baseline_windows: Mapped[int] = mapped_column(Integer, default=0)
    sensor_cols_json: Mapped[str]  = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    action: Mapped[str]  = mapped_column(String(128), nullable=False, index=True)
    details_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ============================================================================
# Pydantic Schemas
# ============================================================================

# ---------------------------------------------------------------------------
# Inference / Streaming
# ---------------------------------------------------------------------------

class SensorAttribution(BaseModel):
    sensor: str
    score: float


class InferenceRecord(BaseModel):
    """
    One emitted window from the inference engine.
    Extra fields from the engine are allowed and passed through as-is.
    """
    model_config = ConfigDict(extra="allow")

    timestamp: str
    window_end_index: int
    anomaly_score: float
    score_mahalanobis: float = 0.0
    score_collapse: float = 0.0
    score_deviation: float = 0.0
    collapse_weight: float = 0.0
    raw_above: bool
    is_alert: bool
    threshold: float
    true_label: int
    top_sensors: List[SensorAttribution] = Field(default_factory=list)
    # top_sensors_grad may be [{sensor, score}] or [[name, score]] tuples
    top_sensors_grad: List[Any] = Field(default_factory=list)
    top_sensors_direct: List[Any] = Field(default_factory=list)
    top_3_sensors: List[SensorAttribution] = Field(default_factory=list)
    attribution_method: str = "unknown"
    heatmap_path: Optional[str] = None
    latent_vector_2d: List[float] = Field(default_factory=list)
    inference_time_ms: float = 0.0
    # Meta added by the backend (not from ML engine)
    dataset: Optional[str] = None
    pass_number: Optional[int] = None


class InferenceStatus(BaseModel):
    status: str  # idle | initializing | running | stopped | error
    dataset: Optional[str] = None
    threshold: Optional[float] = None
    sensor_cols: Optional[List[str]] = None
    n_sensors: Optional[int] = None
    pass_number: int = 0
    total_windows: int = 0
    error: Optional[str] = None
    current_record: Optional[InferenceRecord] = None


# ---------------------------------------------------------------------------
# Control Requests
# ---------------------------------------------------------------------------

class StartInferenceRequest(BaseModel):
    dataset: str = "SWaT"
    emit_interval: float = Field(default=0.05, ge=0.0, le=5.0)
    threshold_pct: float = Field(default=99.0, ge=50.0, le=100.0)
    persistence_k: int = Field(default=2, ge=1, le=20)
    cooldown_k: int = Field(default=5, ge=1, le=50)
    max_rows: Optional[int] = Field(default=None, ge=1)


class AttackInjectRequest(BaseModel):
    sensor: str
    attack_type: str = Field(default="freeze", pattern="^(freeze|offset|noise)$")
    magnitude: float = Field(default=1.0, ge=0.0)
    duration_ticks: int = Field(default=100, ge=1, le=10000)

    @field_validator("attack_type")
    @classmethod
    def validate_attack_type(cls, v: str) -> str:
        allowed = {"freeze", "offset", "noise"}
        if v not in allowed:
            raise ValueError(f"attack_type must be one of {allowed}")
        return v


class AttackValidationSeriesRequest(BaseModel):
    """Request body for ML attack-strip simulation (validate_attack_injection parity)."""

    dataset: str = "SWaT"
    attack_type: str = Field(default="offset", pattern="^(freeze|offset|noise)$")
    sensor: Optional[str] = None
    n_rows: int = Field(default=500, ge=50, le=5000)
    attack_start: int = Field(default=150, ge=0)
    attack_end: int = Field(default=350, ge=2)

    @model_validator(mode="after")
    def _bounds(self) -> "AttackValidationSeriesRequest":
        if self.attack_start >= self.attack_end:
            raise ValueError("attack_start must be less than attack_end")
        if self.attack_end > self.n_rows:
            raise ValueError("attack_end must be less than or equal to n_rows")
        return self


class ThresholdUpdateRequest(BaseModel):
    threshold: float = Field(ge=0.0)


class IncidentFeedbackRequest(BaseModel):
    ground_truth: Optional[int] = Field(
        default=None,
        description="0 = false positive, 1 = true positive, null = clear label"
    )
    notes: Optional[str] = Field(default=None, max_length=2048)


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class IncidentResponse(BaseModel):
    id: int
    dataset: str
    start_time: str
    end_time: Optional[str]
    peak_score: float
    threshold: float
    duration_windows: int
    top_sensors: List[SensorAttribution]
    attribution_method: str
    heatmap_path: Optional[str]
    ground_truth: Optional[int]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_incident(cls, obj: Incident) -> "IncidentResponse":
        return cls(
            id=obj.id,
            dataset=obj.dataset,
            start_time=obj.start_time,
            end_time=obj.end_time,
            peak_score=obj.peak_score,
            threshold=obj.threshold,
            duration_windows=obj.duration_windows,
            top_sensors=[SensorAttribution(**s) for s in obj.top_sensors],
            attribution_method=obj.attribution_method,
            heatmap_path=obj.heatmap_path,
            ground_truth=obj.ground_truth,
            notes=obj.notes,
            created_at=obj.created_at,
        )


class DatasetInfo(BaseModel):
    key: str
    display_name: str
    n_sensors: Optional[int]
    checkpoint_path: str
    normal_csv: str
    attack_csv: str
    assets_ok: bool
    missing_files: List[str]


class SensorNode(BaseModel):
    id: str
    stage: str
    stage_short: str


class SensorEdge(BaseModel):
    source: str
    target: str
    weight: float


class SensorGraphResponse(BaseModel):
    dataset: str
    nodes: List[SensorNode]
    edges: List[SensorEdge]


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    inference_status: str
    dataset: Optional[str]
    db_ok: bool
    ml_src_ok: bool


class AttackTypeInfo(BaseModel):
    type: str
    description: str
    example_magnitude: float
