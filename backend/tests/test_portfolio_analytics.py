import unittest
from pydantic import ValidationError
from app.schemas.portfolio import PortfolioBuyRequest, PortfolioSellRequest
from app.schemas.portfolio_analytics import PortfolioScenarioRequest
from app.services.portfolio_analytics import analyze_portfolio


def position(ticker, value, sector="Technology", currency="USD"):
    return dict(ticker=ticker, shares=1, currentPrice=value, avgPrice=value, sector=sector, currency=currency)


class AnalyticsTests(unittest.TestCase):
    def test_concentration_and_uniform_shock(self):
        group = analyze_portfolio([position("AAPL", 600), position("JPM", 400, "Finance")])["groups"][0]
        self.assertEqual(group["largestPositionPercent"], 60)
        self.assertEqual(group["concentrationIndex"], .52)
        self.assertEqual(group["effectiveHoldings"], 1.92)
        self.assertEqual(group["scenarioValue"], 900)
        self.assertEqual(group["scenarioChange"], -100)

    def test_sector_override_replaces_market_shock(self):
        group = analyze_portfolio([position("AAPL", 600), position("JPM", 400, "Finance")], -10, {"Technology": -20})["groups"][0]
        self.assertEqual(group["scenarioValue"], 840)
        self.assertEqual(group["scenarioChangePercent"], -16)

    def test_currencies_are_not_added(self):
        groups = analyze_portfolio([position("AAPL", 100), position("SHOP", 200, currency="CAD")])["groups"]
        self.assertEqual({g["currency"]: g["totalValue"] for g in groups}, {"USD": 100, "CAD": 200})

    def test_empty_zero_and_total_loss(self):
        self.assertEqual(analyze_portfolio([])["groups"], [])
        self.assertEqual(analyze_portfolio([position("AAPL", 0)])["groups"][0]["effectiveHoldings"], 0)
        self.assertEqual(analyze_portfolio([position("AAPL", 100)], -100)["groups"][0]["scenarioValue"], 0)

    def test_missing_price_and_invalid_holding_warnings(self):
        fallback = position("AAPL", 100)
        fallback["currentPrice"] = None
        bad = position("BAD", float("nan"))
        bad["avgPrice"] = None
        result = analyze_portfolio([fallback, bad], sector_shocks={"Energy": 0})
        self.assertEqual(result["groups"][0]["totalValue"], 100)
        self.assertEqual(len(result["warnings"]), 4)

    def test_unrounded_totals(self):
        group = analyze_portfolio([position(str(i), .01) for i in range(100)], -10)["groups"][0]
        self.assertEqual(group["scenarioValue"], .9)
        self.assertEqual(group["scenarioChange"], -.1)

    def test_request_validation(self):
        for shock in [-101, 101, float("nan"), float("inf")]:
            with self.subTest(shock=shock), self.assertRaises(ValidationError):
                PortfolioScenarioRequest(marketShockPercent=shock)
            with self.subTest(sectorShock=shock), self.assertRaises(ValidationError):
                PortfolioScenarioRequest(sectorShocks={"Tech": shock})
        for model in (PortfolioBuyRequest, PortfolioSellRequest):
            for field in ("shares", "price"):
                for value in (0, -1, float("nan"), float("inf")):
                    with self.subTest(model=model, field=field, value=value), self.assertRaises(ValidationError):
                        model(**{**dict(ticker="AAPL", shares=1, price=100), field: value})
            with self.assertRaises(ValidationError):
                model(ticker="   ", shares=1, price=100)
            self.assertEqual(model(ticker=" aapl ", shares=1, price=100).ticker, "AAPL")


if __name__ == "__main__":
    unittest.main()
