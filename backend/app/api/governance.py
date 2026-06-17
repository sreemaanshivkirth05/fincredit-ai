from fastapi import APIRouter

router = APIRouter(prefix="/governance", tags=["Governance"])


@router.get("")
def get_governance():
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

    audit_logs = [
        {
            "time": "10:42 AM",
            "event": "Report generated",
            "detail": "TSLA red flag review generated with 87% grounding score.",
            "severity": "Info",
        },
        {
            "time": "10:39 AM",
            "event": "Unsupported claim detected",
            "detail": "Two statements required analyst review before approval.",
            "severity": "Warning",
        },
        {
            "time": "10:31 AM",
            "event": "Local model routed",
            "detail": "Ollama handled 18 sentiment classification tasks.",
            "severity": "Info",
        },
        {
            "time": "10:24 AM",
            "event": "Data source delay",
            "detail": "GDELT news refresh exceeded latency threshold.",
            "severity": "Warning",
        },
    ]

    return {
        "totalModelCalls": 170,
        "estimatedCost": 3.84,
        "avgGrounding": 92,
        "auditEvents": 24,
        "modelUsage": model_usage,
        "qualityMetrics": quality_metrics,
        "agentRuns": agent_runs,
        "dataSources": data_sources,
        "auditLogs": audit_logs,
        "message": "Governance API connected successfully",
    }