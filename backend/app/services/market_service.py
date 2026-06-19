import yfinance as yf
from fastapi import HTTPException


def get_market_data(ticker: str):
    ticker_upper = ticker.upper()

    try:
        stock = yf.Ticker(ticker_upper)
        info = stock.info

        if not info or info.get("quoteType") is None:
            raise HTTPException(status_code=404, detail="Market data not found")

        return {
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
            "message": f"{ticker_upper} real market data fetched successfully",
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch market data: {str(error)}",
        )