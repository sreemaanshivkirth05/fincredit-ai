from datetime import datetime

import yfinance as yf
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.watchlist_company import WatchlistCompany
from app.schemas.watchlist import WatchlistAddRequest


def normalize_ticker(ticker: str) -> str:
    return ticker.strip().upper()


def fetch_latest_watchlist_market_data(ticker: str):
    cleaned_ticker = normalize_ticker(ticker)
    stock = yf.Ticker(cleaned_ticker)
    info = stock.info or {}

    current_price = (
        info.get("currentPrice")
        or info.get("regularMarketPrice")
        or info.get("previousClose")
    )

    if current_price is None:
        history = stock.history(period="1d")

        if history.empty:
            raise ValueError(f"No latest price returned for {cleaned_ticker}.")

        current_price = float(history["Close"].iloc[-1])

    return {
        "currentPrice": float(current_price),
        "previousClose": info.get("previousClose"),
        "marketCap": info.get("marketCap"),
        "volume": info.get("volume"),
        "currency": info.get("currency") or "USD",
        "exchange": info.get("exchange") or info.get("fullExchangeName"),
    }


def watchlist_company_to_dict(company: WatchlistCompany):
    return {
        "ticker": company.ticker,
        "company": company.company,
        "sector": company.sector,
        "risk": company.risk,
        "riskScore": company.risk_score,
        "sentiment": company.sentiment,
        "filing": company.filing,
        "status": company.status,
        "currentPrice": company.current_price,
        "previousClose": company.previous_close,
        "marketCap": company.market_cap,
        "volume": company.volume,
        "currency": company.currency,
        "exchange": company.exchange,
        "addedAt": company.added_at,
    }


def get_watchlist_item_by_ticker(db: Session, ticker: str):
    cleaned_ticker = normalize_ticker(ticker)

    return (
        db.query(WatchlistCompany)
        .filter(func.upper(WatchlistCompany.ticker) == cleaned_ticker)
        .first()
    )


def get_watchlist_status(db: Session, ticker: str):
    cleaned_ticker = normalize_ticker(ticker)
    company = get_watchlist_item_by_ticker(db, cleaned_ticker)

    return {
        "ticker": cleaned_ticker,
        "isWatchlisted": company is not None,
        "item": watchlist_company_to_dict(company) if company else None,
    }


def add_stock_to_watchlist(db: Session, request: WatchlistAddRequest):
    cleaned_ticker = normalize_ticker(request.ticker)
    existing_company = get_watchlist_item_by_ticker(db, cleaned_ticker)

    if existing_company:
        existing_company.company = request.company or existing_company.company
        existing_company.sector = request.sector or existing_company.sector
        existing_company.current_price = request.currentPrice
        existing_company.previous_close = request.previousClose
        existing_company.market_cap = request.marketCap
        existing_company.volume = request.volume
        existing_company.currency = request.currency
        existing_company.exchange = request.exchange

        db.commit()
        db.refresh(existing_company)

        return {
            "ticker": cleaned_ticker,
            "isWatchlisted": True,
            "message": f"{cleaned_ticker} is already in the watchlist. Existing item updated.",
            "item": watchlist_company_to_dict(existing_company),
        }

    new_company = WatchlistCompany(
        ticker=cleaned_ticker,
        company=request.company or cleaned_ticker,
        sector=request.sector or "Unknown",
        risk="Learning",
        risk_score=50,
        sentiment="Neutral",
        filing="No new filing changes",
        status="Tracking",
        current_price=request.currentPrice,
        previous_close=request.previousClose,
        market_cap=request.marketCap,
        volume=request.volume,
        currency=request.currency or "USD",
        exchange=request.exchange,
        added_at=datetime.utcnow(),
    )

    db.add(new_company)
    db.commit()
    db.refresh(new_company)

    return {
        "ticker": cleaned_ticker,
        "isWatchlisted": True,
        "message": f"{cleaned_ticker} added to watchlist.",
        "item": watchlist_company_to_dict(new_company),
    }


def remove_stock_from_watchlist(db: Session, ticker: str):
    cleaned_ticker = normalize_ticker(ticker)
    company = get_watchlist_item_by_ticker(db, cleaned_ticker)

    if not company:
        return {
            "ticker": cleaned_ticker,
            "isWatchlisted": False,
            "message": f"{cleaned_ticker} was not in the watchlist.",
            "item": None,
        }

    db.delete(company)
    db.commit()

    return {
        "ticker": cleaned_ticker,
        "isWatchlisted": False,
        "message": f"{cleaned_ticker} removed from watchlist.",
        "item": None,
    }


def get_watchlist_data(db: Session):
    companies = db.query(WatchlistCompany).order_by(WatchlistCompany.id.asc()).all()

    watchlist = [watchlist_company_to_dict(company) for company in companies]

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
            "ticker": company["ticker"],
            "headline": f"{company['ticker']} is being tracked in your learning watchlist.",
            "category": "Watchlist",
            "impact": "Medium",
        }
        for company in watchlist[:3]
    ]

    needs_review = sum(
        1 for company in watchlist if company["status"] == "Needs Review"
    )

    new_filing_changes = sum(
        1 for company in watchlist if "changed" in company["filing"].lower()
    )

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


def refresh_watchlist_prices(db: Session):
    companies = db.query(WatchlistCompany).order_by(WatchlistCompany.id.asc()).all()
    refreshed_count = 0
    failed_tickers = []

    for company in companies:
        try:
            market_data = fetch_latest_watchlist_market_data(company.ticker)
            company.current_price = market_data["currentPrice"]
            company.previous_close = market_data["previousClose"]
            company.market_cap = market_data["marketCap"]
            company.volume = market_data["volume"]
            company.currency = market_data["currency"] or company.currency or "USD"
            company.exchange = market_data["exchange"] or company.exchange
            refreshed_count += 1
        except Exception:
            failed_tickers.append(company.ticker)

    db.commit()

    return {
        "refreshedCount": refreshed_count,
        "failedCount": len(failed_tickers),
        "failedTickers": failed_tickers,
        "watchlist": get_watchlist_data(db),
        "message": f"Watchlist prices refreshed. {refreshed_count} stocks updated.",
    }
