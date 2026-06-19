from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.report import Report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("")
def get_reports(db: Session = Depends(get_db)):
    report_rows = db.query(Report).order_by(Report.id.desc()).all()

    reports = [
        {
            "id": report.report_id,
            "company": report.company,
            "ticker": report.ticker,
            "type": report.report_type,
            "status": report.status,
            "grounding": report.grounding,
            "unsupported": report.unsupported,
            "model": report.model,
            "created": report.created,
        }
        for report in report_rows
    ]

    report_quality = [
        {
            "report": report.ticker,
            "grounding": report.grounding,
        }
        for report in report_rows
    ]

    workflow = [
        {
            "title": "Data Collection",
            "detail": "SEC filings, financial ratios, portfolio exposure, and news radar data collected.",
            "status": "Complete",
        },
        {
            "title": "Agent Analysis",
            "detail": "Specialist agents generated credit risk, filing, peer, and red flag analysis.",
            "status": "Complete",
        },
        {
            "title": "Citation Validation",
            "detail": "Evidence panel checked claims, source coverage, and unsupported statements.",
            "status": "Complete",
        },
        {
            "title": "Analyst Approval",
            "detail": "Reports can be approved, revised, exported as PDF, or sent as an email digest.",
            "status": "In Review",
        },
    ]

    total_reports = 18
    approved_reports = sum(1 for report in reports if report["status"] == "Approved")
    needs_review = sum(1 for report in reports if report["status"] == "Needs Review")

    avg_grounding = (
        round(sum(report["grounding"] for report in reports) / len(reports))
        if reports
        else 0
    )

    return {
        "totalReports": total_reports,
        "approvedReports": approved_reports,
        "needsReview": needs_review,
        "avgGrounding": avg_grounding,
        "reports": reports,
        "reportQuality": report_quality,
        "workflow": workflow,
        "message": "Reports API connected to PostgreSQL successfully",
    }