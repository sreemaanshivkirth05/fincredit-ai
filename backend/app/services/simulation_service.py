"""User-scoped Simulation Lab configuration and execution-query services."""
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import hashlib
import json
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.holding import Holding
from app.models.simulation import (
    SimulationAction, SimulationAgent, SimulationAuditEvent, SimulationRound,
    SimulationRun, SimulationSnapshot,
)
from app.services.model_provider import HF_MODEL_ID
from app.schemas.simulation import SimulationCreate, SnapshotInputs


def utc(value):
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def _configuration(run, db):
    snapshot = db.get(SimulationSnapshot, run.id)
    return snapshot, snapshot.inputs["request"]["configuration"]


def progress(db: Session, run: SimulationRun):
    snapshot, config = _configuration(run, db)
    completed_rounds = db.query(func.count(SimulationRound.id)).filter_by(
        run_id=run.id, status="completed"
    ).scalar() or 0
    actions = db.query(func.count(SimulationAction.id)).filter_by(run_id=run.id).scalar() or 0
    agent_count = len(config["agentTypes"])
    return {
        "completedRounds": completed_rounds,
        "totalRounds": config["rounds"],
        "completedActions": actions,
        "totalPlannedActions": agent_count * config["rounds"],
    }


def summary(run):
    return {
        "id": run.id,
        "title": run.title,
        "status": run.status,
        "version": run.version,
        "createdAt": utc(run.created_at),
        "updatedAt": utc(run.updated_at or run.created_at),
        "startedAt": utc(run.started_at),
        "finishedAt": utc(run.finished_at),
        "cancellationRequested": bool(run.cancel_requested),
        "modelCalls": run.model_calls or 0,
    }


def detail(db: Session, run):
    snapshot = db.get(SimulationSnapshot, run.id)
    return {
        **summary(run),
        "snapshot": {
            "capturedAt": utc(snapshot.captured_at),
            "sha256": snapshot.sha256,
            "inputs": snapshot.inputs,
        },
        "progress": progress(db, run),
        "result": run.result or {},
    }


def execution_detail(db: Session, run):
    agents = {
        row.id: row.agent_type
        for row in db.query(SimulationAgent).filter_by(run_id=run.id).all()
    }
    rounds = []
    for item in db.query(SimulationRound).filter_by(run_id=run.id).order_by(
            SimulationRound.round_number).all():
        actions = db.query(SimulationAction).filter_by(round_id=item.id).order_by(
            SimulationAction.created_at, SimulationAction.id).all()
        rounds.append({
            "roundNumber": item.round_number,
            "status": item.status,
            "startedAt": utc(item.started_at),
            "completedAt": utc(item.completed_at),
            "checkpoint": item.checkpoint or {},
            "actions": [{
                "id": action.id,
                "roundNumber": action.round_number,
                "agentType": agents[action.agent_id],
                "action": action.action,
                "ticker": action.ticker,
                "allocationIntentPct": action.allocation_intent_pct,
                "confidence": action.confidence,
                "rationale": action.rationale,
                "decisionDetail": action.decision_detail or {},
                "evidenceIds": action.evidence_ids,
                "uncertainties": action.uncertainties,
                "provider": action.provider,
                "model": action.model,
                "truncationNotice": action.truncation_notice,
                "createdAt": utc(action.created_at),
            } for action in actions],
        })
    return {"run": detail(db, run), "rounds": rounds}


def decimal_input(value):
    if value is None:
        return None
    try:
        number = Decimal(str(value))
        return str(number) if number.is_finite() else None
    except InvalidOperation:
        return None


def canonical_snapshot(inputs):
    return json.dumps(
        inputs, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def snapshot_is_valid(snapshot):
    return hashlib.sha256(canonical_snapshot(snapshot.inputs)).hexdigest() == snapshot.sha256


def add_event(db: Session, run_id: str, event_type: str, payload=None):
    sequence = (db.query(func.max(SimulationAuditEvent.sequence)).filter_by(
        run_id=run_id).scalar() or 0) + 1
    event = SimulationAuditEvent(
        id=str(uuid4()), run_id=run_id, sequence=sequence,
        event_type=event_type, payload=payload or {},
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    return event


def create_simulation(db: Session, user_id: int, body: SimulationCreate):
    config = body.configuration
    if (len(config.agentTypes) > settings.SIMULATION_MAX_AGENTS
            or config.rounds > settings.SIMULATION_MAX_ROUNDS
            or config.maxModelCalls > settings.SIMULATION_MAX_MODEL_CALLS):
        raise HTTPException(422, "Simulation configuration exceeds server limits")
    holdings = db.query(Holding).filter(Holding.user_id == user_id).order_by(
        Holding.id).limit(1001).all()
    if len(holdings) > 1000:
        raise HTTPException(422, "Portfolio exceeds the snapshot limit of 1000 holdings")
    captured = datetime.now(timezone.utc)
    provider = settings.SIMULATION_PROVIDER
    model = settings.SIMULATION_MODEL.strip() or (
        settings.OLLAMA_MODEL if provider == "ollama"
        else HF_MODEL_ID
    )
    inputs = SnapshotInputs(
        request=body,
        provider=provider,
        model=model,
        holdings=[{
            "holdingId": holding.id,
            "ticker": holding.ticker,
            "company": holding.company,
            "shares": decimal_input(holding.shares),
            "averagePrice": decimal_input(holding.avg_price),
            "currentPrice": decimal_input(holding.current_price),
            "currency": holding.currency,
            "sector": holding.sector,
            "sourceUpdatedAt": utc(holding.updated_at) if holding.updated_at else None,
        } for holding in holdings],
        limitations=[
            "Execution begins only after an explicit authenticated start request.",
            "Agent actions are simulated research positions and never place trades.",
            "Stored portfolio inputs only; prices may be stale or missing. No market or SEC refresh.",
            "Model identifier records configuration; each successful action records the actual provider response.",
            "Non-finite or unavailable numeric inputs are stored as null; currencies are not combined.",
        ],
    ).model_dump(mode="json")
    encoded = canonical_snapshot(inputs)
    if len(encoded) > 1024 * 1024:
        raise HTTPException(422, "Simulation snapshot exceeds the 1 MiB limit")
    run = SimulationRun(
        id=str(uuid4()), user_id=user_id, title=body.title,
        status="configured", version="simulation-v2", created_at=captured,
        updated_at=captured, cancel_requested=False, model_calls=0, result={},
    )
    snapshot = SimulationSnapshot(
        run_id=run.id, captured_at=captured,
        sha256=hashlib.sha256(encoded).hexdigest(), inputs=inputs,
    )
    try:
        db.add(run)
        db.flush()
        db.add(snapshot)
        db.commit()
        db.refresh(run)
    except Exception:
        db.rollback()
        raise
    return detail(db, run)


def start_simulation(db: Session, user_id: int, run_id: str):
    run = db.query(SimulationRun).filter_by(id=run_id, user_id=user_id).with_for_update().first()
    if run is None:
        raise HTTPException(404, "Simulation not found")
    if run.status in ("queued", "running"):
        return detail(db, run)
    if run.status != "configured":
        raise HTTPException(409, f"Simulation cannot start from {run.status} status")
    snapshot = db.get(SimulationSnapshot, run.id)
    if not snapshot_is_valid(snapshot):
        raise HTTPException(409, "Simulation snapshot integrity check failed")
    active = db.query(SimulationRun.id).filter(
        SimulationRun.user_id == user_id,
        SimulationRun.status.in_(("queued", "running")),
        SimulationRun.id != run.id,
    ).first()
    if active:
        raise HTTPException(409, "Another simulation is already active for this user")
    now = datetime.now(timezone.utc)
    run.status = "queued"
    run.version = "simulation-v2"
    run.updated_at = now
    run.cancel_requested = False
    run.result = {}
    add_event(db, run.id, "run_queued", {
        "provider": snapshot.inputs["provider"],
        "model": snapshot.inputs["model"],
    })
    try:
        db.commit()
        db.refresh(run)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Another simulation is already active for this user") from None
    return detail(db, run)


def cancel_simulation(db: Session, user_id: int, run_id: str):
    run = db.query(SimulationRun).filter_by(id=run_id, user_id=user_id).with_for_update().first()
    if run is None:
        raise HTTPException(404, "Simulation not found")
    now = datetime.now(timezone.utc)
    if run.status == "cancelled":
        return detail(db, run)
    if run.status == "queued":
        run.status = "cancelled"
        run.cancel_requested = True
        run.updated_at = now
        run.finished_at = now
        run.result = {"summary": "Cancelled before execution began."}
        add_event(db, run.id, "run_cancelled", {"stage": "queued"})
    elif run.status == "running":
        run.cancel_requested = True
        run.updated_at = now
        add_event(db, run.id, "cancellation_requested", {})
    else:
        raise HTTPException(409, f"Simulation cannot be cancelled from {run.status} status")
    db.commit()
    db.refresh(run)
    return detail(db, run)


def list_events(db: Session, run_id: str, limit: int, offset: int):
    rows = db.query(SimulationAuditEvent).filter_by(run_id=run_id).order_by(
        SimulationAuditEvent.sequence).offset(offset).limit(limit).all()
    return {
        "events": [{
            "sequence": row.sequence,
            "eventType": row.event_type,
            "payload": row.payload or {},
            "createdAt": utc(row.created_at),
        } for row in rows],
        "limit": limit,
        "offset": offset,
    }
