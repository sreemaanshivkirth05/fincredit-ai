import logging

import requests
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.sec_fundamental import SecFundamental


logger = logging.getLogger(__name__)

SEC_HEADERS = {
    "User-Agent": "FinCreditAI/1.0 contact@example.com",
}


TICKER_TO_CIK = {
    "AAPL": "0000320193",
    "MSFT": "0000789019",
    "NVDA": "0001045810",
    "TSLA": "0001318605",
    "JPM": "0000019617",
    "AMZN": "0001018724",
    "GOOGL": "0001652044",
    "GOOG": "0001652044",
    "META": "0001326801",
    "NFLX": "0001065280",
    "AMD": "0000002488",
    "INTC": "0000050863",
    "ORCL": "0001341439",
    "CRM": "0001108524",
    "ADBE": "0000796343",
    "BAC": "0000070858",
    "WMT": "0000104169",
    "COST": "0000909832",
}

SEC_TICKER_MAPPING_URL = "https://www.sec.gov/files/company_tickers.json"
_SEC_TICKER_TO_CIK_CACHE: dict[str, str] | None = None


def normalize_ticker(ticker: str) -> str:
    return ticker.strip().upper().replace(".", "-")


def pad_cik(cik: str | int) -> str:
    return str(cik).strip().zfill(10)


def load_sec_ticker_mapping() -> dict[str, str]:
    global _SEC_TICKER_TO_CIK_CACHE

    if _SEC_TICKER_TO_CIK_CACHE is not None:
        return _SEC_TICKER_TO_CIK_CACHE

    try:
        response = requests.get(
            SEC_TICKER_MAPPING_URL,
            headers=SEC_HEADERS,
            timeout=10,
        )
        response.raise_for_status()
        mapping_payload = response.json()

        _SEC_TICKER_TO_CIK_CACHE = {
            normalize_ticker(item["ticker"]): pad_cik(item["cik_str"])
            for item in mapping_payload.values()
            if item.get("ticker") and item.get("cik_str") is not None
        }
    except Exception as error:
        logger.warning("SEC ticker mapping fetch failed: %s", error)
        _SEC_TICKER_TO_CIK_CACHE = {}

    return _SEC_TICKER_TO_CIK_CACHE


def resolve_cik_for_ticker(ticker: str) -> str | None:
    ticker_upper = normalize_ticker(ticker)

    fallback_cik = TICKER_TO_CIK.get(ticker_upper)
    if fallback_cik:
        return pad_cik(fallback_cik)

    sec_mapping = load_sec_ticker_mapping()
    return sec_mapping.get(ticker_upper)


def get_latest_annual_fact(facts: dict, taxonomy: str, concept: str):
    """
    Selects the latest annual SEC Company Facts value for a concept.

    Important filters:
    - form must be 10-K or 10-K/A
    - fiscal period must be FY
    - fiscal year must exist
    - value must exist

    Then sorts by latest filed date and fiscal year.
    """
    try:
        units = facts["facts"][taxonomy][concept]["units"]

        if "USD" in units:
            values = units["USD"]
        elif "shares" in units:
            values = units["shares"]
        else:
            first_unit = next(iter(units))
            values = units[first_unit]

        annual_values = [
            item
            for item in values
            if item.get("form") in ["10-K", "10-K/A"]
            and item.get("fp") == "FY"
            and item.get("fy") is not None
            and item.get("val") is not None
            and item.get("filed") is not None
        ]

        if not annual_values:
            return None

        annual_values.sort(
            key=lambda item: (
                item.get("filed", ""),
                item.get("fy", 0),
                item.get("end", ""),
            ),
            reverse=True,
        )

        return annual_values[0]

    except KeyError:
        return None


def get_first_available_fact(facts: dict, concept_candidates: list[str]):
    """
    Tries multiple us-gaap concepts and returns the latest valid annual fact.
    This is useful because companies may report the same metric under different concepts.
    """
    for concept in concept_candidates:
        fact = get_latest_annual_fact(facts, "us-gaap", concept)
        if fact is not None:
            return fact

    return None


def get_sec_company_facts(ticker: str, db: Session | None = None):
    ticker_upper = normalize_ticker(ticker)
    cik = resolve_cik_for_ticker(ticker_upper)

    if not cik:
        raise HTTPException(
            status_code=404,
            detail=f"SEC CIK mapping not found for ticker {ticker_upper}",
        )

    url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"

    try:
        response = requests.get(url, headers=SEC_HEADERS, timeout=20)

        if response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"SEC company facts not available for ticker {ticker_upper}",
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch SEC company facts for ticker {ticker_upper}",
            )

        facts = response.json()

        revenue_fact = get_first_available_fact(
            facts,
            [
                "RevenueFromContractWithCustomerExcludingAssessedTax",
                "Revenues",
                "SalesRevenueNet",
            ],
        )

        net_income_fact = get_first_available_fact(
            facts,
            [
                "NetIncomeLoss",
                "ProfitLoss",
            ],
        )

        assets_fact = get_first_available_fact(
            facts,
            [
                "Assets",
            ],
        )

        liabilities_fact = get_first_available_fact(
            facts,
            [
                "Liabilities",
            ],
        )

        equity_fact = get_first_available_fact(
            facts,
            [
                "StockholdersEquity",
                "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
            ],
        )

        reference_fact = (
            revenue_fact
            or net_income_fact
            or assets_fact
            or liabilities_fact
            or equity_fact
        )

        sec_data = {
            "ticker": ticker_upper,
            "cik": cik,
            "companyName": facts.get("entityName", ticker_upper),
            "revenue": revenue_fact.get("val") if revenue_fact else None,
            "netIncome": net_income_fact.get("val") if net_income_fact else None,
            "assets": assets_fact.get("val") if assets_fact else None,
            "liabilities": liabilities_fact.get("val") if liabilities_fact else None,
            "equity": equity_fact.get("val") if equity_fact else None,
            "fiscalYear": reference_fact.get("fy") if reference_fact else None,
            "form": reference_fact.get("form") if reference_fact else None,
            "filed": reference_fact.get("filed") if reference_fact else None,
            "source": "SEC Company Facts API",
            "message": f"{ticker_upper} SEC company facts fetched and stored successfully",
        }

        if db is not None:
            fundamental = SecFundamental(
                ticker=sec_data["ticker"],
                cik=sec_data["cik"],
                company_name=sec_data["companyName"],
                revenue=sec_data["revenue"],
                net_income=sec_data["netIncome"],
                assets=sec_data["assets"],
                liabilities=sec_data["liabilities"],
                equity=sec_data["equity"],
                fiscal_year=sec_data["fiscalYear"],
                form=sec_data["form"],
                filed=sec_data["filed"],
                source=sec_data["source"],
            )

            db.add(fundamental)
            db.commit()

        return sec_data

    except HTTPException:
        raise

    except Exception as error:
        logger.exception("SEC company facts fetch failed for %s", ticker_upper)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch SEC company facts for ticker {ticker_upper}",
        )


def get_sec_fundamentals_history(ticker: str, db: Session):
    ticker_upper = normalize_ticker(ticker)

    snapshots = (
        db.query(SecFundamental)
        .filter(SecFundamental.ticker == ticker_upper)
        .order_by(SecFundamental.fetched_at.desc())
        .limit(20)
        .all()
    )

    snapshots_response = [
        {
            "ticker": snapshot.ticker,
            "cik": snapshot.cik,
            "companyName": snapshot.company_name,
            "revenue": snapshot.revenue,
            "netIncome": snapshot.net_income,
            "assets": snapshot.assets,
            "liabilities": snapshot.liabilities,
            "equity": snapshot.equity,
            "fiscalYear": snapshot.fiscal_year,
            "form": snapshot.form,
            "filed": snapshot.filed,
            "source": snapshot.source,
            "fetchedAt": snapshot.fetched_at,
        }
        for snapshot in snapshots
    ]

    return {
        "ticker": ticker_upper,
        "snapshotsCount": len(snapshots_response),
        "snapshots": snapshots_response,
        "message": f"{ticker_upper} SEC fundamentals history loaded from PostgreSQL",
    }
