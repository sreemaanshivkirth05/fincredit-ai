"""Deterministic, read-only analytics. No market requests or LLM arithmetic."""
from collections import defaultdict
from math import isfinite


def _number(value):
    try:
        result = float(value)
        return result if isfinite(result) else None
    except (ValueError, TypeError):
        return None


def analyze_portfolio(holdings: list[dict], market_shock: float = -10,
                      sector_shocks: dict[str, float] | None = None) -> dict:
    """Sector shocks replace the market shock; amounts never mix currencies."""
    sector_shocks = sector_shocks or {}
    shocks = [market_shock, *sector_shocks.values()]
    if any(_number(shock) is None or not -100 <= shock <= 100 for shock in shocks):
        raise ValueError("Shocks must be finite percentages between -100 and 100.")
    groups = defaultdict(list)
    warnings = []
    for holding in holdings:
        shares = _number(holding.get("shares"))
        price = _number(holding.get("currentPrice"))
        if price is None:
            price = _number(holding.get("avgPrice"))
            warnings.append(f"{holding['ticker']}: average cost used because a current price is unavailable.")
        if shares is None or shares <= 0 or price is None or price < 0:
            warnings.append(f"{holding['ticker']}: excluded because shares or price are invalid.")
            continue
        groups[holding.get("currency") or "USD"].append((holding, shares * price))

    results = []
    for currency, items in sorted(groups.items()):
        total = sum(value for _, value in items)
        sectors = defaultdict(float)
        positions = []
        for holding, value in items:
            sector = holding.get("sector") or "Unknown"
            sectors[sector] += value
            shock = sector_shocks.get(sector, market_shock)
            change = value * shock / 100
            positions.append({"ticker": holding["ticker"], "sector": sector,
                              "value": round(value, 2),
                              "weight": round(value / total * 100, 2) if total else 0,
                              "shockPercent": shock, "change": round(change, 2),
                              "scenarioValue": round(value + change, 2)})
        # Compute totals before display rounding to avoid accumulating rounding error.
        scenario_total = sum(value * (1 + sector_shocks.get(holding.get("sector") or "Unknown", market_shock) / 100)
                             for holding, value in items)
        weights = [value / total for _, value in items] if total else []
        hhi = sum(weight * weight for weight in weights)
        ordered = sorted(positions, key=lambda item: (-item["value"], item["ticker"]))
        results.append({"currency": currency, "totalValue": round(total, 2),
                        "holdingsCount": len(items),
                        "largestPositionPercent": round(max(weights, default=0) * 100, 2),
                        "topThreePercent": round(sum(sorted(weights, reverse=True)[:3]) * 100, 2),
                        "concentrationIndex": round(hhi, 4),
                        "effectiveHoldings": round(1 / hhi, 2) if hhi else 0,
                        "sectorAllocation": [{"name": name, "weight": round(value / total * 100, 2) if total else 0}
                                             for name, value in sorted(sectors.items(), key=lambda item: -item[1])],
                        "scenarioValue": round(scenario_total, 2),
                        "scenarioChange": round(scenario_total - total, 2),
                        "scenarioChangePercent": round((scenario_total / total - 1) * 100, 2) if total else 0,
                        "positions": ordered})
    available_sectors = {holding.get("sector") or "Unknown" for holding in holdings}
    for sector in sector_shocks.keys() - available_sectors:
        warnings.append(f"Sector override '{sector}' matched no holdings.")
    return {"groups": results, "warnings": warnings,
            "assumptions": ["Uses stored prices; no live quote refresh is performed.",
                            "Sector overrides replace the market-wide shock.",
                            "Currencies are analyzed separately; no FX conversion is applied.",
                            "Linear price shocks exclude cash, fees, dividends, correlations, and rebalancing.",
                            "Concentration describes allocation, not volatility or a return forecast.",
                            "Hypothetical paper-trading scenario; not investment advice."]}
