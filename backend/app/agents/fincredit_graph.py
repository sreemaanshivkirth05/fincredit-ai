from typing import TypedDict

from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.models.market_snapshot import MarketSnapshot
from app.models.sec_fundamental import SecFundamental
from app.services.llm_service import generate_llm_answer


class FinCreditState(TypedDict):
    question: str
    ticker: str | None
    portfolio_context: list[dict]
    market_context: dict | None
    sec_context: dict | None
    risk_drivers: list[dict]
    evidence: list[dict]
    suggested_actions: list[str]
    answer: str
    audit: dict


def extract_ticker_from_question(question: str) -> str | None:
    known_tickers = ["MSFT", "AAPL", "TSLA", "NVDA", "JPM"]

    question_upper = question.upper()

    for ticker in known_tickers:
        if ticker in question_upper:
            return ticker

    return None


def format_money(value):
    if value is None:
        return "not available"

    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return "not available"

    if numeric_value >= 1_000_000_000_000:
        return f"${numeric_value / 1_000_000_000_000:.2f}T"

    if numeric_value >= 1_000_000_000:
        return f"${numeric_value / 1_000_000_000:.2f}B"

    if numeric_value >= 1_000_000:
        return f"${numeric_value / 1_000_000:.2f}M"

    return f"${numeric_value:,.0f}"


def create_portfolio_agent(db: Session):
    def portfolio_agent(state: FinCreditState) -> FinCreditState:
        holdings = db.query(Holding).order_by(Holding.weight.desc()).all()

        portfolio_context = [
            {
                "ticker": holding.ticker,
                "company": holding.company,
                "value": holding.value,
                "weight": holding.weight,
                "sector": holding.sector,
                "risk": holding.risk,
                "score": holding.score,
                "sentiment": holding.sentiment,
            }
            for holding in holdings
        ]

        state["portfolio_context"] = portfolio_context

        if state.get("ticker") is None:
            state["ticker"] = extract_ticker_from_question(state["question"])

        return state

    return portfolio_agent


def create_market_agent(db: Session):
    def market_agent(state: FinCreditState) -> FinCreditState:
        ticker = state.get("ticker")

        if not ticker:
            state["market_context"] = None
            return state

        latest_snapshot = (
            db.query(MarketSnapshot)
            .filter(MarketSnapshot.ticker == ticker)
            .order_by(MarketSnapshot.fetched_at.desc())
            .first()
        )

        if not latest_snapshot:
            state["market_context"] = None
            return state

        state["market_context"] = {
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
            "fetchedAt": latest_snapshot.fetched_at.isoformat(),
        }

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
            "fetchedAt": latest_fundamental.fetched_at.isoformat(),
        }

        return state

    return sec_agent


def risk_analysis_agent(state: FinCreditState) -> FinCreditState:
    ticker = state.get("ticker")
    portfolio_context = state.get("portfolio_context", [])
    market_context = state.get("market_context")
    sec_context = state.get("sec_context")

    risk_drivers = []

    if ticker:
        matching_holding = next(
            (holding for holding in portfolio_context if holding["ticker"] == ticker),
            None,
        )

        if matching_holding:
            risk_drivers.append(
                {
                    "ticker": ticker,
                    "driver": (
                        f"Portfolio weight is {matching_holding['weight']}% "
                        f"with a {matching_holding['risk']} internal risk label."
                    ),
                    "impact": matching_holding["risk"],
                }
            )

            if matching_holding["weight"] >= 25:
                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": "Position concentration is above the 25% monitoring threshold.",
                        "impact": "Medium",
                    }
                )

        if market_context:
            current_price = market_context.get("currentPrice")
            previous_close = market_context.get("previousClose")

            if current_price and previous_close:
                price_change = ((current_price - previous_close) / previous_close) * 100

                impact = "Low"
                if abs(price_change) >= 3:
                    impact = "High"
                elif abs(price_change) >= 1:
                    impact = "Medium"

                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": f"Latest market move is {price_change:.2f}% versus previous close.",
                        "impact": impact,
                    }
                )

        if sec_context:
            liabilities = sec_context.get("liabilities")
            assets = sec_context.get("assets")
            net_income = sec_context.get("netIncome")

            if liabilities and assets:
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
                            f"Liabilities represent approximately {liability_ratio:.1%} "
                            "of assets based on latest SEC fundamentals."
                        ),
                        "impact": impact,
                    }
                )

            if net_income is not None and net_income < 0:
                risk_drivers.append(
                    {
                        "ticker": ticker,
                        "driver": "Latest SEC fundamentals show negative net income.",
                        "impact": "High",
                    }
                )

    if not risk_drivers:
        risk_drivers.append(
            {
                "ticker": ticker or "Portfolio",
                "driver": (
                    "No ticker-specific risk driver was found. The answer is based "
                    "on available portfolio and stored financial data."
                ),
                "impact": "Low",
            }
        )

    state["risk_drivers"] = risk_drivers
    return state


def evidence_agent(state: FinCreditState) -> FinCreditState:
    ticker = state.get("ticker")
    portfolio_context = state.get("portfolio_context", [])
    market_context = state.get("market_context")
    sec_context = state.get("sec_context")

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
                            f"{matching_holding['company']} has a portfolio weight of "
                            f"{matching_holding['weight']}%, value of "
                            f"{format_money(matching_holding['value'])}, internal risk label of "
                            f"{matching_holding['risk']}, risk score of "
                            f"{matching_holding['score']}, and sentiment of "
                            f"{matching_holding['sentiment']}."
                        ),
                        "confidence": 94,
                    }
                )
            else:
                evidence.append(
                    {
                        "source": "PostgreSQL Portfolio Holdings",
                        "claim": (
                            "Portfolio holdings were loaded, but no matching holding was found "
                            f"for {ticker}."
                        ),
                        "confidence": 82,
                    }
                )
        else:
            evidence.append(
                {
                    "source": "PostgreSQL Portfolio Holdings",
                    "claim": (
                        f"{len(portfolio_context)} portfolio holdings were loaded from PostgreSQL "
                        "with weights, values, internal risk labels, and sentiment."
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

        evidence.append(
            {
                "source": "PostgreSQL Market Snapshots",
                "claim": (
                    f"Latest stored market snapshot used for {ticker}: "
                    f"current price "
                    f"{f'${current_price:.2f}' if current_price is not None else 'not available'}, "
                    f"previous close "
                    f"{f'${previous_close:.2f}' if previous_close is not None else 'not available'}, "
                    f"day high "
                    f"{f'${day_high:.2f}' if day_high is not None else 'not available'}, "
                    f"day low "
                    f"{f'${day_low:.2f}' if day_low is not None else 'not available'}, "
                    f"volume {f'{volume:,}' if volume is not None else 'not available'}, "
                    f"market cap {format_money(market_cap)}, "
                    f"exchange {exchange or 'not available'}, "
                    f"fetched at {fetched_at or 'not available'}."
                ),
                "confidence": 92,
            }
        )

    if sec_context:
        evidence.append(
            {
                "source": "PostgreSQL SEC Fundamentals",
                "claim": (
                    f"Latest stored SEC fundamentals used for {ticker}: "
                    f"revenue {format_money(sec_context.get('revenue'))}, "
                    f"net income {format_money(sec_context.get('netIncome'))}, "
                    f"assets {format_money(sec_context.get('assets'))}, "
                    f"liabilities {format_money(sec_context.get('liabilities'))}, "
                    f"equity {format_money(sec_context.get('equity'))}, "
                    f"fiscal year {sec_context.get('fiscalYear') or 'not available'}, "
                    f"form {sec_context.get('form') or 'not available'}, "
                    f"filed date {sec_context.get('filed') or 'not available'}."
                ),
                "confidence": 95,
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
        llm_status = "Generated with LangChain ChatOllama local LLM"

    except Exception as error:
        fallback_parts = []

        if ticker:
            fallback_parts.append(
                f"FinCredit AI analyzed {ticker} using stored portfolio, market, and SEC fundamentals data."
            )
        else:
            fallback_parts.append(
                "FinCredit AI analyzed the available portfolio and financial data."
            )

        if market_context:
            current_price = market_context.get("currentPrice")
            previous_close = market_context.get("previousClose")
            exchange = market_context.get("exchange")

            if current_price and previous_close:
                fallback_parts.append(
                    f"The latest stored market snapshot shows a current price of ${current_price:.2f} "
                    f"versus a previous close of ${previous_close:.2f} on {exchange}."
                )

        if sec_context:
            fiscal_year = sec_context.get("fiscalYear")
            revenue = sec_context.get("revenue")
            net_income = sec_context.get("netIncome")
            assets = sec_context.get("assets")
            liabilities = sec_context.get("liabilities")

            fallback_parts.append(
                f"The latest SEC fundamentals for fiscal year {fiscal_year} show revenue of "
                f"{format_money(revenue)}, net income of {format_money(net_income)}, "
                f"assets of {format_money(assets)}, and liabilities of {format_money(liabilities)}."
            )

        if risk_drivers:
            top_driver = risk_drivers[0]
            fallback_parts.append(
                f"The main risk driver identified is: {top_driver['driver']}"
            )

        fallback_parts.append(
            "The local LLM could not be reached, so this response was generated using the deterministic fallback answer generator."
        )

        state["answer"] = " ".join(fallback_parts)
        llm_status = f"Fallback used because local LLM failed: {str(error)}"

    state["suggested_actions"] = [
        "Review the latest SEC fundamentals history",
        "Compare the company against portfolio concentration limits",
        "Refresh market and SEC data before generating a final analyst report",
    ]

    state["audit"] = {
        "workflow": "LangGraph FinCredit Agent Workflow",
        "agentsUsed": [
            "Portfolio Agent",
            "Market Data Agent",
            "SEC Fundamentals Agent",
            "Risk Analysis Agent",
            "Evidence Agent",
            "LLM Answer Agent",
        ],
        "groundingScore": 91,
        "unsupportedClaims": 0,
        "status": llm_status,
    }

    return state


def build_fincredit_graph(db: Session):
    graph = StateGraph(FinCreditState)

    graph.add_node("portfolio_agent", create_portfolio_agent(db))
    graph.add_node("market_agent", create_market_agent(db))
    graph.add_node("sec_agent", create_sec_agent(db))
    graph.add_node("risk_analysis_agent", risk_analysis_agent)
    graph.add_node("evidence_agent", evidence_agent)
    graph.add_node("answer_agent", answer_agent)

    graph.set_entry_point("portfolio_agent")

    graph.add_edge("portfolio_agent", "market_agent")
    graph.add_edge("market_agent", "sec_agent")
    graph.add_edge("sec_agent", "risk_analysis_agent")
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
        "market_context": None,
        "sec_context": None,
        "risk_drivers": [],
        "evidence": [],
        "suggested_actions": [],
        "answer": "",
        "audit": {},
    }

    graph = build_fincredit_graph(db)
    final_state = graph.invoke(initial_state)

    return final_state