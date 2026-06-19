from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.company_profile import CompanyProfile


def get_company_data(ticker: str, db: Session):
    ticker_upper = ticker.upper()

    company = (
        db.query(CompanyProfile)
        .filter(CompanyProfile.ticker == ticker_upper)
        .first()
    )

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {
        "ticker": company.ticker,
        "company": company.company,
        "sector": company.sector,
        "risk": company.risk,
        "riskScore": company.risk_score,
        "sentiment": company.sentiment,
        "summary": company.summary,
        "marketCap": company.market_cap,
        "revenue": company.revenue,
        "debtToEquity": company.debt_to_equity,
        "profitMargin": company.profit_margin,
        "groundingScore": company.grounding_score,
        "unsupportedClaims": company.unsupported_claims,
        "riskTrend": company.risk_trend,
        "redFlags": company.red_flags,
        "filingSignals": company.filing_signals,
        "peerBenchmark": company.peer_benchmark,
        "evidence": company.evidence,
        "message": f"{ticker_upper} company API connected to PostgreSQL successfully",
    }