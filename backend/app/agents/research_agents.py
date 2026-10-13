"""Research planning, quantitative scenarios, and bounded review over stored evidence."""
import math
import re
from app.services.portfolio_analytics import analyze_portfolio


def _available(context, keys):
    return bool(context) and any(isinstance(context.get(key), (int, float)) and math.isfinite(context[key]) for key in keys)


def research_planner_agent(state):
    question = state["question"].lower()
    if any(word in question for word in ("stress", "crash", "shock", "downturn", "recession")):
        intent = "Portfolio stress test"
    elif state.get("ticker") and any(word in question for word in ("challenge", "thesis")):
        intent = "Stock research"
    elif any(word in question for word in ("concentration", "diversif", "allocation", "portfolio risk")):
        intent = "Portfolio allocation review"
    elif any(word in question for word in ("transactions", "trade history", "buy/sell", "realized")):
        intent = "Transaction review"
    else:
        intent = "Stock research" if state.get("ticker") else "Portfolio research"
    checks = []
    if intent in ("Portfolio stress test", "Portfolio allocation review", "Portfolio research"):
        checks.append(("Portfolio holdings", bool(state.get("portfolio_context")), "Stored positions are needed to calculate exposure."))
    if intent == "Transaction review":
        checks.append(("Transaction history", bool(state.get("transaction_context")), "Trade history is needed to explain realized P/L."))
    if intent in ("Stock research", "Portfolio research"):
        checks.extend([
            ("Market price", _available(state.get("market_context"), ["currentPrice"]), "A stored price is needed; source freshness must be checked separately."),
            ("SEC fundamentals", _available(state.get("sec_context"), ["revenue", "netIncome", "assets", "liabilities"]), "Financial facts are needed for company-level analysis."),
            ("News context", bool(state.get("news_context")), "Available headlines provide context, not verified forecasts."),
        ])
    if not checks:
        checks.append(("Portfolio holdings", bool(state.get("portfolio_context")), "Load positions before researching portfolio exposure."))
    state["research_details"] = {
        "intent": intent,
        "scope": "Available research context; no autonomous orders or background data refresh.",
        "checks": [{"name": name, "available": available, "reason": reason} for name, available, reason in checks],
        "coveragePercent": round(sum(available for _, available, _ in checks) / len(checks) * 100),
        "scenarios": [], "challenges": [], "review": {},
    }
    return state


def stress_test_agent(state):
    holdings = [{**item, "currentPrice": item.get("analyticsPrice", item.get("currentPrice"))}
                for item in state.get("portfolio_context", [])]
    base = analyze_portfolio(holdings, 0)
    dominant_sectors = {group["sectorAllocation"][0]["name"] for group in base["groups"] if group["sectorAllocation"]}
    definitions = [("Broad decline", -10, {}), ("Severe decline", -25, {}),
                   ("Dominant-sector decline", 0, {sector: -30 for sector in dominant_sectors})]
    scenarios = []
    for name, market, sectors in definitions:
        result = analyze_portfolio(holdings, market, sectors)
        scenarios.append({"name": name, "marketShockPercent": market, "sectorShocks": sectors,
                          "groups": result["groups"], "warnings": result["warnings"]})
    state["research_details"]["scenarios"] = scenarios
    state["research_details"]["scenarioAssumptions"] = base["assumptions"]
    return state


def skeptical_reviewer_agent(state):
    details = state["research_details"]
    challenges = [f"Missing {check['name'].lower()}: {check['reason']}" for check in details["checks"] if not check["available"]]
    for group in state.get("portfolio_analytics", {}).get("groups", []):
        if group["largestPositionPercent"] > 25:
            challenges.append(f"{group['currency']}: the largest position exceeds the illustrative 25% concentration threshold; check the thesis if that company underperforms.")
        if len(group["sectorAllocation"]) == 1:
            challenges.append(f"{group['currency']}: all priced holdings share one sector; ticker count alone does not establish diversification.")
    if state.get("market_context"):
        challenges.append("A stored market snapshot does not establish that the price is current; refresh and inspect the source timestamp.")
    if state.get("sec_context"):
        challenges.append("Check filing dates, fact periods, and units before comparing SEC financial values; this workflow does not reconcile reporting periods.")
    challenges.append("Stress scenarios are assumptions, not probabilities or predictions. They omit correlation, cash, liquidity, and rebalancing effects.")
    details["challenges"] = challenges
    return state


_PERCENT = re.compile(r"(?<![\w.])([+-]?\d+(?:\.\d+)?)\s*%")


def review_numeric_claims(answer, state):
    """Check explicit percentage literals only; numeric matches do not prove meaning."""
    allowed = set()
    def collect(value, key=""):
        if isinstance(value, dict):
            for child_key, item in value.items():
                collect(item, "shockPercent" if key == "sectorShocks" else child_key)
        elif isinstance(value, list):
            for item in value:
                collect(item, key)
        elif isinstance(value, str):
            allowed.update(float(match.group(1)) for match in _PERCENT.finditer(value))
        elif isinstance(value, (int, float)) and math.isfinite(value) and ("percent" in key.lower() or key == "weight" or key == "confidence"):
            allowed.add(float(value))
    for name in ("evidence", "portfolio_context", "transaction_context", "market_context", "sec_context", "risk_drivers", "portfolio_analytics", "research_details"):
        collect(state.get(name, {}))
    findings = []
    for match in _PERCENT.finditer(answer):
        number = float(match.group(1))
        if not any(abs(number - known) <= .015 for known in allowed):
            findings.append(f"Percentage {match.group(0)} was not found in supplied evidence or calculated scenarios.")
    return {"status": "flags_found" if findings else "no_percentage_flags", "findings": list(dict.fromkeys(findings)),
            "checkedPercentages": len(list(_PERCENT.finditer(answer))),
            "limitations": "Checks explicit percentage values only. Does not verify semantic attribution, prose claims, dollar amounts, source truth, or future outcomes.",
            "answerReplaced": False}


def append_research_summary(answer, details):
    lines = ["## Research Workbench", f"Research intent: {details['intent']}.",
             f"Evidence availability: {details['coveragePercent']}% of the planned source checks. This is not an accuracy score.",
             "### Hypothetical stress scenarios"]
    for scenario in details["scenarios"]:
        for group in scenario["groups"]:
            lines.append(f"- {scenario['name']} ({group['currency']}): value change {group['scenarioChange']} {group['currency']} ({group['scenarioChangePercent']}%); remaining value {group['scenarioValue']} {group['currency']}.")
    if not any(scenario["groups"] for scenario in details["scenarios"]):
        lines.append("No valid portfolio positions were available for stress testing.")
    lines.append("### Questions that challenge the thesis")
    lines.extend(f"- {challenge}" for challenge in details["challenges"])
    return answer + "\n\n" + "\n\n".join(lines)
