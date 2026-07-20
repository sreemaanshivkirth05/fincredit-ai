from fastapi import APIRouter, HTTPException, Query
import yfinance as yf
import math

router = APIRouter(prefix="/api/market", tags=["market-chart"])

RANGE_CONFIG = {
    "1D": {"period": "1d", "interval": "5m"},
    "5D": {"period": "5d", "interval": "15m"},
    "1W": {"period": "5d", "interval": "15m"},
    "1M": {"period": "1mo", "interval": "1d"},
    "3M": {"period": "3mo", "interval": "1d"},
    "6M": {"period": "6mo", "interval": "1d"},
    "YTD": {"period": "ytd", "interval": "1d"},
    "1Y": {"period": "1y", "interval": "1d"},
    "5Y": {"period": "5y", "interval": "1wk"},
    "MAX": {"period": "max", "interval": "1mo"},
}


def clean_number(value):
    if value is None:
        return None

    try:
        number = float(value)

        if math.isnan(number) or math.isinf(number):
            return None

        return number
    except Exception:
        return None


@router.get("/{ticker}/chart")
def get_market_chart(
    ticker: str,
    range: str = Query(
        default="1M",
        description="1D, 5D, 1W, 1M, 3M, 6M, YTD, 1Y, 5Y, or Max",
    ),
):
    cleaned_ticker = ticker.strip().upper()
    cleaned_range = range.strip().upper()

    config_key = "MAX" if cleaned_range == "MAX" else cleaned_range

    if config_key not in RANGE_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported range '{range}'. "
                "Use 1D, 5D, 1W, 1M, 3M, 6M, YTD, 1Y, 5Y, or Max."
            ),
        )

    config = RANGE_CONFIG[config_key]

    try:
        stock = yf.Ticker(cleaned_ticker)

        history = stock.history(
            period=config["period"],
            interval=config["interval"],
            auto_adjust=False,
            prepost=False,
        )

        if history is None or history.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No chart history found for {cleaned_ticker}.",
            )

        history = history.reset_index()

        points = []

        for _, row in history.iterrows():
            date_value = row.get("Datetime", None)

            if date_value is None:
                date_value = row.get("Date", None)

            if date_value is None:
                continue

            points.append(
                {
                    "date": (
                        date_value.isoformat()
                        if hasattr(date_value, "isoformat")
                        else str(date_value)
                    ),
                    "open": clean_number(row.get("Open")),
                    "high": clean_number(row.get("High")),
                    "low": clean_number(row.get("Low")),
                    "close": clean_number(row.get("Close")),
                    "adjClose": clean_number(row.get("Adj Close")),
                    "volume": clean_number(row.get("Volume")),
                }
            )

        return {
            "ticker": cleaned_ticker,
            "range": range,
            "period": config["period"],
            "interval": config["interval"],
            "pointsCount": len(points),
            "points": points,
            "source": "yfinance",
            "message": f"{cleaned_ticker} {range} chart loaded from yfinance",
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chart history for {cleaned_ticker}: {str(error)}",
        )