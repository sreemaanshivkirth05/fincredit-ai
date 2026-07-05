from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.reports import (
    GeneratedReportResponse,
    ReportDocumentResponse,
    ReportsByTickerResponse,
    ReportsResponse,
    ReportStatusHistoryResponse,
    UpdateReportStatusRequest,
    UpdateReportStatusResponse,
)
from app.services.reports_service import (
    generate_latest_report_for_ticker,
    generate_report_from_agent_run,
    get_report_document,
    get_report_pdf,
    get_report_status_history,
    get_reports_by_ticker,
    get_reports_data,
    update_report_status,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=ReportsResponse)
def get_reports(db: Session = Depends(get_db)):
    return get_reports_data(db)


@router.get(
    "/by-ticker/{ticker}",
    response_model=ReportsByTickerResponse,
)
def get_reports_by_ticker_route(ticker: str, db: Session = Depends(get_db)):
    return get_reports_by_ticker(ticker, db)


@router.post(
    "/generate-from-agent-run/{agent_run_id}",
    response_model=GeneratedReportResponse,
)
def generate_from_agent_run(agent_run_id: int, db: Session = Depends(get_db)):
    return generate_report_from_agent_run(agent_run_id, db)


@router.post(
    "/generate-latest-for-ticker/{ticker}",
    response_model=GeneratedReportResponse,
)
def generate_latest_for_ticker(ticker: str, db: Session = Depends(get_db)):
    return generate_latest_report_for_ticker(ticker, db)


@router.get("/{report_id}/document", response_model=ReportDocumentResponse)
def get_report_document_route(report_id: str, db: Session = Depends(get_db)):
    return get_report_document(report_id, db)


@router.patch("/{report_id}/status", response_model=UpdateReportStatusResponse)
def update_report_status_route(
    report_id: str,
    request: UpdateReportStatusRequest,
    db: Session = Depends(get_db),
):
    return update_report_status(report_id, request.status, request.comment, db)


@router.get(
    "/{report_id}/status-history",
    response_model=ReportStatusHistoryResponse,
)
def get_report_status_history_route(report_id: str, db: Session = Depends(get_db)):
    return get_report_status_history(report_id, db)


@router.get("/{report_id}/pdf")
def get_report_pdf_route(report_id: str, db: Session = Depends(get_db)):
    pdf_buffer = get_report_pdf(report_id, db)

    filename = f"{report_id}_FinCredit_AI_Report.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )