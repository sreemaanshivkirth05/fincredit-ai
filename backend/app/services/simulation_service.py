"""Persist frozen inputs only. No worker, inference, market fetch, or trade writes."""
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import hashlib
import json
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.holding import Holding
from app.models.simulation import SimulationRun, SimulationSnapshot
from app.schemas.simulation import SimulationCreate, SnapshotInputs


def utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def summary(run):
    return {"id": run.id, "title": run.title, "status": run.status,
            "version": run.version, "createdAt": utc(run.created_at)}


def detail(db: Session, run):
    snapshot = db.get(SimulationSnapshot, run.id)
    return {**summary(run), "snapshot": {"capturedAt": utc(snapshot.captured_at),
            "sha256": snapshot.sha256, "inputs": snapshot.inputs}}


def decimal_input(value):
    if value is None:
        return None
    try:
        number = Decimal(str(value))
        return str(number) if number.is_finite() else None
    except InvalidOperation:
        return None


def create_simulation(db: Session, user_id: int, body: SimulationCreate):
    config = body.configuration
    if (len(config.agentTypes) > settings.SIMULATION_MAX_AGENTS
            or config.rounds > settings.SIMULATION_MAX_ROUNDS
            or config.maxModelCalls > settings.SIMULATION_MAX_MODEL_CALLS):
        raise HTTPException(422, "Simulation configuration exceeds server limits")
    holdings = db.query(Holding).filter(Holding.user_id == user_id).order_by(Holding.id).limit(1001).all()
    if len(holdings) > 1000:
        raise HTTPException(422, "Portfolio exceeds the Phase 1 snapshot limit of 1000 holdings")
    captured = datetime.now(timezone.utc)
    provider = settings.SIMULATION_PROVIDER
    model = settings.SIMULATION_MODEL.strip() or (
        settings.OLLAMA_MODEL if provider == "ollama" else "Qwen/Qwen3-4B-Instruct-2507")
    inputs = SnapshotInputs(
        request=body, provider=provider, model=model,
        holdings=[{"holdingId": h.id, "ticker": h.ticker, "company": h.company,
                   "shares": decimal_input(h.shares), "averagePrice": decimal_input(h.avg_price),
                   "currentPrice": decimal_input(h.current_price), "currency": h.currency,
                   "sector": h.sector,
                   "sourceUpdatedAt": utc(h.updated_at) if h.updated_at else None} for h in holdings],
        limitations=["Configured only: no agents, inference, or financial simulation executed.",
                     "Stored portfolio inputs only; prices may be stale or missing. No market or SEC refresh.",
                     "Model identifier records configuration, not a verified connection or model version.",
                     "Non-finite or unavailable numeric inputs are stored as null; currencies are not combined."],
    ).model_dump(mode="json")
    encoded = json.dumps(inputs, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")
    if len(encoded) > 1024 * 1024:
        raise HTTPException(422, "Simulation snapshot exceeds the 1 MiB limit")
    run = SimulationRun(id=str(uuid4()), user_id=user_id, title=body.title,
                        status="configured", version="simulation-v1", created_at=captured)
    snapshot = SimulationSnapshot(run_id=run.id, captured_at=captured,
                                  sha256=hashlib.sha256(encoded).hexdigest(), inputs=inputs)
    try:
        db.add(run)
        db.flush()
        db.add(snapshot)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return detail(db, run)
