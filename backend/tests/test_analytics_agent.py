import unittest
from unittest.mock import patch
from app.agents.fincredit_graph import answer_agent, portfolio_analytics_agent
from app.services.llm_service import build_fincredit_prompt


class AnalyticsAgentTests(unittest.TestCase):
    def state(self):
        return dict(question="How concentrated is my portfolio?", ticker=None,
                    portfolio_context=[dict(ticker="AAPL", company="Apple", shares=1, currentPrice=100, avgPrice=100, value=100, totalCost=100, weight=100, unrealizedPL=0, unrealizedPLPercent=0, sector="Technology", currency="USD")],
                    transaction_context=[], watchlist_context=[], market_context=None,
                    sec_context=None, news_context=[], evidence=[], risk_drivers=[], audit={})

    def test_calculated_metrics_reach_model(self):
        state = portfolio_analytics_agent(self.state())
        with patch("app.agents.fincredit_graph.generate_llm_answer", return_value="Grounded summary") as generate:
            result = answer_agent(state)
        self.assertEqual(result["answer"], "Grounded summary")
        self.assertEqual(generate.call_args.kwargs["portfolio_analytics"]["groups"][0]["scenarioChange"], -10)
        self.assertIn("Portfolio Analytics Agent", result["audit"]["agentsUsed"])
        prompt = build_fincredit_prompt(**generate.call_args.kwargs)
        self.assertIn("not forecasts or volatility estimates", prompt)

    def test_model_failure_retains_analytics(self):
        state = portfolio_analytics_agent(self.state())
        with patch("app.agents.fincredit_graph.generate_llm_answer", side_effect=RuntimeError("offline")):
            result = answer_agent(state)
        self.assertIn("Portfolio Concentration and Scenario", result["answer"])
        self.assertIn("effective holdings 1.0", result["answer"])
        self.assertIn("not a forecast", result["answer"])

    def test_missing_price_is_not_silently_marked_current(self):
        state = self.state()
        state["portfolio_context"][0]["analyticsPrice"] = None
        result = portfolio_analytics_agent(state)
        self.assertIn("average cost used", result["portfolio_analytics"]["warnings"][0])


if __name__ == "__main__":
    unittest.main()
