import unittest
from unittest.mock import patch
import test_analytics_agent as fixtures
from app.agents.fincredit_graph import answer_agent, portfolio_analytics_agent
from app.agents.research_agents import research_planner_agent, stress_test_agent, skeptical_reviewer_agent, review_numeric_claims


def prepared_state():
    state = fixtures.AnalyticsAgentTests().state()
    state['question'] = 'Stress-test my portfolio'
    for agent in (portfolio_analytics_agent, research_planner_agent, stress_test_agent, skeptical_reviewer_agent):
        state = agent(state)
    return state


class ResearchAgentTests(unittest.TestCase):
    def test_plan_exposes_missing_company_sources(self):
        state = fixtures.AnalyticsAgentTests().state()
        state.update(question='Challenge my AAPL thesis', ticker='AAPL')
        research_planner_agent(state)
        details = state['research_details']
        self.assertEqual(details['intent'], 'Stock research')
        self.assertEqual(details['coveragePercent'], 0)
        self.assertEqual(len(details['checks']), 3)
        state['market_context'] = {'currentPrice': 123}
        research_planner_agent(state)
        self.assertEqual(state['research_details']['coveragePercent'], 33)

    def test_scenarios_keep_currencies_separate_and_use_sector_override(self):
        state = prepared_state()
        state['portfolio_context'].append(dict(ticker='EUR', shares=2, currentPrice=200, avgPrice=200, sector='Utilities', currency='EUR'))
        stress_test_agent(state)
        scenarios = state['research_details']['scenarios']
        self.assertEqual({g['currency']: g['scenarioValue'] for g in scenarios[1]['groups']}, {'USD': 75, 'EUR': 300})
        self.assertEqual({g['currency']: g['scenarioValue'] for g in scenarios[2]['groups']}, {'USD': 70, 'EUR': 280})
        self.assertEqual(state['portfolio_context'][0]['currentPrice'], 100)

    def test_missing_positions_and_prices_are_visible(self):
        state = prepared_state()
        state['portfolio_context'] = []
        stress_test_agent(state)
        self.assertTrue(all(not s['groups'] for s in state['research_details']['scenarios']))
        state['portfolio_context'] = [dict(ticker='AAPL', shares=1, currentPrice=100, analyticsPrice=None, avgPrice=80, currency='USD')]
        stress_test_agent(state)
        self.assertIn('average cost used', state['research_details']['scenarios'][0]['warnings'][0])

    def test_skeptic_challenges_concentration(self):
        state = prepared_state()
        self.assertTrue(any('25%' in item for item in state['research_details']['challenges']))
        self.assertTrue(any('one sector' in item for item in state['research_details']['challenges']))

    def test_review_is_explicitly_bounded_and_accepts_configured_shocks(self):
        state = prepared_state()
        result = review_numeric_claims('Scenario: -10%. Sector assumption: -30%. Guaranteed return: 88%.', state)
        self.assertEqual(result['checkedPercentages'], 3)
        self.assertEqual(len(result['findings']), 1)
        self.assertIn('88%', result['findings'][0])
        self.assertIn('semantic attribution', result['limitations'])
        self.assertEqual(review_numeric_claims('Unverified prose and $1234', state)['checkedPercentages'], 0)

    def test_unmatched_model_percentage_replaces_answer(self):
        with patch('app.agents.fincredit_graph.generate_llm_answer', return_value='Guaranteed gain of 88%.'):
            result = answer_agent(prepared_state())
        self.assertNotIn('Guaranteed gain', result['answer'])
        self.assertTrue(result['research_details']['review']['answerReplaced'])
        self.assertEqual(result['audit']['unsupportedClaims'], 1)
        self.assertIn('Research Workbench', result['answer'])

    def test_supported_model_answer_and_offline_fallback_keep_workbench(self):
        with patch('app.agents.fincredit_graph.generate_llm_answer', return_value='Hypothetical shock: -10%.'):
            result = answer_agent(prepared_state())
        self.assertTrue(result['answer'].startswith('Hypothetical shock'))
        self.assertFalse(result['research_details']['review']['answerReplaced'])
        with patch('app.agents.fincredit_graph.generate_llm_answer', side_effect=RuntimeError('offline')):
            result = answer_agent(prepared_state())
        self.assertIn('Research Workbench', result['answer'])
        self.assertTrue(result['audit']['status'].startswith('Fallback'))
