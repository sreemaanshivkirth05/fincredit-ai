from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.holding import Holding

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("")
def get_portfolio(db: Session = Depends(get_db)):
    holdings = db.query(Holding).order_by(Holding.id.asc()).all()

    holdings_response = [
        {
            "ticker": holding.ticker,
            "company": holding.company,
            "shares": holding.shares,
            "avgPrice": holding.avg_price,
            "value": holding.value,
            "weight": holding.weight,
            "sector": holding.sector,
            "risk": holding.risk,
            "score": holding.score,
            "sentiment": holding.sentiment,
        }
        for holding in holdings
    ]

    total_value = sum(item["value"] for item in holdings_response)
    holdings_count = len(holdings_response)

    high_risk_exposure = sum(
        item["weight"] for item in holdings_response if item["risk"] == "High"
    )

    if holdings_count > 0:
        overall_risk = round(
            sum(item["score"] * item["weight"] for item in holdings_response) / 100
        )
    else:
        overall_risk = 0

    return {
        "totalValue": total_value,
        "overallRisk": overall_risk,
        "highRiskExposure": high_risk_exposure,
        "holdingsCount": holdings_count,
        "holdings": holdings_response,
        "message": "Portfolio API connected to PostgreSQL successfully",
    }