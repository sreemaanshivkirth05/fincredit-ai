"""Isolated Phase 2 execution checks; no real provider or application DB."""
from datetime import datetime, timezone
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.simulation import router
from app.core.config import settings
from app.core.security import create_access_token
from app.db.database import get_db
from app.db.simulation_migration import run_migration
from app.models.holding import Holding
from app.models.simulation import SimulationAction, SimulationMemory, SimulationRun
from app.models.user import User
from app.services.model_provider import ModelAnswer, ModelUnavailable
from app.services.simulation_orchestrator import SimulationExecutionError, execute_simulation


class SimulationExecutionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        url = "sqlite:///" + (Path(self.temp.name) / "execution.db").as_posix()
        self.engine = create_engine(url, connect_args={"check_same_thread": False})
        User.__table__.create(self.engine)
        Holding.__table__.create(self.engine)
        run_migration(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        app = FastAPI()
        app.include_router(router, prefix="/api")

        def test_db():
            with self.sessions() as db:
                yield db

        app.dependency_overrides[get_db] = test_db
        self.client = TestClient(app)
        self.headers = {"Authorization": "Bearer " + create_access_token({"sub": "1"})}
        self.other = {"Authorization": "Bearer " + create_access_token({"sub": "2"})}
        self.enterContext(patch.object(settings, "SIMULATION_ENABLED", True))
        with self.sessions() as db:
            db.add_all([
                User(id=1, email="runner@test.local", hashed_password="unused", role="user", is_active=True),
                User(id=2, email="other@test.local", hashed_password="unused", role="user", is_active=True),
                Holding(user_id=1, ticker="AAPL", company="Apple", shares=2, avg_price=100,
                        current_price=120, value=240, weight=100, sector="Technology",
                        risk="Learning", score=50, sentiment="Neutral", currency="USD"),
            ])
            db.commit()

    def tearDown(self):
        self.client.close()
        self.engine.dispose()
        self.temp.cleanup()

    def create_and_start(self, agents=None, rounds=2):
        agents = agents or ["risk_manager", "portfolio_manager"]
        response = self.client.post("/api/simulations", headers=self.headers, json={
            "title": "Bounded test",
            "scenario": "A hypothetical rate increase affects a frozen portfolio",
            "tickers": ["AAPL"],
            "configuration": {
                "agentTypes": agents,
                "rounds": rounds,
                "seed": 17,
                "maxModelCalls": len(agents) * rounds,
            },
        })
        self.assertEqual(response.status_code, 201, response.text)
        run_id = response.json()["id"]
        response = self.client.post(f"/api/simulations/{run_id}/start", headers=self.headers)
        self.assertEqual(response.status_code, 202, response.text)
        self.assertEqual(response.json()["status"], "queued")
        return run_id

    def claim(self, run_id):
        db = self.sessions()
        run = db.get(SimulationRun, run_id)
        run.status = "running"
        run.started_at = datetime.now(timezone.utc)
        run.updated_at = run.started_at
        db.commit()
        db.refresh(run)
        return db, run

    def test_bounded_execution_persists_actions_memory_and_no_portfolio_write(self):
        run_id = self.create_and_start()
        with self.sessions() as db:
            before = [(h.id, h.shares, h.value, h.updated_at) for h in db.query(Holding).all()]

        calls = []
        def fake_generator(prompt, **kwargs):
            calls.append((prompt, kwargs))
            return ModelAnswer(json.dumps({
                "action": "HOLD", "ticker": "AAPL", "allocationIntentPct": 0,
                "confidence": 55,
                "rationale": "The frozen scenario and holding support a cautious simulated research position.",
                "thesis": "The frozen holding and hypothetical scenario support maintaining a cautious position.",
                "counterThesis": "Missing live fundamentals and market context could make even a hold inappropriate.",
                "catalysts": ["Evidence that the scenario pressure is temporary"],
                "risks": ["The stored price may be stale", "Scenario transmission is uncertain"],
                "timeHorizon": "months",
                "riskScore": 58,
                "riskFlags": ["data_staleness", "scenario_uncertainty"],
                "dataQuality": "medium",
                "sizingRationale": "Zero allocation change matches the incomplete evidence and bounded confidence.",
                "disconfirmingEvidenceNeeded": ["Current fundamentals that contradict the hold thesis"],
                "evidenceIds": ["scenario:input", "ticker:AAPL", "holding:1"],
                "uncertainties": ["No live market or news data was supplied"],
            }), kwargs["provider"], kwargs["model"])

        db, run = self.claim(run_id)
        try:
            execute_simulation(db, run, generator=fake_generator)
        finally:
            db.close()
        self.assertEqual(len(calls), 4)
        self.assertEqual([item[1]["seed"] for item in calls], [118, 119, 218, 219])
        self.assertEqual([item[1]["temperature"] for item in calls], [0.05, 0.08, 0.05, 0.08])
        result = self.client.get(f"/api/simulations/{run_id}/execution", headers=self.headers)
        self.assertEqual(result.status_code, 200, result.text)
        data = result.json()
        self.assertEqual(data["run"]["status"], "completed")
        self.assertEqual(data["run"]["progress"]["completedActions"], 4)
        self.assertEqual(len(data["rounds"]), 2)
        self.assertTrue(data["run"]["result"]["noPortfolioWrites"])
        self.assertEqual(data["run"]["result"]["committeeSynthesis"]["majorityAction"], "HOLD")
        self.assertEqual(data["rounds"][0]["actions"][0]["decisionDetail"]["quality"]["band"], "strong")
        self.assertTrue(calls[0][1]["json_mode"])
        self.assertIn("Desk brief", calls[1][0])
        self.assertIn("risk_manager", calls[1][0])
        with self.sessions() as db:
            self.assertEqual(db.query(SimulationAction).filter_by(run_id=run_id).count(), 4)
            self.assertEqual(db.query(SimulationMemory).filter_by(run_id=run_id).count(), 4)
            after = [(h.id, h.shares, h.value, h.updated_at) for h in db.query(Holding).all()]
        self.assertEqual(before, after)

    def test_invalid_model_output_fails_closed(self):
        run_id = self.create_and_start(["risk_manager"], 1)
        db, run = self.claim(run_id)
        try:
            with self.assertRaises(SimulationExecutionError):
                execute_simulation(db, run, generator=lambda *args, **kwargs: ModelAnswer(
                    "not valid json", "ollama", "test-model"))
        finally:
            db.close()
        data = self.client.get(f"/api/simulations/{run_id}", headers=self.headers).json()
        self.assertEqual(data["status"], "failed")
        self.assertEqual(data["result"]["errorCode"], "invalid_model_output")
        self.assertEqual(data["progress"]["completedActions"], 0)

    def test_provider_failure_is_sanitized_and_not_retried(self):
        run_id = self.create_and_start(["risk_manager"], 1)
        attempts = []
        def unavailable(*args, **kwargs):
            attempts.append(1)
            raise ModelUnavailable("Configured Ollama model is not installed")
        db, run = self.claim(run_id)
        try:
            with self.assertRaises(SimulationExecutionError):
                execute_simulation(db, run, generator=unavailable)
        finally:
            db.close()
        self.assertEqual(len(attempts), 1)
        data = self.client.get(f"/api/simulations/{run_id}", headers=self.headers).json()
        self.assertEqual(data["result"]["errorCode"], "model_unavailable")
        self.assertNotIn("prompt", json.dumps(data["result"]).lower())

    def test_cancel_and_execution_endpoints_are_user_scoped(self):
        run_id = self.create_and_start(["risk_manager"], 1)
        for suffix, method in (("/cancel", "post"), ("/events", "get"), ("/execution", "get")):
            response = getattr(self.client, method)(f"/api/simulations/{run_id}{suffix}", headers=self.other)
            self.assertEqual(response.status_code, 404)
        response = self.client.post(f"/api/simulations/{run_id}/cancel", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "cancelled")
        events = self.client.get(f"/api/simulations/{run_id}/events", headers=self.headers).json()["events"]
        self.assertEqual([item["eventType"] for item in events], ["run_queued", "run_cancelled"])


if __name__ == "__main__":
    unittest.main()
