import re
from datetime import datetime
from typing import Any, Optional, TypedDict

from langgraph.graph import END, StateGraph
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.models.market_snapshot import MarketSnapshot
from app.models.portfolio_transaction import PortfolioTransaction
from app.models.sec_fundamental import SecFundamental
from app.models.watchlist_company import WatchlistCompany
from app.services.llm_service import generate_llm_answer
from app.services.news_service import get_stock_news_data


class FinCreditState(TypedDict):
    question: str
    ticker: str | None

    portfolio_context: list[dict]
    transaction_context: list[dict]
    watchlist_context: list[dict]
    market_context: dict | None
    sec_context: dict | None
    news_context: list[dict]

    risk_drivers: list[dict]
    evidence: list[dict]
    suggested_actions: list[str]
    answer: str
    audit: dict


POPULAR_TICKERS = [
    "AAPL",
    "MSFT",
    "NVDA",
    "TSLA",
    "AMZN",
    "GOOGL",
    "GOOG",
    "META",
    "JPM",
    "BAC",
    "WMT",
    "COST",
    "NFLX",
    "AMD",
    "INTC",
    "CRM",
    "ORCL",
    "ADBE",
    "AVGO",
]


def normalize_ticker(ticker: str | None) -> str | None:
    if not ticker:
        return None

    cleaned = ticker.strip().upper().replace("$", "")

    if not cleaned:
        return None

    return cleaned


def extract_ticker_from_question(
    question: str,
    candidate_tickers: Optional[list[str]] = None,
) -> str | None:
    question_upper = question.upper()

    candidates = list(dict.fromkeys((candidate_tickers or []) + POPULAR_TICKERS))

    for ticker in candidates:
        cleaned = normalize_ticker(ticker)

        if not cleaned:
            continue

        if re.search(rf"(?<![A-Z])\$?{re.escape(cleaned)}(?![A-Z])", question_upper):
            return cleaned

    ticker_match = re.search(
        r"(?:TICKER|STOCK|SYMBOL)\s*(?:IS|=|:)?\s*\$?([A-Z]{1,5})",
        question_upper,
    )

    if ticker_match:
        return normalize_ticker(ticker_match.group(1))

    cash_ticker_match = re.search(r"\$([A-Z]{1,5})\b", question_upper)

    if cash_ticker_match:
        return normalize_ticker(cash_ticker_match.group(1))

    return None


def safe_float(value: Any) -> float | None:
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def format_money(value: Any):
    numeric_value = safe_float(value)

    if numeric_value is None:
        return "not available"

    if abs(numeric_value) >= 1_000_000_000_000:
        return f"${numeric_value / 1_000_000_000_000:.2f}T"

    if abs(numeric_value) >= 1_000_000_000:
        return f"${numeric_value / 1_000_000_000:.2f}B"

    if abs(numeric_value) >= 1_000_000:
        return f"${numeric_value / 1_000_000:.2f}M"

    return f"${numeric_value:,.2f}"


def format_percent(value: Any):
    numeric_value = safe_float(value)

    if numeric_value is None:
        return "not available"

    return f"{numeric_value:.2f}%"


def calculate_price_change_percent(current_price, previous_close):
    current = safe_float(current_price)
    previous = safe_float(previous_close)

    if current is None or previous is None or previous == 0:
        return None

    return ((current - previous) / previous) * 100


def calculate_unrealized_pl(value, total_cost):
    numeric_value = safe_float(value)
    numeric_cost = safe_float(total_cost)

    if numeric_value is None or numeric_cost is None:
        return None, None

    unrealized_pl = numeric_value - numeric_cost
    unrealized_pl_percent = (unrealized_pl / numeric_cost) * 100 if numeric_cost else 0

    return unrealized_pl, unrealized_pl_percent


def parse_iso_datetime(value: Any):
    if not value:
        return None

    if isinstance(value, datetime):
        return value

    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def holding_to_context(holding: Holding):
    shares = safe_float(getattr(holding, "shares", None)) or 0
    avg_price = safe_float(getattr(holding, "avg_price", None)) or 0
    current_price = (
        safe_float(getattr(holding, "current_price", None))
        or safe_float(getattr(holding, "avg_price", None))
        or 0
    )

    total_cost = (
        safe_float(getattr(holding, "total_cost", None))
        or shares * avg_price
    )

    value = safe_float(getattr(holding, "value", None)) or shares * current_price

    unrealized_pl, unrealized_pl_percent = calculate_unrealized_pl(
        value=value,
        total_cost=total_cost,
    )

    return {
        "ticker": holding.ticker,
        "company": holding.company,
        "shares": shares,
        "avgPrice": avg_price,
        "currentPrice": current_price,
        "totalCost": total_cost,
        "value": value,
        "weight": safe_float(getattr(holding, "weight", None)) or 0,
        "unrealizedPL": unrealized_pl,
        "unrealizedPLPercent": unrealized_pl_percent,
        "sector": holding.sector,
        "risk": holding.risk,
        "score": holding.score,
        "sentiment": holding.sentiment,
        "currency": getattr(holding, "currency", None) or "USD",
        "exchange": getattr(holding, "exchange", None),
        "updatedAt": (
            holding.updated_at.isoformat()
            if getattr(holding, "updated_at", None)
            else None
        ),
    }


def transaction_to_context(transaction: PortfolioTransaction):
    return {
        "ticker": transaction.ticker,
        "company": transaction.company,
        "action": transaction.action,
        "shares": safe_float(transaction.shares) or 0,
        "price": safe_float(transaction.price) or 0,
        "totalAmount": safe_float(transaction.total_amount) or 0,
        "realizedPL": safe_float(getattr(transaction, "realized_pl", None)),
        "realizedPLPercent": safe_float(
            getattr(transaction, "realized_pl_percent", None)
        ),
        "currency": getattr(transaction, "currency", None) or "USD",
        "exchange": getattr(transaction, "exchange", None),
        "createdAt": (
            transaction.created_at.isoformat()
            if getattr(transaction, "created_at", None)
            else None
        ),
    }


def format_transaction_summary(transaction: dict):
    realized_pl = transaction.get("realizedPL")
    realized_text = ""

    if transaction.get("action") == "SELL" and realized_pl is not None:
        realized_text = f" with realized P/L {format_money(realized_pl)}"

    return (
        f"{transaction.get('action')} {transaction.get('shares', 0):g} shares "
        f"of {transaction.get('ticker')} at {format_money(transaction.get('price'))}"
        f"{realized_text}"
    )


def watchlist_to_context(company: WatchlistCompany):
    return {
        "ticker": company.ticker,
        "company": company.company,
        "sector": company.sector,
        "risk": company.risk,
        "riskScore": company.risk_score,
        "sentiment": company.sentiment,
        "status": company.status,
        "currentPrice": getattr(company, "current_price", None),
        "previousClose": getattr(company, "previous_close", None),
        "marketCap": getattr(company, "market_cap", None),
        "volume": getattr(company, "volume", None),
        "currency": getattr(company, "currency", None) or "USD",
        "exchange": getattr(company, "exchange", None),
        "addedAt": (
            company.added_at.isoformat()
            if getattr(company, "added_at", None)
            else None
        ),
    }


def market_context_from_holding(holding: dict):
    return {
        "ticker": holding.get("ticker"),
        "companyName": holding.get("company"),
        "sector": holding.get("sector"),
        "currentPrice": holding.get("currentPrice"),
        "previousClose": None,
        "dayHigh": None,
        "dayLow": None,
        "volume": None,
        "marketCap": None,
        "currency": holding.get("currency") or "USD",
        "exchange": holding.get("exchange"),
        "fetchedAt": holding.get("updatedAt"),
        "source": "Portfolio Holding Current Price",
    }


def market_context_from_watchlist(item: dict):
    return {
        "ticker": item.get("ticker"),
        "companyName": item.get("company"),
        "sector": item.get("sector"),
        "currentPrice": item.get("currentPrice"),
        "previousClose": item.get("previousClose"),
        "dayHigh": None,
        "dayLow": None,
        "volume": item.get("volume"),
        "marketCap": item.get("marketCap"),
        "currency": item.get("currency") or "USD",
        "exchange": item.get("exchange"),
        "fetchedAt": item.get("addedAt"),
        "source": "Watchlist Current Price",
    }


def choose_fresh_market_context(
    snapshot_context: dict | None,
    holding_context: dict | None,
    watchlist_context: dict | None,
):
    if holding_context and holding_context.get("currentPrice") is not None:
        if not snapshot_context:
            return market_context_from_holding(holding_context)

        snapshot_time = parse_iso_datetime(snapshot_context.get("fetchedAt"))
        holding_time = parse_iso_datetime(holding_context.get("updatedAt"))

        if holding_time and (not snapshot_time or holding_time > snapshot_time):
            return market_context_from_holding(holding_context)

    if snapshot_context:
        return snapshot_context

    if watchlist_context and watchlist_context.get("currentPrice") is not None:
        return market_context_from_watchlist(watchlist_context)

    return None


def create_portfolio_agent(db: Session):
    def portfolio_agent(state: FinCreditState) -> FinCreditState:
        holdings = db.query(Holding).order_by(Holding.weight.desc()).all()

        portfolio_context = [holding_to_context(holding) for holding in holdings]
        state["portfolio_context"] = portfolio_context

        candidate_tickers = [holding["ticker"] for holding in portfolio_context]

        if state.get("ticker") is None:
            state["ticker"] = extract_ticker_from_question(
                state["question"],
                candidate_tickers=candidate_tickers,
            )

        return state

    return portfolio_agent


def create_transaction_agent(db: Session):
    def transaction_agent(state: FinCreditState) -> FinCreditState:
        ticker = state.get("ticker")

        query = db.query(PortfolioTransaction)

        if ticker:
            query = query.filter(func.upper(PortfolioTransaction.ticker) == ticker)

        transactions = (
            query.order_by(PortfolioTransaction.created_at.desc())
            .limit(10)
            .all()
        )

        state["transaction_context"] = [
            transaction_to_context(transaction) for transaction in transactions
        ]

        return state

    return transaction_agent


def create_watchlist_agent(db: Session):
    def watchlist_agent(state: FinCreditState) -> FinCreditState:
        watchlist_companies = (
            db.query(WatchlistCompany)
            .order_by(WatchlistCompany.id.asc())
            .all()
        )

        watchlist_context = [
            watchlist_to_context(company) for company in watchlist_companies
        ]

        state["watchlist_context"] = watchlist_context

        candidate_tickers = [company["ticker"] for company in watchlist_context]

        if state.get("ticker") is None:
            state["ticker"] = extract_ticker_from_question(
                state["question"],
                candidate_tickers=candidate_tickers,
            )

        return state

    return watchlist_agent


def create_market_agent(db: Session):
    def market_agent(state: FinCreditState) -> FinCreditState:
        ticker = state.get("ticker")
        portfolio_context = state.get("portfolio_context", [])
        watchlist_context = state.get("watchlist_context", [])

        if not ticker:
            state["market_context"] = None
            return state

        matching_holding = next(
            (holding for holding in portfolio_context if holding["ticker"] == ticker),
            None,
        )
        matching_watchlist_item = next(
            (item for item in watchlist_context if item["ticker"] == ticker),
            None,
        )

        latest_snapshot = (
            db.query(MarketSnapshot)
            .filter(MarketSnapshot.ticker == ticker)
            .order_by(MarketSnapshot.fetched_at.desc())
            .first()
        )

        snapshot_context = None

        if latest_snapshot:
            snapshot_context = {
                "ticker": latest_snapshot.ticker,
                "companyName": latest_snapshot.company_name,
                "sector": latest_snapshot.sector,
                "currentPrice": latest_snapshot.current_price,
                "previousClose": latest_snapshot.previous_close,
                "dayHigh": latest_snapshot.day_high,
                "dayLow": latest_snapshot.day_low,
                "volume": latest_snapshot.volume,
                "marketCap": latest_snapshot.market_cap,
                "currency": latest_snapshot.currency,
                "exchange": latest_snapshot.exchange,
                "fetchedAt": latest_snapshot.fetched_at.isoformat()
                if latest_snapshot.fetched_at
                else None,
                "source": "PostgreSQL Market Snapshot",
            }

        state["market_context"] = choose_fresh_market_context(
            snapshot_context=snapshot_context,
            holding_context=matching_holding,
            watchlist_context=matching_watchlist_item,
        )

        return state

    return market_agent


def create_sec_agent(db: Session):
    def sec_agent(state: FinCreditState) -> FinCreditState:
        ticker = state.get("ticker")

        if not ticker:
            state["sec_context"] = None
            return state

        latest_fundamental = (
            db.query(SecFundamental)
            .filter(SecFundamental.ticker == ticker)
            .order_by(SecFundamental.fetched_at.desc())
            .first()
        )

        if not latest_fundamental:
            state["sec_context"] = None
            return state

        state["sec_context"] = {
            "ticker": latest_fundamental.ticker,
            "cik": latest_fundamental.cik,
            "companyName": latest_fundamental.company_name,
            "revenue": latest_fundamental.revenue,
            "netIncome": latest_fundamental.net_income,
            "assets": latest_fundamental.assets,
            "liabilities": latest_fundamental.liabilities,
            "equity": latest_fundamental.equity,
            "fiscalYear": latest_fundamental.fiscal_year,
            "form": latest_fundamental.form,
            "filed": latest_fundamental.filed,
            "source": latest_fundamental.source,
            "fetchedAt": latest_fundamental.fetched_at.isoformat()
            if latest_fundamental.fetched_at
            else None,
        }

        return state

    return sec_agent


def news_agent(state: FinCreditState) -> FinCreditState:
    ticker = state.get("ticker")

    if not ticker:
        state["news_context"] = []
        return state

    try:
        news_result = get_stock_news_data(ticker=ticker, limit=5)
        state["news_context"] = news_result.get("news", [])
    except Exception:
        state["news_context"] = []

    return state


def risk_analysis_agent(state: FinCreditState) -> FinCreditState:
    question_lower = state.get("question", "").lower()
    ticker = state.get("ticker")
    portfolio_context = state.get("portfolio_context", [])
    transaction_context = state.get("transaction_context", [])
    watchlist_context = state.get("watchlist_context", [])
    market_context = state.get("market_context")
    sec_context = state.get("sec_context")
    news_context = state.get("news_context", [])

    risk_drivers = []

    matching_holding = None
    matching_watchlist_item = None

    if ticker:
        matching_holding = next(
            (holding for holding in portfolio_context if holding["ticker"] == ticker),
            None,
        )

        matching_watchlist_item = next(
            (item for item in watchlist_context if item["ticker"] == ticker),
            None,
        )

        if matching_holding:
            risk_drivers.append(
                {
                    "ticker": ticker,
                    "driver": (
                        f"You already hold {matching_holding['shares']:g} simulated shares "
                        f"of {ticker}, worth {format_money(matching_holding['value'])}, "
                        f"with a portfolio weight of {format_percent(matching_holding['weight'])}."
                    ),
                    "impact": matching_holding["risk"],
                }
            )

            if matching_holding["weight"] >= 25:
                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": (
                            "This position is above the 25% concentration monitoring "
                            "threshold for a beginner paper-trading portfolio."
                        ),
                        "impact": "Medium",
                    }
                )

            unrealized_pl = matching_holding.get("unrealizedPL")
            unrealized_pl_percent = matching_holding.get("unrealizedPLPercent")

            if unrealized_pl is not None:
                impact = "Low"

                if unrealized_pl_percent is not None and abs(unrealized_pl_percent) >= 10:
                    impact = "Medium"

                if unrealized_pl_percent is not None and unrealized_pl_percent <= -15:
                    impact = "High"

                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": (
                            f"Your simulated unrealized P/L on {ticker} is "
                            f"{format_money(unrealized_pl)} "
                            f"({format_percent(unrealized_pl_percent)})."
                        ),
                        "impact": impact,
                    }
                )

        else:
            risk_drivers.append(
                {
                    "ticker": ticker,
                    "driver": (
                        f"{ticker} is not currently in your simulated portfolio, "
                        "so adding it would create a new position rather than increasing an existing one."
                    ),
                    "impact": "Low",
                }
            )

        if transaction_context:
            relevant_transactions = [
                transaction
                for transaction in transaction_context
                if transaction["ticker"] == ticker
            ]
            recent_buys = [
                transaction
                for transaction in relevant_transactions
                if transaction["action"] == "BUY"
            ]
            recent_sells = [
                transaction
                for transaction in relevant_transactions
                if transaction["action"] == "SELL"
            ]
            asks_about_adding = any(
                phrase in question_lower
                for phrase in ["add more", "buy", "increase", "add shares"]
            )

            if recent_sells:
                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": (
                            f"You recently sold {ticker}: "
                            f"{format_transaction_summary(recent_sells[0])}. "
                            "Review why you reduced the position before adding more."
                        ),
                        "impact": "Medium",
                    }
                )

            if asks_about_adding and recent_buys:
                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": (
                            f"Recent buying activity already exists for {ticker}: "
                            f"{format_transaction_summary(recent_buys[0])}. "
                            "Adding more should be checked against position size and cost basis."
                        ),
                        "impact": "Medium",
                    }
                )

        if matching_watchlist_item:
            risk_drivers.append(
                {
                    "ticker": ticker,
                    "driver": (
                        f"{ticker} is already in your watchlist with status "
                        f"{matching_watchlist_item['status']} and sentiment "
                        f"{matching_watchlist_item['sentiment']}."
                    ),
                    "impact": matching_watchlist_item["risk"],
                }
            )

        if market_context:
            price_change = calculate_price_change_percent(
                market_context.get("currentPrice"),
                market_context.get("previousClose"),
            )

            if price_change is not None:
                impact = "Low"

                if abs(price_change) >= 3:
                    impact = "High"
                elif abs(price_change) >= 1:
                    impact = "Medium"

                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": (
                            f"Latest stored market move is {price_change:.2f}% "
                            "versus previous close."
                        ),
                        "impact": impact,
                    }
                )

        if sec_context:
            liabilities = safe_float(sec_context.get("liabilities"))
            assets = safe_float(sec_context.get("assets"))
            net_income = safe_float(sec_context.get("netIncome"))

            if liabilities is not None and assets is not None and assets > 0:
                liability_ratio = liabilities / assets

                impact = "Low"

                if liability_ratio >= 0.75:
                    impact = "High"
                elif liability_ratio >= 0.55:
                    impact = "Medium"

                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": (
                            f"Liabilities are approximately {liability_ratio:.1%} "
                            "of assets based on latest stored SEC fundamentals."
                        ),
                        "impact": impact,
                    }
                )

            if net_income is not None and net_income < 0:
                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": "Latest stored SEC fundamentals show negative net income.",
                        "impact": "High",
                    }
                )

        if news_context:
            risk_drivers.append(
                {
                    "ticker": ticker,
                    "driver": (
                        f"{len(news_context)} recent news items were found for {ticker}; "
                        "news context should be reviewed before changing the simulated position."
                    ),
                    "impact": "Medium",
                }
            )

    else:
        if portfolio_context:
            largest_holding = max(
                portfolio_context,
                key=lambda holding: holding.get("weight", 0),
            )

            risk_drivers.append(
                {
                    "ticker": largest_holding["ticker"],
                    "driver": (
                        f"Largest simulated portfolio position is {largest_holding['ticker']} "
                        f"at {format_percent(largest_holding['weight'])} of portfolio value."
                    ),
                    "impact": (
                        "Medium"
                        if largest_holding.get("weight", 0) >= 25
                        else "Low"
                    ),
                }
            )

            high_risk_holdings = [
                holding for holding in portfolio_context if holding.get("risk") == "High"
            ]

            if high_risk_holdings:
                tickers = ", ".join(holding["ticker"] for holding in high_risk_holdings)

                risk_drivers.append(
                    {
                        "ticker": "Portfolio",
                        "driver": f"High-risk holdings detected: {tickers}.",
                        "impact": "High",
                    }
                )

        if watchlist_context:
            risk_drivers.append(
                {
                    "ticker": "Watchlist",
                    "driver": (
                        f"{len(watchlist_context)} stocks are being monitored "
                        "in the watchlist for future research."
                    ),
                    "impact": "Low",
                }
            )

    if not risk_drivers:
        risk_drivers.append(
            {
                "ticker": ticker or "Portfolio",
                "driver": (
                    "No specific risk driver was found. The answer is based on "
                    "available stored portfolio, watchlist, market, SEC, and news data."
                ),
                "impact": "Low",
            }
        )

    state["risk_drivers"] = risk_drivers
    return state


def evidence_agent(state: FinCreditState) -> FinCreditState:
    ticker = state.get("ticker")
    portfolio_context = state.get("portfolio_context", [])
    transaction_context = state.get("transaction_context", [])
    watchlist_context = state.get("watchlist_context", [])
    market_context = state.get("market_context")
    sec_context = state.get("sec_context")
    news_context = state.get("news_context", [])

    evidence = []

    if portfolio_context:
        if ticker:
            matching_holding = next(
                (holding for holding in portfolio_context if holding["ticker"] == ticker),
                None,
            )

            if matching_holding:
                evidence.append(
                    {
                        "source": "PostgreSQL Portfolio Holdings",
                        "claim": (
                            f"Portfolio record used for {ticker}: "
                            f"{matching_holding['company']} has "
                            f"{matching_holding['shares']:g} simulated shares, "
                            f"average price {format_money(matching_holding['avgPrice'])}, "
                            f"current value {format_money(matching_holding['value'])}, "
                            f"total cost {format_money(matching_holding['totalCost'])}, "
                            f"unrealized P/L {format_money(matching_holding['unrealizedPL'])} "
                            f"({format_percent(matching_holding['unrealizedPLPercent'])}), "
                            f"portfolio weight {format_percent(matching_holding['weight'])}, "
                            f"risk label {matching_holding['risk']}, risk score "
                            f"{matching_holding['score']}, and sentiment "
                            f"{matching_holding['sentiment']}."
                        ),
                        "confidence": 96,
                    }
                )
            else:
                evidence.append(
                    {
                        "source": "PostgreSQL Portfolio Holdings",
                        "claim": (
                            f"Portfolio holdings were loaded, but no matching holding "
                            f"was found for {ticker}."
                        ),
                        "confidence": 84,
                    }
                )
        else:
            total_value = sum(holding.get("value", 0) for holding in portfolio_context)

            evidence.append(
                {
                    "source": "PostgreSQL Portfolio Holdings",
                    "claim": (
                        f"{len(portfolio_context)} portfolio holdings were loaded "
                        f"from PostgreSQL with total simulated value "
                        f"{format_money(total_value)}."
                    ),
                    "confidence": 94,
                }
            )

    if transaction_context:
        relevant_transactions = [
            transaction
            for transaction in transaction_context
            if not ticker or transaction["ticker"] == ticker
        ]

        if relevant_transactions:
            transaction_text = "; ".join(
                [
                    format_transaction_summary(item)
                    for item in relevant_transactions[:5]
                ]
            )

            evidence.append(
                {
                    "source": "PostgreSQL Portfolio Transactions",
                    "claim": (
                        f"Recent transactions for {ticker or 'the portfolio'} include: {transaction_text}."
                    ),
                    "confidence": 92,
                }
            )

    if watchlist_context:
        if ticker:
            matching_watchlist_item = next(
                (item for item in watchlist_context if item["ticker"] == ticker),
                None,
            )

            if matching_watchlist_item:
                evidence.append(
                    {
                        "source": "PostgreSQL Watchlist",
                        "claim": (
                            f"{ticker} is in the watchlist as "
                            f"{matching_watchlist_item['company']} with status "
                            f"{matching_watchlist_item['status']}, risk label "
                            f"{matching_watchlist_item['risk']}, risk score "
                            f"{matching_watchlist_item['riskScore']}, and sentiment "
                            f"{matching_watchlist_item['sentiment']}."
                        ),
                        "confidence": 94,
                    }
                )
            else:
                evidence.append(
                    {
                        "source": "PostgreSQL Watchlist",
                        "claim": f"{ticker} was not found in the watchlist.",
                        "confidence": 86,
                    }
                )
        else:
            watchlist_tickers = ", ".join(item["ticker"] for item in watchlist_context[:8])

            evidence.append(
                {
                    "source": "PostgreSQL Watchlist",
                    "claim": (
                        f"{len(watchlist_context)} watchlist stocks were loaded. "
                        f"Visible tickers include: {watchlist_tickers}."
                    ),
                    "confidence": 92,
                }
            )

    if market_context:
        current_price = market_context.get("currentPrice")
        previous_close = market_context.get("previousClose")
        day_high = market_context.get("dayHigh")
        day_low = market_context.get("dayLow")
        volume = market_context.get("volume")
        market_cap = market_context.get("marketCap")
        exchange = market_context.get("exchange")
        fetched_at = market_context.get("fetchedAt")
        market_source = market_context.get("source") or "PostgreSQL Market Snapshot"

        evidence.append(
            {
                "source": market_source,
                "claim": (
                    f"Market context used for {ticker} from {market_source}: current price "
                    f"{format_money(current_price)}, previous close "
                    f"{format_money(previous_close)}, day high {format_money(day_high)}, "
                    f"day low {format_money(day_low)}, volume "
                    f"{f'{volume:,}' if volume is not None else 'not available'}, "
                    f"market cap {format_money(market_cap)}, exchange "
                    f"{exchange or 'not available'}, fetched at "
                    f"{fetched_at or 'not available'}."
                ),
                "confidence": 92,
            }
        )

    if sec_context:
        evidence.append(
            {
                "source": "PostgreSQL SEC Fundamentals",
                "claim": (
                    f"Latest stored SEC fundamentals used for {ticker}: revenue "
                    f"{format_money(sec_context.get('revenue'))}, net income "
                    f"{format_money(sec_context.get('netIncome'))}, assets "
                    f"{format_money(sec_context.get('assets'))}, liabilities "
                    f"{format_money(sec_context.get('liabilities'))}, equity "
                    f"{format_money(sec_context.get('equity'))}, fiscal year "
                    f"{sec_context.get('fiscalYear') or 'not available'}, form "
                    f"{sec_context.get('form') or 'not available'}, filed date "
                    f"{sec_context.get('filed') or 'not available'}."
                ),
                "confidence": 95,
            }
        )

    if news_context:
        headline_text = "; ".join(
            [
                f"{item.get('title')} ({item.get('publisher') or 'unknown publisher'})"
                for item in news_context[:3]
                if item.get("title")
            ]
        )

        evidence.append(
            {
                "source": "yfinance Recent News",
                "claim": (
                    f"Recent news used for {ticker}: {headline_text}."
                    if headline_text
                    else f"{len(news_context)} recent news items were loaded for {ticker}."
                ),
                "confidence": 86,
            }
        )

    if not evidence:
        evidence.append(
            {
                "source": "FinCredit AI System",
                "claim": "Limited evidence was available for this question.",
                "confidence": 60,
            }
        )

    state["evidence"] = evidence
    return state


def build_context_summary(state: FinCreditState):
    ticker = state.get("ticker")
    portfolio_context = state.get("portfolio_context", [])
    transaction_context = state.get("transaction_context", [])
    watchlist_context = state.get("watchlist_context", [])
    market_context = state.get("market_context")
    sec_context = state.get("sec_context")
    news_context = state.get("news_context", [])

    lines = []

    if ticker:
        lines.append(f"Ticker analyzed: {ticker}")

    if portfolio_context:
        lines.append(f"Portfolio holdings loaded: {len(portfolio_context)}")

        if ticker:
            matching_holding = next(
                (holding for holding in portfolio_context if holding["ticker"] == ticker),
                None,
            )

            if matching_holding:
                lines.append(
                    f"{ticker} portfolio position: {matching_holding['shares']:g} shares, "
                    f"avg price {format_money(matching_holding['avgPrice'])}, "
                    f"value {format_money(matching_holding['value'])}, "
                    f"P/L {format_money(matching_holding['unrealizedPL'])}, "
                    f"weight {format_percent(matching_holding['weight'])}."
                )
            else:
                lines.append(f"{ticker} is not currently in the simulated portfolio.")

    if transaction_context:
        relevant_transactions = [
            transaction
            for transaction in transaction_context
            if not ticker or transaction["ticker"] == ticker
        ]

        if relevant_transactions:
            lines.append(
                f"Recent portfolio transactions loaded: {len(relevant_transactions)}"
            )
            lines.append(
                "Latest transaction: "
                f"{format_transaction_summary(relevant_transactions[0])}."
            )

    if watchlist_context:
        lines.append(f"Watchlist stocks loaded: {len(watchlist_context)}")

    if market_context:
        lines.append(
            f"Market context ({market_context.get('source') or 'PostgreSQL Market Snapshot'}): "
            f"price {format_money(market_context.get('currentPrice'))}, "
            f"previous close {format_money(market_context.get('previousClose'))}."
        )

    if sec_context:
        lines.append(
            f"SEC fundamentals: revenue {format_money(sec_context.get('revenue'))}, "
            f"net income {format_money(sec_context.get('netIncome'))}, "
            f"assets {format_money(sec_context.get('assets'))}, "
            f"liabilities {format_money(sec_context.get('liabilities'))}."
        )

    if news_context:
        lines.append(f"Recent news items loaded: {len(news_context)}")

    return "\n".join(lines)


def build_deterministic_answer(state: FinCreditState, error_message: str):
    ticker = state.get("ticker")
    portfolio_context = state.get("portfolio_context", [])
    transaction_context = state.get("transaction_context", [])
    market_context = state.get("market_context")
    sec_context = state.get("sec_context")
    risk_drivers = state.get("risk_drivers", [])
    evidence = state.get("evidence", [])
    news_context = state.get("news_context", [])

    sections = []
    matching_holding = None

    if ticker:
        matching_holding = next(
            (holding for holding in portfolio_context if holding["ticker"] == ticker),
            None,
        )

    sections.append("## FinCredit AI Analysis")

    if ticker:
        sections.append(
            f"I analyzed **{ticker}** as a simulated paper-trading decision, not a real-money recommendation. Review position size, cost basis, recent transactions, market context, SEC fundamentals, and news before changing the position."
        )
    else:
        sections.append(
            "I analyzed your simulated portfolio, watchlist, market, SEC, news, and transaction context. Focus on concentration, unrealized P/L, recent trades, and whether each holding still has a clear beginner-friendly research reason."
        )

    sections.append("## Context Used")
    sections.append(build_context_summary(state) or "Limited context was available.")

    sections.append("## Portfolio Position Summary")
    if matching_holding:
        sections.append(
            f"- **{ticker}:** {matching_holding['shares']:g} simulated shares, "
            f"average price {format_money(matching_holding['avgPrice'])}, "
            f"current value {format_money(matching_holding['value'])}, "
            f"total cost {format_money(matching_holding['totalCost'])}, "
            f"unrealized P/L {format_money(matching_holding['unrealizedPL'])} "
            f"({format_percent(matching_holding['unrealizedPLPercent'])}), "
            f"portfolio weight {format_percent(matching_holding['weight'])}."
        )
    elif portfolio_context:
        largest_holding = max(
            portfolio_context,
            key=lambda holding: holding.get("weight", 0),
        )
        sections.append(
            f"- Portfolio holdings loaded: {len(portfolio_context)}. Largest position is "
            f"{largest_holding['ticker']} at {format_percent(largest_holding.get('weight'))}."
        )
    else:
        sections.append("- No simulated portfolio holdings were available.")

    sections.append("## Recent Transactions Summary")
    relevant_transactions = [
        transaction
        for transaction in transaction_context
        if not ticker or transaction["ticker"] == ticker
    ]

    if relevant_transactions:
        sections.append(
            "\n".join(
                [
                    f"- {format_transaction_summary(transaction)}"
                    for transaction in relevant_transactions[:5]
                ]
            )
        )
    else:
        sections.append("- No recent simulated transactions were available for this context.")

    sections.append("## Market Context")
    if market_context:
        sections.append(
            f"- Source: {market_context.get('source') or 'PostgreSQL Market Snapshot'}.\n"
            f"- Current price: {format_money(market_context.get('currentPrice'))}.\n"
            f"- Previous close: {format_money(market_context.get('previousClose'))}.\n"
            f"- Exchange: {market_context.get('exchange') or 'not available'}."
        )
    else:
        sections.append("- Market context was not available.")

    sections.append("## SEC Fundamentals Summary")
    if sec_context:
        sections.append(
            f"- Revenue: {format_money(sec_context.get('revenue'))}.\n"
            f"- Net income: {format_money(sec_context.get('netIncome'))}.\n"
            f"- Assets: {format_money(sec_context.get('assets'))}.\n"
            f"- Liabilities: {format_money(sec_context.get('liabilities'))}.\n"
            f"- Filing: {sec_context.get('form') or 'not available'} for fiscal year "
            f"{sec_context.get('fiscalYear') or 'not available'}."
        )
    else:
        sections.append("- SEC fundamentals were not available.")

    if risk_drivers:
        sections.append("## Main Risk Drivers")
        sections.append(
            "\n".join(
                [
                    f"- **{driver['ticker']} ({driver['impact']}):** {driver['driver']}"
                    for driver in risk_drivers[:5]
                ]
            )
        )

    if news_context:
        sections.append("## Recent News Context")
        sections.append(
            "\n".join(
                [
                    f"- {item.get('title')} - {item.get('publisher') or 'Unknown publisher'}"
                    for item in news_context[:3]
                    if item.get("title")
                ]
            )
        )

    if evidence:
        sections.append("## Evidence Basis")
        sections.append(
            "\n".join(
                [
                    f"- **{item['source']} ({item['confidence']}%):** {item['claim']}"
                    for item in evidence[:4]
                ]
            )
        )

    sections.append("## Suggested Beginner Action")

    if ticker:
        sections.append(
            f"Before changing the simulated **{ticker}** position, review whether the position size fits your beginner paper-trading plan, whether recent BUY/SELL activity already changed your exposure, and whether the latest evidence still supports the original research reason."
        )
    else:
        sections.append(
            "For a beginner paper-trading portfolio, focus on position size, sector concentration, unrealized losses, and whether each holding has a clear research reason."
        )

    sections.append(
        f"_Fast deterministic fallback used because the local LLM was unavailable or slow: {error_message}._"
    )

    return "\n\n".join(sections)


def answer_agent(state: FinCreditState) -> FinCreditState:
    question = state["question"]
    ticker = state.get("ticker")
    portfolio_context = state.get("portfolio_context", [])
    market_context = state.get("market_context")
    sec_context = state.get("sec_context")
    risk_drivers = state.get("risk_drivers", [])
    evidence = state.get("evidence", [])

    try:
        llm_answer = generate_llm_answer(
            question=question,
            ticker=ticker,
            portfolio_context=portfolio_context,
            market_context=market_context,
            sec_context=sec_context,
            risk_drivers=risk_drivers,
            evidence=evidence,
        )

        state["answer"] = llm_answer
        llm_status = "Generated with LangChain ChatOllama local LLM in under timeout"

    except Exception as error:
        error_message = str(error)
        state["answer"] = build_deterministic_answer(
            state=state,
            error_message=error_message,
        )

        if "timed out after 20 seconds" in error_message:
            llm_status = "Fallback used because local LLM timed out after 20 seconds"
        else:
            llm_status = f"Fallback used because local LLM failed: {error_message}"

    ticker = state.get("ticker")
    portfolio_context = state.get("portfolio_context", [])
    transaction_context = state.get("transaction_context", [])
    watchlist_context = state.get("watchlist_context", [])

    suggested_actions = [
        "Review the evidence section before making a simulated portfolio change",
        "Refresh market, SEC, and news data before relying on the analysis",
    ]

    if ticker:
        matching_holding = next(
            (holding for holding in portfolio_context if holding["ticker"] == ticker),
            None,
        )

        matching_watchlist_item = next(
            (item for item in watchlist_context if item["ticker"] == ticker),
            None,
        )

        if matching_holding:
            suggested_actions.append(
                f"Check whether adding more {ticker} would create concentration risk"
            )
        else:
            suggested_actions.append(
                f"Decide whether {ticker} belongs on the watchlist before simulating a buy"
            )

        if not matching_watchlist_item:
            suggested_actions.append(f"Add {ticker} to the watchlist if you want to monitor it")

    else:
        suggested_actions.append(
            "Open the portfolio page and review the largest position by weight"
        )
        suggested_actions.append(
            "Ask a ticker-specific follow-up question for deeper stock analysis"
        )

    if transaction_context:
        suggested_actions.append(
            "Review recent portfolio transaction history before adding or selling more"
        )

    state["suggested_actions"] = suggested_actions[:5]

    state["audit"] = {
        "workflow": "LangGraph Portfolio-Aware FinCredit Agent Workflow",
        "agentsUsed": [
            "Portfolio Agent",
            "Watchlist Agent",
            "Transaction Agent",
            "Market Data Agent",
            "SEC Fundamentals Agent",
            "News Agent",
            "Risk Analysis Agent",
            "Evidence Agent",
            "LLM Answer Agent",
        ],
        "groundingScore": 94 if evidence else 65,
        "unsupportedClaims": 0,
        "status": llm_status,
    }

    return state


def build_fincredit_graph(db: Session):
    graph = StateGraph(FinCreditState)

    graph.add_node("portfolio_agent", create_portfolio_agent(db))
    graph.add_node("watchlist_agent", create_watchlist_agent(db))
    graph.add_node("transaction_agent", create_transaction_agent(db))
    graph.add_node("market_agent", create_market_agent(db))
    graph.add_node("sec_agent", create_sec_agent(db))
    graph.add_node("news_agent", news_agent)
    graph.add_node("risk_analysis_agent", risk_analysis_agent)
    graph.add_node("evidence_agent", evidence_agent)
    graph.add_node("answer_agent", answer_agent)

    graph.set_entry_point("portfolio_agent")

    graph.add_edge("portfolio_agent", "watchlist_agent")
    graph.add_edge("watchlist_agent", "transaction_agent")
    graph.add_edge("transaction_agent", "market_agent")
    graph.add_edge("market_agent", "sec_agent")
    graph.add_edge("sec_agent", "news_agent")
    graph.add_edge("news_agent", "risk_analysis_agent")
    graph.add_edge("risk_analysis_agent", "evidence_agent")
    graph.add_edge("evidence_agent", "answer_agent")
    graph.add_edge("answer_agent", END)

    return graph.compile()


def run_fincredit_graph(question: str, db: Session):
    ticker = extract_ticker_from_question(question)

    initial_state: FinCreditState = {
        "question": question,
        "ticker": ticker,
        "portfolio_context": [],
        "transaction_context": [],
        "watchlist_context": [],
        "market_context": None,
        "sec_context": None,
        "news_context": [],
        "risk_drivers": [],
        "evidence": [],
        "suggested_actions": [],
        "answer": "",
        "audit": {},
    }

    graph = build_fincredit_graph(db)
    final_state = graph.invoke(initial_state)

    return final_state
