from fastapi import APIRouter

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("")
def get_reports():
    reports = [
        {
            "id": "RPT-1042",
            "company": "Microsoft",
            "ticker": "MSFT",
            "type": "Credit Risk + Filing Analysis",
            "status": "Approved",
            "grounding": 94,
            "unsupported": 0,
            "model": "ChatGPT API",
            "created": "Jun 15, 2026",
        },
        {
            "id": "RPT-1041",
            "company": "Tesla",
            "ticker": "TSLA",
            "type": "Red Flag Review",
            "status": "Needs Review",
            "grounding": 87,
            "unsupported": 2,
            "model": "ChatGPT API + Ollama",
            "created": "Jun 14, 2026",
        },
        {
            "id": "RPT-1040",
            "company": "NVIDIA",
            "ticker": "NVDA",
            "type": "Peer Benchmark",
            "status": "Draft",
            "grounding": 91,
            "unsupported": 1,
            "model": "ChatGPT API",
            "created": "Jun 13, 2026",
        },
        {
            "id": "RPT-1039",
            "company": "JPMorgan Chase",
            "ticker": "JPM",
            "type": "Portfolio Impact Memo",
            "status": "Approved",
            "grounding": 96,
            "unsupported": 0,
            "model": "ChatGPT API + Ollama",
            "created": "Jun 12, 2026",
        },
    ]

    report_quality = [
        {"report": "MSFT", "grounding": 94},
        {"report": "TSLA", "grounding": 87},
        {"report": "NVDA", "grounding": 91},
        {"report": "JPM", "grounding": 96},
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
    approved_reports = 12
    needs_review = 3
    avg_grounding = 92

    return {
        "totalReports": total_reports,
        "approvedReports": approved_reports,
        "needsReview": needs_review,
        "avgGrounding": avg_grounding,
        "reports": reports,
        "reportQuality": report_quality,
        "workflow": workflow,
        "message": "Reports API connected successfully",
    }