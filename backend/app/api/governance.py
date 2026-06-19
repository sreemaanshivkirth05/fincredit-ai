from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/governance", tags=["Governance"])


@router.get("")
def get_governance(db: Session = Depends(get_db)):
    model_usage = [
        {
            "model": "ChatGPT API",
            "task": "Final reasoning, report writing, investment thesis synthesis",
            "calls": 42,
            "cost": 3.84,
            "status": "Active",
        },
        {
            "model": "Ollama Qwen Local",
            "task": "Sentiment classification, red flag tagging, filing extraction",
            "calls": 128,
            "cost": 0.00,
            "status": "Active",
        },
    ]

    quality_metrics = [
        {"metric": "Citation Coverage", "value": 91},
        {"metric": "Grounding Score", "value": 92},
        {"metric": "Model Agreement", "value": 84},
        {"metric": "Unsupported Claim Rate", "value": 6},
    ]

    agent_runs = [
        {
            "agent": "Credit Risk Agent",
            "company": "TSLA",
            "status": "Completed",
            "model": "ChatGPT API",
            "duration": "18.4s",
            "grounding": 87,
        },
        {
            "agent": "Filing Analysis Agent",
            "company": "MSFT",
            "status": "Completed",
            "model": "Ollama + ChatGPT API",
            "duration": "22.1s",
            "grounding": 94,
        },
        {
            "agent": "News Sentiment Agent",
            "company": "NVDA",
            "status": "Completed",
            "model": "Ollama Qwen Local",
            "duration": "8.7s",
            "grounding": 89,
        },
        {
            "agent": "Report Writer Agent",
            "company": "JPM",
            "status": "In Review",
            "model": "ChatGPT API",
            "duration": "31.5s",
            "grounding": 96,
        },
    ]

    data_sources = [
        {
            "source": "SEC EDGAR",
            "status": "Healthy",
            "lastSync": "2 minutes ago",
            "latency": "420ms",
        },
        {
            "source": "SEC Company Facts",
            "status": "Healthy",
            "lastSync": "5 minutes ago",
            "latency": "510ms",
        },
        {
            "source": "Yahoo Finance",
            "status": "Healthy",
            "lastSync": "1 minute ago",
            "latency": "380ms",
        },
        {
            "source": "GDELT News",
            "status": "Delayed",
            "lastSync": "18 minutes ago",
            "latency": "1.8s",
        },
    ]

    audit_log_rows = db.query(AuditLog).order_by(AuditLog.id.desc()).all()

    audit_logs = [
        {
            "time": log.time,
            "event": log.event,
            "detail": log.detail,
            "severity": log.severity,
        }
        for log in audit_log_rows
    ]

    return {
        "totalModelCalls": 170,
        "estimatedCost": 3.84,
        "avgGrounding": 92,
        "auditEvents": len(audit_logs),
        "modelUsage": model_usage,
        "qualityMetrics": quality_metrics,
        "agentRuns": agent_runs,
        "dataSources": data_sources,
        "auditLogs": audit_logs,
        "message": "Governance API connected to PostgreSQL audit logs successfully",
    }