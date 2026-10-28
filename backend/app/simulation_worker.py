"""Single, CPU-friendly worker for bounded Simulation Lab runs.

PostgreSQL row locks prevent duplicate claims. Interrupted runs are failed
explicitly because model calls are never replayed automatically.
"""
import logging
import time
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.simulation_config import execution_settings
from app.db.database import SessionLocal
from app.models.simulation import SimulationRun
from app.services.simulation_orchestrator import (
    SimulationCancelled, SimulationExecutionError, execute_simulation,
)
from app.services.simulation_service import add_event


log = logging.getLogger(__name__)


def _now():
    return datetime.now(timezone.utc)


def fail_stale_runs(db):
    cutoff = _now() - timedelta(seconds=execution_settings.SIMULATION_STALE_SECONDS)
    stale = db.query(SimulationRun).filter(
        SimulationRun.status == "running",
        SimulationRun.updated_at < cutoff,
    ).with_for_update(skip_locked=True).all()
    for run in stale:
        run.status = "failed"
        run.finished_at = _now()
        run.updated_at = run.finished_at
        run.result = {
            "errorCode": "worker_interrupted",
            "error": "Simulation worker was interrupted. Start a new simulation; model calls are not replayed.",
            "modelCalls": run.model_calls,
            "noPortfolioWrites": True,
        }
        add_event(db, run.id, "run_failed", {"errorCode": "worker_interrupted"})
    if stale:
        db.commit()
    return len(stale)


def claim_next(db):
    run = db.query(SimulationRun).filter_by(status="queued").order_by(
        SimulationRun.created_at, SimulationRun.id
    ).with_for_update(skip_locked=True).first()
    if run is None:
        return None
    now = _now()
    run.status = "running"
    run.started_at = now
    run.updated_at = now
    add_event(db, run.id, "run_started", {})
    db.commit()
    db.refresh(run)
    return run


def tick():
    if not settings.SIMULATION_ENABLED:
        return False
    with SessionLocal() as db:
        fail_stale_runs(db)
        run = claim_next(db)
        if run is None:
            return False
        run_id = run.id
        try:
            execute_simulation(db, run)
        except SimulationCancelled:
            db.rollback()
            log.info("Simulation %s cancelled", run_id)
        except SimulationExecutionError as error:
            db.rollback()
            log.warning("Simulation %s failed safely: %s", run_id, error.code)
        except Exception:
            db.rollback()
            log.exception("Simulation %s failed with an unexpected internal error", run_id)
        return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    while True:
        try:
            if not tick():
                time.sleep(2)
        except Exception:
            log.exception("Simulation worker cannot access its queue; retrying")
            time.sleep(5)
