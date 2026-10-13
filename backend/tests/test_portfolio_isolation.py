"""Exercise real JWT auth and SQL queries against an isolated in-memory database."""
import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.api.portfolio import router
from app.core.security import create_access_token
from app.db.database import Base, get_db
from app.models.holding import Holding
from app.models.portfolio_transaction import PortfolioTransaction
from app.models.user import User


class PortfolioIsolationTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        self.app = FastAPI()
        self.app.include_router(router, prefix="/api")

        def test_db():
            with self.sessions() as session:
                yield session
        self.app.dependency_overrides[get_db] = test_db
        self.client = TestClient(self.app)
        self.headers = {"Authorization": "Bearer " + create_access_token({"sub": "1"})}
        with self.sessions() as db:
            for user_id, ticker, price in [(1, "AAPL", 100), (2, "SECRET", 900)]:
                db.add(User(id=user_id, email=f"user{user_id}@test.local", hashed_password="unused", role="user", is_active=True))
                db.add(Holding(user_id=user_id, ticker=ticker, company=ticker, shares=1,
                               avg_price=price, current_price=price, value=price, weight=100,
                               sector="Technology", risk="Learning", score=50, sentiment="Neutral", currency="USD"))
                db.add(PortfolioTransaction(user_id=user_id, ticker=ticker, company=ticker,
                                           action="BUY", shares=1, price=price, total_amount=price))
            db.commit()

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def test_summary_never_leaks_other_users_transactions(self):
        response = self.client.get("/api/portfolio", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([t["ticker"] for t in response.json()["transactions"]], ["AAPL"])
        self.assertNotIn("SECRET", response.text)

    def test_scenario_is_isolated_and_read_only(self):
        with self.sessions() as db:
            before = [(h.id, h.value, h.weight, h.updated_at) for h in db.query(Holding).order_by(Holding.id)]
        response = self.client.post("/api/portfolio/scenario", headers=self.headers, json={"marketShockPercent": -20})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["groups"][0]["scenarioValue"], 80)
        self.assertNotIn("SECRET", response.text)
        with self.sessions() as db:
            after = [(h.id, h.value, h.weight, h.updated_at) for h in db.query(Holding).order_by(Holding.id)]
            self.assertEqual(before, after)
            self.assertEqual(db.query(PortfolioTransaction).count(), 2)

    def test_auth_required(self):
        for path in ("/api/portfolio/analytics", "/api/portfolio/scenario"):
            response = self.client.get(path) if path.endswith("analytics") else self.client.post(path, json={})
            self.assertEqual(response.status_code, 401)

    def test_analytics_default_and_invalid_requests(self):
        response = self.client.get("/api/portfolio/analytics", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["groups"][0]["scenarioValue"], 90)
        for data in ({"marketShockPercent": -101}, {"sectorShocks": {"Technology": 101}}):
            response = self.client.post("/api/portfolio/scenario", headers=self.headers, json=data)
            self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
