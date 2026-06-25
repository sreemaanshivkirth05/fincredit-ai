import requests
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.sec_fundamental import SecFundamental


SEC_HEADERS = {
    "User-Agent": "FinCredit AI sreemaanshivkirthv@smu.edu"
}


TICKER_TO_CIK = {
    "MSFT": "0000789019",
    "AAPL": "0000320193",
    "TSLA": "0001318605",
    "NVDA": "0001045810",
    "JPM": "0000019617",
}


def get_latest_fact(facts: dict, taxonomy: str, concept: str):
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
            and item.get("fy") is not None
        ]

        if not annual_values:
            return None

        annual_values.sort(
            key=lambda item: (item.get("fy", 0), item.get("filed", "")),
            reverse=True,
        )

        return annual_values[0]

    except KeyError:
        return None


def get_sec_company_facts(ticker: str, db: Session | None = None):
    ticker_upper = ticker.upper()
    cik = TICKER_TO_CIK.get(ticker_upper)

    if not cik:
        raise HTTPException(
            status_code=404,
            detail="Ticker CIK mapping not available yet",
        )

    url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"

    try:
        response = requests.get(url, headers=SEC_HEADERS, timeout=20)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to fetch SEC company facts",
            )

        facts = response.json()

        revenue_fact = (
            get_latest_fact(facts, "us-gaap", "Revenues")
            or get_latest_fact(
                facts,
                "us-gaap",
                "RevenueFromContractWithCustomerExcludingAssessedTax",
            )
        )
        net_income_fact = get_latest_fact(facts, "us-gaap", "NetIncomeLoss")
        assets_fact = get_latest_fact(facts, "us-gaap", "Assets")
        liabilities_fact = get_latest_fact(facts, "us-gaap", "Liabilities")
        equity_fact = get_latest_fact(facts, "us-gaap", "StockholdersEquity")

        reference_fact = revenue_fact or net_income_fact or assets_fact

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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch SEC data: {str(error)}",
        )


def get_sec_fundamentals_history(ticker: str, db: Session):
    ticker_upper = ticker.upper()

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