from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.agent_run import AgentRun
from app.models.report import Report
from app.models.report_document import ReportDocument
from app.services.pdf_service import build_report_pdf


def get_reports_data(db: Session):
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
            "detail": "Market snapshots, SEC fundamentals, portfolio holdings, and saved agent runs are collected.",
            "status": "Complete",
        },
        {
            "title": "LangGraph Agent Analysis",
            "detail": "Portfolio, market, SEC, risk, evidence, and LLM answer agents generate the research response.",
            "status": "Complete",
        },
        {
            "title": "Report Generation",
            "detail": "Saved LangGraph runs are converted into analyst report records and full report documents.",
            "status": "Complete",
        },
        {
            "title": "Governance Review",
            "detail": "Grounding score, unsupported claims, evidence, and model workflow metadata are available for audit review.",
            "status": "In Review",
        },
    ]

    total_reports = len(reports)
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


def generate_report_from_agent_run(agent_run_id: int, db: Session):
    agent_run = db.query(AgentRun).filter(AgentRun.id == agent_run_id).first()

    if not agent_run:
        raise HTTPException(status_code=404, detail="Agent run not found")

    ticker = agent_run.ticker or "PORTFOLIO"

    report_count = db.query(Report).count() + 1
    report_id = f"RPT-AI-{report_count:04d}"

    company_or_question = (
        f"{ticker} AI Risk Report"
        if ticker != "PORTFOLIO"
        else "Portfolio AI Risk Report"
    )

    created_date = datetime.utcnow().strftime("%Y-%m-%d")

    report = Report(
        report_id=report_id,
        company=company_or_question,
        ticker=ticker,
        report_type="AI Agent Risk Report",
        status="Needs Review",
        grounding=agent_run.grounding_score,
        unsupported=agent_run.unsupported_claims,
        model=agent_run.workflow,
        created=created_date,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    report_document = ReportDocument(
        report_id=report.report_id,
        agent_run_id=agent_run.id,
        ticker=agent_run.ticker,
        question=agent_run.question,
        answer=agent_run.answer,
        risk_drivers=agent_run.risk_drivers,
        evidence=agent_run.evidence,
        suggested_actions=agent_run.suggested_actions,
    )

    db.add(report_document)
    db.commit()

    return {
        "reportId": report.report_id,
        "agentRunId": agent_run.id,
        "ticker": report.ticker,
        "company": report.company,
        "reportType": report.report_type,
        "status": report.status,
        "grounding": report.grounding,
        "unsupported": report.unsupported,
        "model": report.model,
        "created": report.created,
        "message": f"Report {report.report_id} and full report document generated from agent run {agent_run.id}",
    }


def get_report_document(report_id: str, db: Session):
    report_document = (
        db.query(ReportDocument)
        .filter(ReportDocument.report_id == report_id)
        .order_by(ReportDocument.created_at.desc())
        .first()
    )

    if not report_document:
        raise HTTPException(status_code=404, detail="Report document not found")

    return {
        "reportId": report_document.report_id,
        "agentRunId": report_document.agent_run_id,
        "ticker": report_document.ticker,
        "question": report_document.question,
        "answer": report_document.answer,
        "riskDrivers": report_document.risk_drivers,
        "evidence": report_document.evidence,
        "suggestedActions": report_document.suggested_actions,
        "createdAt": report_document.created_at,
        "message": f"Report document {report_id} loaded from PostgreSQL",
    }


def get_report_pdf(report_id: str, db: Session):
    report_document = (
        db.query(ReportDocument)
        .filter(ReportDocument.report_id == report_id)
        .order_by(ReportDocument.created_at.desc())
        .first()
    )

    if not report_document:
        raise HTTPException(status_code=404, detail="Report document not found")

    return build_report_pdf(report_document)


def update_report_status(report_id: str, status: str, db: Session):
    allowed_statuses = {"Approved", "Needs Review", "Rejected"}

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Allowed statuses: Approved, Needs Review, Rejected",
        )

    report = db.query(Report).filter(Report.report_id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = status

    db.commit()
    db.refresh(report)

    return {
        "reportId": report.report_id,
        "status": report.status,
        "message": f"Report {report.report_id} status updated to {report.status}",
    }