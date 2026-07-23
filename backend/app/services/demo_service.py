from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.models.portfolio_transaction import PortfolioTransaction
from app.models.watchlist_company import WatchlistCompany
from app.services.portfolio_service import recalculate_portfolio_weights


DEMO_HOLDINGS = [
    {
        "ticker": "MSFT",
        "company": "Microsoft Corporation",
        "shares": 4,
        "avg_price": 420.0,
        "current_price": 438.5,
        "sector": "Technology",
        "risk": "Medium",
        "score": 42,
        "sentiment": "Positive",
        "exchange": "NMS",
    },
    {
        "ticker": "AAPL",
        "company": "Apple Inc.",
        "shares": 5,
        "avg_price": 190.0,
        "current_price": 214.25,
        "sector": "Technology",
        "risk": "Medium",
        "score": 45,
        "sentiment": "Neutral",
        "exchange": "NMS",
    },
    {
        "ticker": "NVDA",
        "company": "NVIDIA Corporation",
        "shares": 8,
        "avg_price": 112.0,
        "current_price": 128.4,
        "sector": "Technology",
        "risk": "High",
        "score": 72,
        "sentiment": "Positive",
        "exchange": "NMS",
    },
    {
        "ticker": "JPM",
        "company": "JPMorgan Chase & Co.",
        "shares": 6,
        "avg_price": 215.0,
        "current_price": 226.1,
        "sector": "Financial Services",
        "risk": "Low",
        "score": 34,
        "sentiment": "Neutral",
        "exchange": "NYQ",
    },
    {
        "ticker": "TSLA",
        "company": "Tesla, Inc.",
        "shares": 3,
        "avg_price": 245.0,
        "current_price": 238.75,
        "sector": "Consumer Cyclical",
        "risk": "High",
        "score": 78,
        "sentiment": "Mixed",
        "exchange": "NMS",
    },
]

DEMO_WATCHLIST = [
    {
        "ticker": "AAPL",
        "company": "Apple Inc.",
        "sector": "Technology",
        "risk": "Medium",
        "risk_score": 45,
        "sentiment": "Neutral",
        "filing": "Latest 10-Q available for review",
        "status": "Tracking",
        "current_price": 214.25,
        "previous_close": 211.9,
        "market_cap": 3_250_000_000_000,
        "volume": 48_500_000,
        "exchange": "NMS",
    },
    {
        "ticker": "MSFT",
        "company": "Microsoft Corporation",
        "sector": "Technology",
        "risk": "Medium",
        "risk_score": 42,
        "sentiment": "Positive",
        "filing": "Cloud and AI segment trends worth reviewing",
        "status": "Tracking",
        "current_price": 438.5,
        "previous_close": 435.2,
        "market_cap": 3_260_000_000_000,
        "volume": 22_100_000,
        "exchange": "NMS",
    },
    {
        "ticker": "NVDA",
        "company": "NVIDIA Corporation",
        "sector": "Technology",
        "risk": "High",
        "risk_score": 72,
        "sentiment": "Positive",
        "filing": "High growth expectations require valuation review",
        "status": "Needs Review",
        "current_price": 128.4,
        "previous_close": 126.75,
        "market_cap": 3_160_000_000_000,
        "volume": 215_000_000,
        "exchange": "NMS",
    },
    {
        "ticker": "TSLA",
        "company": "Tesla, Inc.",
        "sector": "Consumer Cyclical",
        "risk": "High",
        "risk_score": 78,
        "sentiment": "Mixed",
        "filing": "Margin and demand commentary needs review",
        "status": "Needs Review",
        "current_price": 238.75,
        "previous_close": 242.1,
        "market_cap": 760_000_000_000,
        "volume": 91_200_000,
        "exchange": "NMS",
    },
    {
        "ticker": "JPM",
        "company": "JPMorgan Chase & Co.",
        "sector": "Financial Services",
        "risk": "Low",
        "risk_score": 34,
        "sentiment": "Neutral",
        "filing": "Bank capital and credit trends available",
        "status": "Tracking",
        "current_price": 226.1,
        "previous_close": 224.8,
        "market_cap": 635_000_000_000,
        "volume": 9_800_000,
        "exchange": "NYQ",
    },
    {
        "ticker": "AMZN",
        "company": "Amazon.com, Inc.",
        "sector": "Consumer Cyclical",
        "risk": "Medium",
        "risk_score": 52,
        "sentiment": "Positive",
        "filing": "AWS and retail margin trends are watchlist items",
        "status": "Tracking",
        "current_price": 184.35,
        "previous_close": 181.6,
        "market_cap": 1_930_000_000_000,
        "volume": 37_300_000,
        "exchange": "NMS",
    },
]


def reset_demo_data(db: Session, user_id: int):
    now = datetime.utcnow()

    db.query(PortfolioTransaction).filter(
        PortfolioTransaction.user_id == user_id
    ).delete(synchronize_session=False)
    db.query(Holding).filter(Holding.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(WatchlistCompany).filter(WatchlistCompany.user_id == user_id).delete(
        synchronize_session=False
    )

    for index, item in enumerate(DEMO_HOLDINGS):
        total_cost = item["shares"] * item["avg_price"]
        value = item["shares"] * item["current_price"]

        db.add(
            Holding(
                user_id=user_id,
                ticker=item["ticker"],
                company=item["company"],
                shares=item["shares"],
                avg_price=item["avg_price"],
                current_price=item["current_price"],
                total_cost=total_cost,
                value=value,
                weight=0,
                unrealized_pl=value - total_cost,
                unrealized_pl_percent=((value - total_cost) / total_cost) * 100,
                sector=item["sector"],
                risk=item["risk"],
                score=item["score"],
                sentiment=item["sentiment"],
                currency="USD",
                exchange=item["exchange"],
                created_at=now - timedelta(days=20 - index),
                updated_at=now,
            )
        )

    transactions = [
        {
            "ticker": "AAPL",
            "company": "Apple Inc.",
            "action": "BUY",
            "shares": 6,
            "price": 190.0,
            "created_at": now - timedelta(days=18),
            "exchange": "NMS",
        },
        {
            "ticker": "MSFT",
            "company": "Microsoft Corporation",
            "action": "BUY",
            "shares": 4,
            "price": 420.0,
            "created_at": now - timedelta(days=14),
            "exchange": "NMS",
        },
        {
            "ticker": "NVDA",
            "company": "NVIDIA Corporation",
            "action": "BUY",
            "shares": 8,
            "price": 112.0,
            "created_at": now - timedelta(days=9),
            "exchange": "NMS",
        },
        {
            "ticker": "AAPL",
            "company": "Apple Inc.",
            "action": "SELL",
            "shares": 1,
            "price": 214.25,
            "created_at": now - timedelta(days=3),
            "exchange": "NMS",
            "avg_price": 190.0,
        },
    ]

    for item in transactions:
        total_amount = item["shares"] * item["price"]
        realized_pl = None
        realized_pl_percent = None

        if item["action"] == "SELL":
            realized_pl = (item["price"] - item["avg_price"]) * item["shares"]
            realized_pl_percent = (
                ((item["price"] - item["avg_price"]) / item["avg_price"]) * 100
                if item["avg_price"]
                else 0
            )

        db.add(
            PortfolioTransaction(
                user_id=user_id,
                ticker=item["ticker"],
                company=item["company"],
                action=item["action"],
                shares=item["shares"],
                price=item["price"],
                total_amount=total_amount,
                realized_pl=realized_pl,
                realized_pl_percent=realized_pl_percent,
                currency="USD",
                exchange=item["exchange"],
                created_at=item["created_at"],
            )
        )

    for index, item in enumerate(DEMO_WATCHLIST):
        db.add(
            WatchlistCompany(
                user_id=user_id,
                ticker=item["ticker"],
                company=item["company"],
                sector=item["sector"],
                risk=item["risk"],
                risk_score=item["risk_score"],
                sentiment=item["sentiment"],
                filing=item["filing"],
                status=item["status"],
                current_price=item["current_price"],
                previous_close=item["previous_close"],
                market_cap=item["market_cap"],
                volume=item["volume"],
                currency="USD",
                exchange=item["exchange"],
                added_at=now - timedelta(days=12 - index),
            )
        )

    db.flush()
    recalculate_portfolio_weights(db, user_id)
    db.commit()

    holdings_count = db.query(Holding).filter(Holding.user_id == user_id).count()
    transactions_count = (
        db.query(PortfolioTransaction)
        .filter(PortfolioTransaction.user_id == user_id)
        .count()
    )
    watchlist_count = (
        db.query(WatchlistCompany).filter(WatchlistCompany.user_id == user_id).count()
    )

    return {
        "holdingsCount": holdings_count,
        "transactionsCount": transactions_count,
        "watchlistCount": watchlist_count,
        "message": (
            "Demo data reset complete. Demo reset only changes portfolio, "
            "transactions, and watchlist demo data."
        ),
    }
