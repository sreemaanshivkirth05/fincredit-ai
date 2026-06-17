from fastapi import APIRouter

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


@router.get("")
def get_watchlist():
    watchlist = [
        {
            "ticker": "MSFT",
            "company": "Microsoft Corp.",
            "sector": "Technology",
            "risk": "Low",
            "riskScore": 28,
            "sentiment": "Positive",
            "filing": "10-K analyzed",
            "status": "Stable",
        },
        {
            "ticker": "NVDA",
            "company": "NVIDIA Corp.",
            "sector": "Semiconductors",
            "risk": "Medium",
            "riskScore": 54,
            "sentiment": "Positive",
            "filing": "No new filing",
            "status": "Monitor",
        },
        {
            "ticker": "TSLA",
            "company": "Tesla Inc.",
            "sector": "Automotive",
            "risk": "High",
            "riskScore": 78,
            "sentiment": "Mixed",
            "filing": "10-Q changed",
            "status": "Needs Review",
        },
        {
            "ticker": "JPM",
            "company": "JPMorgan Chase",
            "sector": "Financials",
            "risk": "Low",
            "riskScore": 33,
            "sentiment": "Neutral",
            "filing": "10-K analyzed",
            "status": "Stable",
        },
        {
            "ticker": "AAPL",
            "company": "Apple Inc.",
            "sector": "Technology",
            "risk": "Medium",
            "riskScore": 49,
            "sentiment": "Neutral",
            "filing": "No new filing",
            "status": "Monitor",
        },
    ]

    sentiment_data = [
        {"ticker": "MSFT", "positive": 12, "negative": 2},
        {"ticker": "NVDA", "positive": 15, "negative": 3},
        {"ticker": "TSLA", "positive": 6, "negative": 9},
        {"ticker": "JPM", "positive": 5, "negative": 4},
        {"ticker": "AAPL", "positive": 7, "negative": 5},
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

    return {
        "companiesTracked": len(watchlist),
        "needsReview": 1,
        "newFilingChanges": 1,
        "positiveSentiment": 62,
        "watchlist": watchlist,
        "sentimentData": sentiment_data,
        "newsRadar": news_radar,
        "message": "Watchlist API connected successfully",
    }