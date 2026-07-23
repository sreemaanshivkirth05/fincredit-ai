import logging
from functools import lru_cache

import requests

from app.services.sec_service import (
    SEC_HEADERS,
    SEC_TICKER_MAPPING_URL,
    TICKER_TO_CIK,
    normalize_ticker,
    pad_cik,
)


logger = logging.getLogger(__name__)

POPULAR_STOCKS = {
    "AAPL": "Apple Inc.",
    "ABNB": "Airbnb, Inc.",
    "ADBE": "Adobe Inc.",
    "AMD": "Advanced Micro Devices, Inc.",
    "AMZN": "Amazon.com, Inc.",
    "AVGO": "Broadcom Inc.",
    "BAC": "Bank of America Corporation",
    "COST": "Costco Wholesale Corporation",
    "CRM": "Salesforce, Inc.",
    "CSCO": "Cisco Systems, Inc.",
    "CVX": "Chevron Corporation",
    "GOOG": "Alphabet Inc.",
    "GOOGL": "Alphabet Inc.",
    "HD": "The Home Depot, Inc.",
    "IBM": "International Business Machines Corporation",
    "INTC": "Intel Corporation",
    "JNJ": "Johnson & Johnson",
    "JPM": "JPMorgan Chase & Co.",
    "KO": "The Coca-Cola Company",
    "LLY": "Eli Lilly and Company",
    "MA": "Mastercard Incorporated",
    "META": "Meta Platforms, Inc.",
    "MSFT": "Microsoft Corporation",
    "NFLX": "Netflix, Inc.",
    "NOW": "ServiceNow, Inc.",
    "NVDA": "NVIDIA Corporation",
    "ORCL": "Oracle Corporation",
    "PEP": "PepsiCo, Inc.",
    "PG": "The Procter & Gamble Company",
    "PLTR": "Palantir Technologies Inc.",
    "QCOM": "QUALCOMM Incorporated",
    "SHOP": "Shopify Inc.",
    "SNOW": "Snowflake Inc.",
    "TSLA": "Tesla, Inc.",
    "TXN": "Texas Instruments Incorporated",
    "UBER": "Uber Technologies, Inc.",
    "UNH": "UnitedHealth Group Incorporated",
    "V": "Visa Inc.",
    "WMT": "Walmart Inc.",
    "XOM": "Exxon Mobil Corporation",
}


def fallback_stock_entries() -> list[dict[str, str | None]]:
    return [
        {
            "ticker": ticker,
            "name": POPULAR_STOCKS.get(ticker, ticker),
            "cik": pad_cik(cik),
            "source": "fallback",
        }
        for ticker, cik in TICKER_TO_CIK.items()
    ]


@lru_cache(maxsize=1)
def load_sec_stock_universe() -> tuple[dict[str, str | None], ...]:
    try:
        response = requests.get(
            SEC_TICKER_MAPPING_URL,
            headers=SEC_HEADERS,
            timeout=10,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception as error:
        logger.warning("SEC stock universe fetch failed: %s", error)
        return tuple()

    entries = []

    for item in payload.values():
        ticker = item.get("ticker")
        cik = item.get("cik_str")

        if not ticker or cik is None:
            continue

        normalized_ticker = normalize_ticker(str(ticker))
        entries.append(
            {
                "ticker": normalized_ticker,
                "name": str(item.get("title") or normalized_ticker),
                "cik": pad_cik(cik),
                "source": "sec",
            }
        )

    return tuple(entries)


def get_stock_universe() -> list[dict[str, str | None]]:
    merged: dict[str, dict[str, str | None]] = {
        str(entry["ticker"]): entry for entry in fallback_stock_entries()
    }

    for entry in load_sec_stock_universe():
        ticker = str(entry["ticker"])
        fallback_name = POPULAR_STOCKS.get(ticker)

        merged[ticker] = {
            "ticker": ticker,
            "name": fallback_name or str(entry.get("name") or ticker).title(),
            "cik": entry.get("cik"),
            "source": "sec",
        }

    return list(merged.values())


def result_rank(entry: dict[str, str | None], query: str) -> tuple[int, int, str]:
    ticker = str(entry["ticker"]).lower()
    name = str(entry["name"]).lower()
    popular_rank = 0 if str(entry["ticker"]) in POPULAR_STOCKS else 1

    if ticker == query:
        rank = 0
    elif ticker.startswith(query):
        rank = 1
    elif name.startswith(query):
        rank = 2
    elif query in ticker:
        rank = 3
    else:
        rank = 4

    return popular_rank, rank, ticker


def search_stocks(query: str, limit: int = 10) -> dict[str, object]:
    cleaned_query = query.strip()
    normalized_query = normalize_ticker(cleaned_query)
    lowered_query = cleaned_query.lower()
    safe_limit = max(1, min(limit, 25))

    if not cleaned_query:
        return {"query": cleaned_query, "results": []}

    matches = [
        entry
        for entry in get_stock_universe()
        if normalized_query in str(entry["ticker"])
        or lowered_query in str(entry["name"]).lower()
    ]

    ranked_matches = sorted(matches, key=lambda entry: result_rank(entry, lowered_query))

    return {
        "query": cleaned_query,
        "results": ranked_matches[:safe_limit],
    }
