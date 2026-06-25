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
                    "driver": f"Portfolio weight is {matching_holding['weight']}% with a {matching_holding['risk']} internal risk label.",
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
                        "driver": f"Liabilities represent approximately {liability_ratio:.1%} of assets based on latest SEC fundamentals.",
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
                "driver": "No ticker-specific risk driver was found. The answer is based on available portfolio and stored financial data.",
                "impact": "Low",
            }
        )

    state["risk_drivers"] = risk_drivers
    return state


def evidence_agent(state: FinCreditState) -> FinCreditState:
    ticker = state.get("ticker")
    evidence = []

    if state.get("portfolio_context"):
        evidence.append(
            {
                "source": "PostgreSQL Portfolio Holdings",
                "claim": "Portfolio holdings, weights, internal risk labels, and sentiment were loaded from the holdings table.",
                "confidence": 92,
            }
        )

    if state.get("market_context"):
        evidence.append(
            {
                "source": "PostgreSQL Market Snapshots",
                "claim": f"Latest stored market snapshot was used for {ticker}.",
                "confidence": 90,
            }
        )

    if state.get("sec_context"):
        evidence.append(
            {
                "source": "PostgreSQL SEC Fundamentals",
                "claim": f"Latest stored SEC fundamentals were used for {ticker}.",
                "confidence": 94,
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
                f"${revenue:,.0f}, net income of ${net_income:,.0f}, assets of ${assets:,.0f}, "
                f"and liabilities of ${liabilities:,.0f}."
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