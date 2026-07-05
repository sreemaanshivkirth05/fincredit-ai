from sqlalchemy.orm import Session

from app.models.agent_run import AgentRun
from app.models.holding import Holding
from app.models.market_snapshot import MarketSnapshot
from app.models.report import Report
from app.models.sec_fundamental import SecFundamental


def _format_currency(value: float | int | None):
    if value is None:
        return "$0"

    if value >= 1_000_000_000_000:
        return f"${value / 1_000_000_000_000:.2f}T"

    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.2f}B"

    if value >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"

    return f"${value:,.0f}"


def _safe_average(values: list[int]):
    if not values:
        return 0

    return round(sum(values) / len(values))


def _get_holding_value(holding):
    possible_value_fields = [
        "value",
        "market_value",
        "current_value",
        "position_value",
    ]

    for field in possible_value_fields:
        value = getattr(holding, field, None)
        if value is not None:
            return float(value)

    shares = getattr(holding, "shares", None)
    price = getattr(holding, "current_price", None)

    if shares is not None and price is not None:
        return float(shares) * float(price)

    return 0.0


def _get_holding_risk_score(holding):
    possible_risk_fields = [
        "risk_score",
        "riskScore",
        "risk",
        "risk_rating",
    ]

    for field in possible_risk_fields:
        value = getattr(holding, field, None)
        if value is not None:
            try:
                return int(value)
            except ValueError:
                return 0

    return 0


def get_dashboard_data(db: Session):
    holdings = db.query(Holding).all()
    reports = db.query(Report).order_by(Report.id.desc()).all()

    latest_agent_runs = (
        db.query(AgentRun)
        .order_by(AgentRun.created_at.desc())
        .limit(5)
        .all()
    )

    latest_market_snapshots = (
        db.query(MarketSnapshot)
        .order_by(MarketSnapshot.fetched_at.desc())
        .limit(5)
        .all()
    )

    latest_sec_fundamentals = (
        db.query(SecFundamental)
        .order_by(SecFundamental.fetched_at.desc())
        .limit(5)
        .all()
    )

    portfolio_value = sum(_get_holding_value(holding) for holding in holdings)
    portfolio_count = len(holdings)

    risk_scores = [_get_holding_risk_score(holding) for holding in holdings]
    risk_scores = [score for score in risk_scores if score > 0]
    average_risk_score = _safe_average(risk_scores)

    total_reports = len(reports)
    approved_reports = sum(1 for report in reports if report.status == "Approved")
    needs_review_reports = sum(
        1 for report in reports if report.status == "Needs Review"
    )
    rejected_reports = sum(1 for report in reports if report.status == "Rejected")

    grounding_scores = [int(report.grounding or 0) for report in reports]
    grounding_scores = [score for score in grounding_scores if score > 0]
    avg_grounding = _safe_average(grounding_scores)

    unsupported_claims = sum(int(report.unsupported or 0) for report in reports)

    metrics = [
        {
            "label": "Portfolio Value",
            "value": _format_currency(portfolio_value),
            "detail": f"{portfolio_count} active holdings tracked",
        },
        {
            "label": "Average Risk Score",
            "value": str(average_risk_score),
            "detail": "Calculated from available portfolio risk fields",
        },
        {
            "label": "AI Reports",
            "value": str(total_reports),
            "detail": f"{approved_reports} approved, {needs_review_reports} needs review, {rejected_reports} rejected",
        },
        {
            "label": "Grounding Score",
            "value": f"{avg_grounding}%",
            "detail": f"{unsupported_claims} unsupported claims across reports",
        },
    ]

    latest_reports_response = [
        {
            "id": report.report_id,
            "ticker": report.ticker,
            "company": report.company,
            "status": report.status,
            "grounding": report.grounding,
            "created": report.created,
        }
        for report in reports[:5]
    ]

    latest_agent_runs_response = [
        {
            "id": run.id,
            "question": run.question,
            "ticker": run.ticker,
            "groundingScore": run.grounding_score,
            "unsupportedClaims": run.unsupported_claims,
            "createdAt": run.created_at,
        }
        for run in latest_agent_runs
    ]

    latest_market_snapshots_response = [
        {
            "ticker": snapshot.ticker,
            "companyName": snapshot.company_name,
            "currentPrice": snapshot.current_price,
            "previousClose": snapshot.previous_close,
            "marketCap": snapshot.market_cap,
            "fetchedAt": snapshot.fetched_at,
        }
        for snapshot in latest_market_snapshots
    ]

    latest_sec_fundamentals_response = [
        {
            "ticker": sec.ticker,
            "companyName": sec.company_name,
            "revenue": sec.revenue,
            "netIncome": sec.net_income,
            "assets": sec.assets,
            "liabilities": sec.liabilities,
            "fiscalYear": sec.fiscal_year,
            "filed": sec.filed,
            "fetchedAt": sec.fetched_at,
        }
        for sec in latest_sec_fundamentals
    ]

    return {
        "portfolioValue": portfolio_value,
        "portfolioCount": portfolio_count,
        "averageRiskScore": average_risk_score,
        "totalReports": total_reports,
        "approvedReports": approved_reports,
        "needsReviewReports": needs_review_reports,
        "rejectedReports": rejected_reports,
        "avgGrounding": avg_grounding,
        "unsupportedClaims": unsupported_claims,
        "metrics": metrics,
        "latestReports": latest_reports_response,
        "latestAgentRuns": latest_agent_runs_response,
        "latestMarketSnapshots": latest_market_snapshots_response,
        "latestSecFundamentals": latest_sec_fundamentals_response,
        "message": "Executive dashboard loaded from PostgreSQL successfully",
    }