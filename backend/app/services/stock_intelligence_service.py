from datetime import datetime
from typing import Any

import yfinance as yf
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.market_service import get_market_data
from app.services.news_service import get_stock_news_data
from app.services.portfolio_service import get_portfolio_status
from app.services.sec_service import get_sec_company_facts, normalize_ticker


DISCLAIMER = (
    "FinCredit AI is a paper-trading and education tool. This analysis is not "
    "financial advice and should not be treated as a real-money investment recommendation."
)


def safe_float(value: Any) -> float | None:
    if value is None or value == "":
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    return number if number == number else None


def ratio(numerator: Any, denominator: Any) -> float | None:
    top = safe_float(numerator)
    bottom = safe_float(denominator)

    if top is None or bottom is None or bottom == 0:
        return None

    return top / bottom


def clamp_score(score: float) -> int:
    return max(0, min(100, round(score)))


def status_for_score(score: int, unknown: bool = False) -> str:
    if unknown:
        return "Unknown"
    if score >= 75:
        return "Strong"
    if score >= 50:
        return "Moderate"
    return "Weak"


def valuation_status(score: int, missing: bool = False) -> str:
    if missing:
        return "Unknown"
    if score >= 75:
        return "Moderate"
    if score >= 50:
        return "Demanding"
    return "Elevated"


def fetch_valuation_info(ticker: str) -> tuple[dict[str, Any], list[str]]:
    try:
        info = yf.Ticker(ticker).info or {}
        return info, []
    except Exception:
        return {}, ["Valuation data unavailable from yfinance."]


def available(value: Any) -> bool:
    return safe_float(value) is not None


def build_financial_health(sec_data: dict[str, Any] | None):
    missing = []

    if not sec_data:
        return {
            "revenue": None,
            "netIncome": None,
            "assets": None,
            "liabilities": None,
            "equity": None,
            "profitMarginApprox": None,
            "debtToAssetsApprox": None,
            "returnOnAssetsApprox": None,
            "status": "Unknown",
            "explanation": (
                "SEC fundamentals are unavailable, so financial health should "
                "be researched further before forming a paper-trading thesis."
            ),
            "redFlags": ["SEC fundamentals unavailable."],
            "strengths": [],
            "missingData": ["SEC revenue, income, assets, liabilities, and equity."],
        }

    revenue = safe_float(sec_data.get("revenue"))
    net_income = safe_float(sec_data.get("netIncome"))
    assets = safe_float(sec_data.get("assets"))
    liabilities = safe_float(sec_data.get("liabilities"))
    equity = safe_float(sec_data.get("equity"))
    profit_margin = ratio(net_income, revenue)
    debt_to_assets = ratio(liabilities, assets)
    return_on_assets = ratio(net_income, assets)
    strengths = []
    red_flags = []
    score = 50

    if revenue is None:
        missing.append("Revenue.")
    elif revenue > 0:
        strengths.append("Revenue is positive in the latest SEC snapshot.")
        score += 8

    if net_income is None:
        missing.append("Net income.")
    elif net_income > 0:
        strengths.append("Net income is positive in the latest SEC snapshot.")
        score += 12
    else:
        red_flags.append("Net income is negative.")
        score -= 15

    if profit_margin is None:
        missing.append("Approximate profit margin.")
    elif profit_margin >= 0.15:
        strengths.append("Approximate profit margin appears healthy.")
        score += 10
    elif profit_margin < 0.05:
        red_flags.append("Approximate profit margin appears weak.")
        score -= 10

    if debt_to_assets is None:
        missing.append("Approximate debt/assets.")
    elif debt_to_assets >= 0.75:
        red_flags.append("Liabilities appear high relative to assets.")
        score -= 15
    elif debt_to_assets <= 0.5:
        strengths.append("Liabilities appear manageable relative to assets.")
        score += 8

    if equity is None:
        missing.append("Equity.")
    elif equity > 0:
        strengths.append("Shareholders' equity is positive.")
        score += 8
    else:
        red_flags.append("Shareholders' equity is not positive.")
        score -= 10

    final_score = clamp_score(score)

    return {
        "revenue": revenue,
        "netIncome": net_income,
        "assets": assets,
        "liabilities": liabilities,
        "equity": equity,
        "profitMarginApprox": profit_margin,
        "debtToAssetsApprox": debt_to_assets,
        "returnOnAssetsApprox": return_on_assets,
        "status": status_for_score(final_score, unknown=len(missing) >= 5),
        "explanation": (
            "Financial health is estimated from latest available SEC Company "
            "Facts. This is a screening view, not a complete investment thesis."
        ),
        "redFlags": red_flags,
        "strengths": strengths,
        "missingData": missing,
    }


def build_valuation_check(market_data: dict[str, Any] | None, valuation_info: dict[str, Any], valuation_missing: list[str]):
    pe_ratio = safe_float(valuation_info.get("trailingPE"))
    forward_pe = safe_float(valuation_info.get("forwardPE"))
    price_to_sales = safe_float(valuation_info.get("priceToSalesTrailing12Months"))
    price_to_book = safe_float(valuation_info.get("priceToBook"))
    enterprise_to_revenue = safe_float(valuation_info.get("enterpriseToRevenue"))
    enterprise_to_ebitda = safe_float(valuation_info.get("enterpriseToEbitda"))
    beta = safe_float(valuation_info.get("beta"))
    high = safe_float(valuation_info.get("fiftyTwoWeekHigh"))
    low = safe_float(valuation_info.get("fiftyTwoWeekLow"))
    market_cap = safe_float(valuation_info.get("marketCap") or (market_data or {}).get("marketCap"))
    missing = list(valuation_missing)
    score = 70
    high_risk_signals = 0

    metric_pairs = [
        ("Trailing P/E", pe_ratio),
        ("Forward P/E", forward_pe),
        ("Price/Sales", price_to_sales),
        ("Price/Book", price_to_book),
        ("Enterprise/Revenue", enterprise_to_revenue),
        ("Enterprise/EBITDA", enterprise_to_ebitda),
    ]

    for label, value in metric_pairs:
        if value is None:
            missing.append(label)

    if pe_ratio is not None and pe_ratio > 45:
        high_risk_signals += 1
        score -= 15
    if forward_pe is not None and forward_pe > 35:
        high_risk_signals += 1
        score -= 10
    if price_to_sales is not None and price_to_sales > 10:
        high_risk_signals += 1
        score -= 15
    if price_to_book is not None and price_to_book > 12:
        high_risk_signals += 1
        score -= 8

    if len(missing) >= 5:
        risk = "Unknown"
        explanation = (
            "Valuation evidence is limited because several yfinance valuation "
            "metrics are unavailable."
        )
    elif high_risk_signals >= 2:
        risk = "Elevated"
        explanation = (
            "Valuation appears demanding based on available multiples. This "
            "should be researched further before a simulated decision."
        )
    elif high_risk_signals == 1:
        risk = "Demanding"
        explanation = (
            "Some valuation metrics appear demanding, while evidence remains "
            "incomplete."
        )
    else:
        risk = "Moderate"
        explanation = (
            "Available valuation metrics do not show multiple elevated-risk "
            "signals, but this is still a screening view."
        )

    return {
        "peRatio": pe_ratio,
        "forwardPe": forward_pe,
        "priceToSales": price_to_sales,
        "priceToBook": price_to_book,
        "enterpriseToRevenue": enterprise_to_revenue,
        "enterpriseToEbitda": enterprise_to_ebitda,
        "marketCap": market_cap,
        "beta": beta,
        "fiftyTwoWeekHigh": high,
        "fiftyTwoWeekLow": low,
        "valuationRisk": risk,
        "explanation": explanation,
        "missingData": list(dict.fromkeys(missing)),
        "_score": clamp_score(score),
    }


def build_portfolio_fit(db: Session, ticker: str, current_user: User | None, market_data: dict[str, Any] | None):
    if current_user is None:
        return {
            "isInPortfolio": False,
            "currentWeight": None,
            "sector": (market_data or {}).get("sector"),
            "concentrationMessage": (
                "Login and build a paper portfolio to see personalized portfolio fit."
            ),
            "diversificationImpact": "Portfolio impact is unavailable without user context.",
            "riskDrivers": [],
            "explanation": "Personalized portfolio fit requires an authenticated demo account.",
            "missingData": ["Authenticated portfolio context."],
            "_score": 45,
        }

    try:
        status = get_portfolio_status(db, ticker, current_user.id)
    except Exception:
        status = {"isInPortfolio": False, "holding": None}

    holding = status.get("holding")
    is_in_portfolio = bool(status.get("isInPortfolio"))
    weight = safe_float((holding or {}).get("weight"))
    sector = (holding or {}).get("sector") or (market_data or {}).get("sector")
    risk_drivers = []

    if not is_in_portfolio:
        concentration = (
            f"{ticker} is not currently in the simulated portfolio."
        )
        diversification = (
            "A simulated position could change concentration depending on size, sector, and existing holdings."
        )
        score = 65
    else:
        if weight is not None and weight >= 25:
            risk_drivers.append("Current position weight may increase concentration risk.")
            score = 45
        elif weight is not None and weight >= 15:
            risk_drivers.append("Current position is meaningful and should be reviewed for concentration.")
            score = 60
        else:
            score = 72

        concentration = (
            f"{ticker} is already in the simulated portfolio at "
            f"{weight:.2f}% weight." if weight is not None else
            f"{ticker} is already in the simulated portfolio."
        )
        diversification = (
            "Review whether additional simulated exposure would improve diversification or increase concentration risk."
        )

    return {
        "isInPortfolio": is_in_portfolio,
        "currentWeight": weight,
        "sector": sector,
        "concentrationMessage": concentration,
        "diversificationImpact": diversification,
        "riskDrivers": risk_drivers,
        "explanation": (
            "Portfolio fit is based on the signed-in user's simulated holdings "
            "and should be used for paper-trading education only."
        ),
        "missingData": [] if current_user else ["Authenticated portfolio context."],
        "_score": score,
    }


def scorecard_item(label: str, score: int, explanation: str, drivers: list[str], missing: list[str] | None = None):
    return {
        "label": label,
        "score": clamp_score(score),
        "status": status_for_score(clamp_score(score), unknown=bool(missing) and score == 0),
        "explanation": explanation,
        "drivers": drivers,
        "missingData": missing or [],
    }


def build_evidence_strength(
    market_data: dict[str, Any] | None,
    sec_data: dict[str, Any] | None,
    valuation_check: dict[str, Any],
    news_data: dict[str, Any] | None,
    portfolio_fit: dict[str, Any],
):
    score = 10
    available_sources = ["Deterministic stock intelligence analysis"]
    missing_sources = []

    if market_data:
        score += 25
        available_sources.append("Market data")
    else:
        missing_sources.append("Market data")

    if sec_data:
        score += 25
        available_sources.append("SEC fundamentals")
    else:
        missing_sources.append("SEC fundamentals")

    if len(valuation_check.get("missingData", [])) < 4:
        score += 15
        available_sources.append("Valuation metrics")
    else:
        missing_sources.append("Valuation metrics")

    if news_data and news_data.get("count", 0) > 0:
        score += 15
        available_sources.append("Recent news")
    else:
        missing_sources.append("Recent news")

    if not portfolio_fit.get("missingData"):
        score += 10
        available_sources.append("Portfolio context")
    else:
        missing_sources.append("Portfolio context")

    final_score = clamp_score(score)

    return {
        "score": final_score,
        "status": status_for_score(final_score),
        "sourcesAvailable": available_sources,
        "sourcesMissing": missing_sources,
        "explanation": (
            "Evidence strength reflects how many research sources were available. "
            "Missing sources lower confidence but do not stop the stock page."
        ),
    }


def build_decision_readiness(
    market_data: dict[str, Any] | None,
    sec_data: dict[str, Any] | None,
    valuation_check: dict[str, Any],
    news_data: dict[str, Any] | None,
    portfolio_fit: dict[str, Any],
    red_flags: list[str],
):
    checks = []
    missing = []
    warnings = []

    if market_data:
        checks.append("Market data reviewed")
    else:
        missing.append("Market data unavailable")

    if sec_data:
        checks.append("Fundamentals available")
    else:
        missing.append("Fundamentals unavailable")

    if len(valuation_check.get("missingData", [])) < 4:
        checks.append("Valuation reviewed")
    else:
        missing.append("Valuation evidence limited")

    checks.append("Risks identified")

    if news_data and news_data.get("count", 0) > 0:
        checks.append("News reviewed")
    else:
        missing.append("News unavailable")

    if not portfolio_fit.get("missingData"):
        checks.append("Portfolio fit checked")
    else:
        missing.append("Portfolio fit requires login")

    missing.append("Investment thesis not written yet")

    if red_flags:
        warnings.extend(red_flags[:5])

    score = clamp_score((len(checks) / (len(checks) + len(missing))) * 100)

    return {
        "score": score,
        "status": status_for_score(score),
        "completedChecks": checks,
        "missingChecks": missing,
        "warnings": warnings,
        "explanation": (
            "Decision readiness is incomplete until the user reviews missing "
            "data and writes a paper-trading thesis."
        ),
    }


def build_bull_bear_base(
    ticker: str,
    market_data: dict[str, Any] | None,
    sec_data: dict[str, Any] | None,
    valuation_check: dict[str, Any],
    financial_health: dict[str, Any],
    news_data: dict[str, Any] | None,
):
    evidence = []
    if market_data:
        evidence.append("market data")
    if sec_data:
        evidence.append("SEC fundamentals")
    if news_data and news_data.get("count", 0) > 0:
        evidence.append("recent news")
    if valuation_check.get("valuationRisk") != "Unknown":
        evidence.append("valuation metrics")

    evidence_phrase = ", ".join(evidence) if evidence else "limited available evidence"

    return {
        "bullCase": (
            f"Based on {evidence_phrase}, the bull case for {ticker} may depend "
            "on durable business execution, improving fundamentals, and market "
            "expectations remaining supportive."
        ),
        "bearCase": (
            f"The bear case for {ticker} may involve valuation pressure, weaker "
            "profitability, balance-sheet concerns, negative news momentum, or "
            "portfolio concentration risk."
        ),
        "baseCase": (
            f"The base case is that {ticker} needs more research before a "
            "simulated decision. Evidence should be compared against valuation, "
            "risk, and portfolio fit."
        ),
        "whatCouldGoRight": [
            "Fundamentals remain resilient or improve.",
            "News flow supports confidence in the business outlook.",
            "Valuation risk becomes easier to justify with stronger evidence.",
        ],
        "whatCouldGoWrong": [
            "Valuation appears demanding relative to available evidence.",
            "Risk appears elevated because evidence is limited or mixed.",
            "A simulated position may increase concentration risk.",
        ],
        "whatToMonitor": [
            "Revenue and net income direction",
            "Valuation multiples",
            "Balance-sheet leverage",
            "Recent news catalysts",
            "Portfolio weight and sector concentration",
        ],
        "evidenceUsed": evidence,
        "disclaimer": DISCLAIMER,
    }


def get_stock_intelligence(db: Session, ticker: str, current_user: User | None = None):
    ticker_upper = normalize_ticker(ticker)
    generated_at = datetime.utcnow()
    source_errors = []

    try:
        market_data = get_market_data(ticker_upper, db)
    except Exception:
        market_data = None
        source_errors.append("Market data unavailable.")

    company = (market_data or {}).get("companyName") or ticker_upper

    try:
        sec_data = get_sec_company_facts(ticker_upper, db)
    except Exception:
        sec_data = None
        source_errors.append("SEC fundamentals unavailable.")

    try:
        news_data = get_stock_news_data(ticker_upper, limit=6)
    except Exception:
        news_data = None
        source_errors.append("Recent news unavailable.")

    valuation_info, valuation_source_missing = fetch_valuation_info(ticker_upper)
    valuation_check = build_valuation_check(
        market_data,
        valuation_info,
        valuation_source_missing,
    )
    financial_health = build_financial_health(sec_data)
    portfolio_fit = build_portfolio_fit(db, ticker_upper, current_user, market_data)

    red_flags = []

    if not sec_data:
        red_flags.append("SEC fundamentals unavailable.")
    if len(valuation_check.get("missingData", [])) >= 4:
        red_flags.append("Valuation metrics unavailable or incomplete.")
    if "Liabilities appear high relative to assets." in financial_health["redFlags"]:
        red_flags.append("Liabilities appear high relative to assets.")
    if "Net income is negative." in financial_health["redFlags"]:
        red_flags.append("Net income is negative.")
    if "Approximate profit margin appears weak." in financial_health["redFlags"]:
        red_flags.append("Profit margin appears weak.")

    beta = safe_float(valuation_check.get("beta"))
    if beta is not None and beta > 1.5:
        red_flags.append("Beta is above 1.5, so price volatility may be elevated.")

    current_price = safe_float((market_data or {}).get("currentPrice"))
    high = safe_float(valuation_check.get("fiftyTwoWeekHigh"))
    if current_price is not None and high is not None and high > 0 and current_price / high >= 0.95:
        red_flags.append("Price is near its 52-week high.")

    if portfolio_fit.get("riskDrivers"):
        red_flags.extend(portfolio_fit["riskDrivers"])

    if not news_data or news_data.get("count", 0) == 0:
        red_flags.append("Recent news unavailable or broad.")

    evidence_strength = build_evidence_strength(
        market_data,
        sec_data,
        valuation_check,
        news_data,
        portfolio_fit,
    )

    if evidence_strength["score"] < 60:
        red_flags.append("Evidence strength is below 60.")

    red_flags = list(dict.fromkeys(red_flags + source_errors))
    decision_readiness = build_decision_readiness(
        market_data,
        sec_data,
        valuation_check,
        news_data,
        portfolio_fit,
        red_flags,
    )

    profitability_score = 0
    if financial_health["profitMarginApprox"] is not None:
        profitability_score = clamp_score(50 + (financial_health["profitMarginApprox"] * 150))

    balance_sheet_score = 0
    if financial_health["debtToAssetsApprox"] is not None:
        balance_sheet_score = clamp_score(90 - (financial_health["debtToAssetsApprox"] * 80))

    valuation_score = int(valuation_check.pop("_score"))
    portfolio_score = int(portfolio_fit.pop("_score"))
    news_score = 65 if news_data and news_data.get("count", 0) > 0 else 35
    quality_score = clamp_score((profitability_score or 45) * 0.6 + (balance_sheet_score or 45) * 0.4)
    growth_score = 60 if sec_data and safe_float(sec_data.get("revenue")) else 40
    risk_score = clamp_score(80 - (len(red_flags) * 7))

    investment_case_scorecard = [
        scorecard_item(
            "Business Quality",
            quality_score,
            "Business quality blends profitability and balance-sheet evidence.",
            financial_health["strengths"][:3],
            [] if sec_data else ["SEC fundamentals."],
        ),
        scorecard_item(
            "Growth",
            growth_score,
            "Growth is a placeholder screen until trend history and thesis tracking are added.",
            ["Revenue evidence is available."] if sec_data else [],
            ["Multi-period growth analysis."] if not sec_data else ["Multi-period growth analysis."],
        ),
        scorecard_item(
            "Profitability",
            profitability_score,
            "Profitability uses approximate profit margin from SEC revenue and net income.",
            financial_health["strengths"],
            ["Profit margin."] if financial_health["profitMarginApprox"] is None else [],
        ),
        scorecard_item(
            "Balance Sheet",
            balance_sheet_score,
            "Balance sheet score uses approximate liabilities/assets and equity.",
            financial_health["strengths"],
            ["Debt/assets or equity."] if financial_health["debtToAssetsApprox"] is None else [],
        ),
        scorecard_item(
            "Valuation",
            valuation_score,
            valuation_check["explanation"],
            [f"Valuation risk: {valuation_check['valuationRisk']}"],
            valuation_check["missingData"],
        ),
        scorecard_item(
            "Risk",
            risk_score,
            "Risk score falls as deterministic red flags accumulate.",
            red_flags[:4],
            [],
        ),
        scorecard_item(
            "News Momentum",
            news_score,
            "News momentum reflects whether recent ticker/company news is available.",
            [f"{news_data.get('count', 0)} news items available."] if news_data else [],
            [] if news_data and news_data.get("count", 0) > 0 else ["Recent news."],
        ),
        scorecard_item(
            "Portfolio Fit",
            portfolio_score,
            portfolio_fit["explanation"],
            [portfolio_fit["concentrationMessage"]],
            portfolio_fit["missingData"],
        ),
        scorecard_item(
            "Evidence Strength",
            evidence_strength["score"],
            evidence_strength["explanation"],
            evidence_strength["sourcesAvailable"],
            evidence_strength["sourcesMissing"],
        ),
    ]

    bull_bear_base = build_bull_bear_base(
        ticker_upper,
        market_data,
        sec_data,
        valuation_check,
        financial_health,
        news_data,
    )

    beginner_summary = (
        f"{ticker_upper} has an evidence strength score of "
        f"{evidence_strength['score']} and a decision readiness score of "
        f"{decision_readiness['score']}. The available data should be used to "
        "research further, compare valuation against fundamentals, review risk "
        "drivers, and consider portfolio concentration before making any "
        "simulated paper-trading decision."
    )

    return {
        "ticker": ticker_upper,
        "company": company,
        "generatedAt": generated_at,
        "investmentCaseScorecard": investment_case_scorecard,
        "valuationCheck": valuation_check,
        "financialHealthCheck": financial_health,
        "bullBearBaseCase": bull_bear_base,
        "portfolioFitCheck": portfolio_fit,
        "decisionReadiness": decision_readiness,
        "evidenceStrength": evidence_strength,
        "redFlags": red_flags,
        "beginnerSummary": beginner_summary,
        "disclaimer": DISCLAIMER,
    }
