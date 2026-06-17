from fastapi import APIRouter

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("")
def get_portfolio():
    holdings = [
        {
            "ticker": "MSFT",
            "company": "Microsoft Corp.",
            "shares": 5,
            "avgPrice": 410,
            "value": 2245,
            "weight": 34,
            "sector": "Technology",
            "risk": "Low",
            "score": 28,
            "sentiment": "Positive",
        },
        {
            "ticker": "NVDA",
            "company": "NVIDIA Corp.",
            "shares": 3,
            "avgPrice": 125,
            "value": 2130,
            "weight": 31,
            "sector": "Semiconductors",
            "risk": "Medium",
            "score": 54,
            "sentiment": "Positive",
        },
        {
            "ticker": "TSLA",
            "company": "Tesla Inc.",
            "shares": 2,
            "avgPrice": 220,
            "value": 1430,
            "weight": 21,
            "sector": "Automotive",
            "risk": "High",
            "score": 78,
            "sentiment": "Mixed",
        },
        {
            "ticker": "JPM",
            "company": "JPMorgan Chase",
            "shares": 4,
            "avgPrice": 190,
            "value": 960,
            "weight": 14,
            "sector": "Financials",
            "risk": "Low",
            "score": 33,
            "sentiment": "Neutral",
        },
    ]

    total_value = sum(item["value"] for item in holdings)

    return {
        "totalValue": total_value,
        "overallRisk": 57,
        "highRiskExposure": 21,
        "holdingsCount": len(holdings),
        "holdings": holdings,
        "message": "Portfolio API connected successfully",
    }