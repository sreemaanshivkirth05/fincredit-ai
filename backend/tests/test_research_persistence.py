from unittest.mock import patch
import test_portfolio_isolation as fixtures
from app.api.ask import router
from app.agents.fincredit_graph import answer_agent
from test_research_agents import prepared_state
from app.core.security import create_access_token
from app.models.agent_run import AgentRun


class ResearchPersistenceTests(fixtures.PortfolioIsolationTests):
    def setUp(self):
        super().setUp()
        self.app.include_router(router, prefix='/api')

    def test_diagnostics_round_trip_and_private_history(self):
        with patch('app.agents.fincredit_graph.generate_llm_answer', return_value='Hypothetical shock: -10%.'):
            result = answer_agent(prepared_state())
        with patch('app.services.ask_service.run_fincredit_graph', return_value=result) as graph:
            response = self.client.post('/api/ask', headers=self.headers, json={'question': 'Stress-test my portfolio'})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(graph.call_args.args[2], 1)
        run_id = response.json()['agentRunId']
        details = response.json()['researchDetails']
        history = self.client.get(f'/api/ask/runs/{run_id}', headers=self.headers)
        self.assertEqual(history.json()['researchDetails'], details)
        other = {'Authorization': 'Bearer ' + create_access_token({'sub': '2'})}
        self.assertEqual(self.client.get(f'/api/ask/runs/{run_id}', headers=other).status_code, 404)
        self.assertEqual(self.client.get('/api/ask/runs', headers=other).json()['runs'], [])
        with self.sessions() as db:
            old = db.get(AgentRun, run_id)
            old.research_details = None
            db.commit()
        self.assertIsNone(self.client.get(f'/api/ask/runs/{run_id}', headers=self.headers).json()['researchDetails'])

    def test_question_bounds_and_auth(self):
        self.assertEqual(self.client.post('/api/ask', json={'question': 'test'}).status_code, 401)
        for question in ('', 'x' * 4001):
            self.assertEqual(self.client.post('/api/ask', headers=self.headers, json={'question': question}).status_code, 422)

    def test_full_graph_runs_with_real_user_context(self):
        with patch('app.agents.fincredit_graph.generate_llm_answer', side_effect=RuntimeError('offline')), patch('app.agents.fincredit_graph.get_stock_news_data', return_value={'news': []}):
            response = self.client.post('/api/ask', headers=self.headers, json={'question': 'Stress-test my portfolio'})
        self.assertEqual(response.status_code, 200, response.text)
        details = response.json()['researchDetails']
        self.assertEqual(details['intent'], 'Portfolio stress test')
        self.assertEqual(details['scenarios'][1]['groups'][0]['scenarioValue'], 75)
        self.assertNotIn('SECRET', response.text)
        self.assertIn('Percentage Review Agent', response.json()['audit']['agentsUsed'])
