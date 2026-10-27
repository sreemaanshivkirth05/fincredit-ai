"""Authenticated configuration API. No execution or queue endpoints in Phase 1."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.simulation import SimulationRun
from app.models.user import User
from app.schemas.simulation import SimulationCreate, SimulationList, SimulationResponse
from app.services.simulation_service import create_simulation, detail, summary


def enabled_user(user: User = Depends(get_current_user)):
    if not settings.SIMULATION_ENABLED:
        raise HTTPException(404, "Simulation Lab is disabled")
    return user


router = APIRouter(prefix="/simulations", tags=["Simulation Lab"])


@router.post("", response_model=SimulationResponse, status_code=201)
def create(body: SimulationCreate, db: Session = Depends(get_db), user: User = Depends(enabled_user)):
    return create_simulation(db, user.id, body)


@router.get("", response_model=SimulationList)
def list_runs(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0),
              db: Session = Depends(get_db), user: User = Depends(enabled_user)):
    rows = db.query(SimulationRun).filter_by(user_id=user.id).order_by(
        SimulationRun.created_at.desc(), SimulationRun.id.desc()).offset(offset).limit(limit).all()
    return {"runs": [summary(row) for row in rows], "limit": limit, "offset": offset}


@router.get("/{run_id}", response_model=SimulationResponse)
def retrieve(run_id: UUID, db: Session = Depends(get_db), user: User = Depends(enabled_user)):
    run = db.query(SimulationRun).filter_by(id=str(run_id), user_id=user.id).first()
    if run is None:
        raise HTTPException(404, "Simulation not found")
    return detail(db, run)
