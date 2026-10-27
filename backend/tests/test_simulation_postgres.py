"""Opt-in PostgreSQL checks. Supply ONLY an isolated disposable test database.

No application database is accessed by default. No drop/truncate/reset is used.
"""
import os
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError, InternalError
from sqlalchemy.orm import sessionmaker

from app.api.simulation import router
from app.core.config import settings
from app.core.security import create_access_token
from app.db.database import get_db
from app.db.simulation_migration import run_migration
from app.models.holding import Holding
from app.models.simulation import SimulationRun, SimulationSnapshot
from app.models.user import User


@unittest.skipUnless(os.environ.get('SIMULATION_TEST_DATABASE_URL'), 'Requires isolated PostgreSQL test database')
class SimulationPostgresTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        url = make_url(os.environ['SIMULATION_TEST_DATABASE_URL'])
        if url.get_backend_name() != 'postgresql' or url.database != 'fincredit_simulation_test':
            raise RuntimeError('Refusing database without the dedicated fincredit_simulation_test name')
        cls.engine = create_engine(url)
        # Also refuse a pre-existing database, even if its name matches.
        if inspect(cls.engine).get_table_names():
            cls.engine.dispose()
            raise RuntimeError('PostgreSQL simulation tests require an empty disposable database')
        User.__table__.create(cls.engine)
        Holding.__table__.create(cls.engine)
        run_migration(cls.engine)
        cls.sessions = sessionmaker(bind=cls.engine)
        with cls.sessions() as db:
            db.add_all([User(id=1, email='pg1@test.local', hashed_password='unused', role='user', is_active=True),
                        User(id=2, email='pg2@test.local', hashed_password='unused', role='admin', is_active=True)])
            db.add(Holding(user_id=1, ticker='AAPL', company='Apple', shares=2, avg_price=100,
                           current_price=120, value=240, weight=100, sector='Technology',
                           risk='Learning', score=50, sentiment='Neutral', currency='USD'))
            db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()

    def setUp(self):
        self.enterContext(patch.object(settings, 'SIMULATION_ENABLED', True))
        app = FastAPI()
        app.include_router(router, prefix='/api')

        def test_db():
            with self.sessions() as db:
                yield db
        app.dependency_overrides[get_db] = test_db
        self.client = self.enterContext(TestClient(app))
        self.headers = {'Authorization': 'Bearer ' + create_access_token({'sub': '1'})}
        self.other = {'Authorization': 'Bearer ' + create_access_token({'sub': '2'})}

    def create(self):
        result = self.client.post('/api/simulations', headers=self.headers, json={'scenario': 'PostgreSQL persisted input snapshot'})
        self.assertEqual(result.status_code, 201, result.text)
        return result.json()

    def test_postgres_persistence_isolation_and_jsonb(self):
        result = self.create()
        with self.sessions() as db:
            self.assertEqual(db.get(SimulationSnapshot, result['id']).inputs, result['snapshot']['inputs'])
            self.assertEqual(db.get(SimulationRun, result['id']).status, 'configured')
        self.assertEqual(self.client.get('/api/simulations/' + result['id'], headers=self.headers).json(), result)
        self.assertEqual(self.client.get('/api/simulations/' + result['id'], headers=self.other).status_code, 404)
        self.assertEqual(self.client.get('/api/simulations', headers=self.other).json()['runs'], [])
        columns = {column['name']: str(column['type']) for column in inspect(self.engine).get_columns('simulation_snapshots')}
        self.assertEqual(columns['inputs'], 'JSONB')

    def test_postgres_trigger_and_status_constraint(self):
        result = self.create()
        for sql in ("UPDATE simulation_snapshots SET inputs = '{}'::jsonb WHERE run_id = :id",
                    "DELETE FROM simulation_snapshots WHERE run_id = :id"):
            with self.assertRaises(InternalError):
                with self.engine.begin() as connection:
                    connection.execute(text(sql), {'id': result['id']})
        with self.assertRaises(IntegrityError):
            with self.engine.begin() as connection:
                connection.execute(text("UPDATE simulation_runs SET status = 'queued' WHERE id = :id"), {'id': result['id']})
        self.assertEqual(self.client.get('/api/simulations/' + result['id'], headers=self.headers).json(), result)

    def test_postgres_migration_rerun_preserves_records(self):
        result = self.create()
        with self.engine.connect() as connection:
            before = connection.execute(text('SELECT COUNT(*) FROM holdings')).scalar_one()
        run_migration(self.engine)
        run_migration(self.engine)
        with self.engine.connect() as connection:
            self.assertEqual(connection.execute(text('SELECT COUNT(*) FROM holdings')).scalar_one(), before)
            self.assertEqual(connection.execute(text('SELECT COUNT(*) FROM users')).scalar_one(), 2)
        self.assertEqual(self.client.get('/api/simulations/' + result['id'], headers=self.headers).json(), result)


if __name__ == '__main__':
    unittest.main()
