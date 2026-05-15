"""
routers/incidents.py
====================
CRUD endpoints for persisted incidents + operator feedback.
"""

from __future__ import annotations

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Incident,
    IncidentFeedbackRequest,
    IncidentResponse,
    SensorAttribution,
)

log = logging.getLogger("routers.incidents")

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    dataset: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> List[IncidentResponse]:
    """
    List persisted incidents, newest first.
    Optionally filter by dataset key.
    """
    q = select(Incident).order_by(desc(Incident.created_at)).limit(limit).offset(offset)
    if dataset:
        q = q.where(Incident.dataset == dataset)
    result = await db.execute(q)
    incidents = result.scalars().all()
    return [IncidentResponse.from_orm_incident(inc) for inc in incidents]


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
) -> IncidentResponse:
    """Fetch a single incident by ID."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(404, detail=f"Incident {incident_id} not found.")
    return IncidentResponse.from_orm_incident(incident)


@router.patch("/{incident_id}/feedback", response_model=IncidentResponse)
async def update_feedback(
    incident_id: int,
    request: IncidentFeedbackRequest,
    db: AsyncSession = Depends(get_db),
) -> IncidentResponse:
    """
    Submit operator feedback for an incident.
    ground_truth: 0 = false positive, 1 = true positive, null = clear label.
    """
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(404, detail=f"Incident {incident_id} not found.")

    if request.ground_truth is not None and request.ground_truth not in (0, 1):
        raise HTTPException(422, detail="ground_truth must be 0, 1, or null.")

    incident.ground_truth = request.ground_truth
    if request.notes is not None:
        incident.notes = request.notes

    await db.commit()
    await db.refresh(incident)
    log.info("Feedback saved for incident %d: gt=%s", incident_id, request.ground_truth)
    return IncidentResponse.from_orm_incident(incident)


@router.delete("/{incident_id}")
async def delete_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete an incident record."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(404, detail=f"Incident {incident_id} not found.")
    await db.delete(incident)
    await db.commit()
    return {"deleted": incident_id}


@router.get("/stats/summary")
async def incident_stats(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Return aggregate statistics across all incidents:
    total count, by dataset, by feedback label.
    """
    from sqlalchemy import func, case, Integer

    result = await db.execute(
        select(
            Incident.dataset,
            func.count(Incident.id).label("total"),
            func.avg(Incident.peak_score).label("avg_peak_score"),
            func.sum(
                case((Incident.ground_truth == 1, 1), else_=0)
            ).label("true_positives"),
            func.sum(
                case((Incident.ground_truth == 0, 1), else_=0)
            ).label("false_positives"),
        ).group_by(Incident.dataset)
    )
    rows = result.all()
    return {
        "by_dataset": [
            {
                "dataset": r.dataset,
                "total": r.total,
                "avg_peak_score": round(float(r.avg_peak_score or 0.0), 4),
                "true_positives": int(r.true_positives or 0),
                "false_positives": int(r.false_positives or 0),
            }
            for r in rows
        ]
    }
