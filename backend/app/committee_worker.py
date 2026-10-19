"""Single CPU-friendly polling worker. Run separately from the API.
PostgreSQL skip-locked claims allow multiple workers without duplicate execution.
Stale runs fail explicitly instead of silently replaying model requests.
"""
import logging
import time
from datetime import datetime, timedelta
from app.db.database import SessionLocal
from app.models.committee_run import CommitteeRun
from app.services.committee_service import execute, Cancelled

log = logging.getLogger(__name__)


def tick():
    with SessionLocal() as db:
        db.query(CommitteeRun).filter(CommitteeRun.status == "running", CommitteeRun.updated_at < datetime.utcnow() - timedelta(minutes=15)).update(
            {"status": "failed", "result": {"error": "Worker interrupted or exceeded its time budget. Start a new review."}}, synchronize_session=False)
        db.commit()
        run = db.query(CommitteeRun).filter_by(status="queued").order_by(CommitteeRun.created_at).with_for_update(skip_locked=True).first()
        if not run:
            return False
        run.status = "running"
        run.updated_at = datetime.utcnow()
        db.commit()
        try:
            execute(db, run)
        except Cancelled:
            db.rollback()
        except Exception:
            db.rollback()
            # Never expose raw exceptions: providers may include credentials or prompt data.
            db.query(CommitteeRun).filter_by(id=run.id, status="running").update(
                {"status": "failed", "result": {"error": "Research could not complete. Check server configuration and start a new review."}}, synchronize_session=False)
            db.commit()
            log.error("Committee run failed: %s", run.id)
        return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    while True:
        try:
            if not tick():
                time.sleep(2)
        except Exception:
            log.error("Committee worker cannot access its queue; retrying.")
            time.sleep(5)
