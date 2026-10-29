from datetime import datetime
from uuid import uuid4
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.security import get_current_user
from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.models.committee_run import CommitteeRun
from app.services.model_provider import HF_MODEL_ID, HF_SENTIMENT_MODEL_ID

router = APIRouter(prefix="/committee", tags=["Investment Committee"])

class Request(BaseModel):
    question: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=2000)]
    ticker: Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True, pattern=r"^[A-Z0-9.^=-]{0,20}$")] = ""


def serialize(run):
    return {"id": run.id, "question": run.question, "ticker": run.ticker, "status": run.status,
            "version": run.version, "createdAt": run.created_at.isoformat() + "Z",
            "updatedAt": run.updated_at.isoformat() + "Z", "events": run.events,
            "snapshot": run.snapshot, "result": run.result}


def owned(db, user, run_id):
    run = db.query(CommitteeRun).filter_by(id=run_id, user_id=user.id).first()
    if not run:
        raise HTTPException(404, "Research run not found")
    return run


@router.get("/configuration")
def configuration(user: User = Depends(get_current_user)):
    return {"provider": settings.LLM_PROVIDER, "model": settings.OLLAMA_MODEL if settings.LLM_PROVIDER == "ollama" else HF_MODEL_ID,
            "sentimentModel": HF_SENTIMENT_MODEL_ID if settings.LLM_PROVIDER == "huggingface" else None,
            "cloudCredentialsConfigured": bool(settings.HF_TOKEN.get_secret_value()) and len(settings.FINCREDIT_SPACE_KEY.get_secret_value()) >= 32,
            "fallbackEnabled": settings.HF_ALLOW_OLLAMA_FALLBACK, "liveConnectionVerified": False,
            "execution": "Paper research only; no autonomous orders", "version": "committee-v1"}


@router.post("/runs", status_code=202)
def create_run(body: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # DB partial unique index also closes the concurrent-request race.
    if db.query(CommitteeRun).filter(CommitteeRun.user_id == user.id, CommitteeRun.status.in_(["queued", "running"])).first():
        raise HTTPException(409, "A committee review is already active. Open it from saved research.")
    run = CommitteeRun(id=str(uuid4()), user_id=user.id, question=body.question, ticker=body.ticker or None,
                       events=[], snapshot={}, result={})
    db.add(run)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A committee review is already active") from None
    db.refresh(run)
    return serialize(run)


@router.get("/runs")
def list_runs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(CommitteeRun).filter_by(user_id=user.id).order_by(CommitteeRun.created_at.desc()).limit(50).all()
    return [{k: v for k, v in serialize(row).items() if k not in ("snapshot", "result", "events")} for row in rows]


@router.get("/runs/{run_id}")
def get_run(run_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return serialize(owned(db, user, run_id))


@router.post("/runs/{run_id}/cancel")
def cancel_run(run_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    run = owned(db, user, run_id)
    # Conditional update avoids replacing a completed run during concurrent completion.
    db.query(CommitteeRun).filter(CommitteeRun.id == run.id, CommitteeRun.status.in_(["queued", "running"])).update(
        {"status": "cancelled", "updated_at": datetime.utcnow()}, synchronize_session=False)
    db.commit()
    db.refresh(run)
    return serialize(run)
