from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.watchlist_company import WatchlistCompany

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


@router.get("")
def get_watchlist(db: Session = Depends(get_db)):
    companies = db.query(WatchlistCompany).order_by(WatchlistCompany.id.asc()).all()

    watchlist = [
        {
            "ticker": company.ticker,
            "company": company.company,
            "sector": company.sector,
            "risk": company.risk,
            "riskScore": company.risk_score,
            "sentiment": company.sentiment,
            "filing": company.filing,
            "status": company.status,
        }
        for company in companies
    ]

    sentiment_data = [
        {
            "ticker": company["ticker"],
            "positive": 12 if company["sentiment"] == "Positive" else 7,
            "negative": 2 if company["risk"] == "Low" else 5,
        }
        for company in watchlist
    ]

    news_radar = [
        {
            "ticker": "TSLA",
            "headline": "Margin pressure and regulatory concerns increased in recent coverage.",
            "category": "Risk News",
            "impact": "High",
        },
        {
            "ticker": "NVDA",
            "headline": "AI infrastructure demand remains strong across enterprise customers.",
            "category": "Growth News",
            "impact": "Medium",
        },
        {
            "ticker": "MSFT",
            "headline": "Cloud and AI revenue outlook remains positive, but regulatory mentions increased.",
            "category": "Mixed News",
            "impact": "Medium",
        },
    ]

    needs_review = sum(1 for company in watchlist if company["status"] == "Needs Review")
    new_filing_changes = sum(1 for company in watchlist if "changed" in company["filing"].lower())

    positive_sentiment_count = sum(
        1 for company in watchlist if company["sentiment"] == "Positive"
    )

    positive_sentiment = (
        round((positive_sentiment_count / len(watchlist)) * 100)
        if watchlist
        else 0
    )

    return {
        "companiesTracked": len(watchlist),
        "needsReview": needs_review,
        "newFilingChanges": new_filing_changes,
        "positiveSentiment": positive_sentiment,
        "watchlist": watchlist,
        "sentimentData": sentiment_data,
        "newsRadar": news_radar,
        "message": "Watchlist API connected to PostgreSQL successfully",
    }