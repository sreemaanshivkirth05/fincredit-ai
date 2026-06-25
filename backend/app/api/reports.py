from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.reports import (
    GeneratedReportResponse,
    ReportDocumentResponse,
    ReportsResponse,
)
from app.services.reports_service import (
    generate_report_from_agent_run,
    get_report_document,
    get_reports_data,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=ReportsResponse)
def get_reports(db: Session = Depends(get_db)):
    return get_reports_data(db)


@router.post(
    "/generate-from-agent-run/{agent_run_id}",
    response_model=GeneratedReportResponse,
)
def generate_from_agent_run(agent_run_id: int, db: Session = Depends(get_db)):
    return generate_report_from_agent_run(agent_run_id, db)


@router.get("/{report_id}/document", response_model=ReportDocumentResponse)
def get_report_document_route(report_id: str, db: Session = Depends(get_db)):
    return get_report_document(report_id, db)