import yfinance as yf
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.market_snapshot import MarketSnapshot


def get_market_data(ticker: str, db: Session | None = None):
    ticker_upper = ticker.upper()

    try:
        stock = yf.Ticker(ticker_upper)
        info = stock.info

        if not info or info.get("quoteType") is None:
            raise HTTPException(status_code=404, detail="Market data not found")

        market_data = {
            "ticker": ticker_upper,
            "companyName": info.get("longName") or info.get("shortName") or ticker_upper,
            "sector": info.get("sector"),
            "currentPrice": info.get("currentPrice") or info.get("regularMarketPrice"),
            "previousClose": info.get("previousClose"),
            "dayHigh": info.get("dayHigh"),
            "dayLow": info.get("dayLow"),
            "volume": info.get("volume"),
            "marketCap": info.get("marketCap"),
            "currency": info.get("currency"),
            "exchange": info.get("exchange"),
            "message": f"{ticker_upper} real market data fetched and stored successfully",
        }

        if db is not None:
            snapshot = MarketSnapshot(
                ticker=market_data["ticker"],
                company_name=market_data["companyName"],
                sector=market_data["sector"],
                current_price=market_data["currentPrice"],
                previous_close=market_data["previousClose"],
                day_high=market_data["dayHigh"],
                day_low=market_data["dayLow"],
                volume=market_data["volume"],
                market_cap=market_data["marketCap"],
                currency=market_data["currency"],
                exchange=market_data["exchange"],
            )

            db.add(snapshot)
            db.commit()

        return market_data

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch market data: {str(error)}",
        )


def get_market_history(ticker: str, db: Session):
    ticker_upper = ticker.upper()

    snapshots = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.ticker == ticker_upper)
        .order_by(MarketSnapshot.fetched_at.desc())
        .limit(20)
        .all()
    )

    snapshots_response = [
        {
            "ticker": snapshot.ticker,
            "companyName": snapshot.company_name,
            "sector": snapshot.sector,
            "currentPrice": snapshot.current_price,
            "previousClose": snapshot.previous_close,
            "dayHigh": snapshot.day_high,
            "dayLow": snapshot.day_low,
            "volume": snapshot.volume,
            "marketCap": snapshot.market_cap,
            "currency": snapshot.currency,
            "exchange": snapshot.exchange,
            "fetchedAt": snapshot.fetched_at,
        }
        for snapshot in snapshots
    ]

    return {
        "ticker": ticker_upper,
        "snapshotsCount": len(snapshots_response),
        "snapshots": snapshots_response,
        "message": f"{ticker_upper} market snapshot history loaded from PostgreSQL",
    }