"""Real JWTs and file-backed SQLite; never connects to the application database."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.api.simulation import router
from app.core.config import Settings, settings
from app.core.security import create_access_token
from app.db.database import get_db
from app.db.simulation_migration import run_migration
from app.models.holding import Holding
from app.models.simulation import SimulationRun, SimulationSnapshot
from app.models.user import User
from app.schemas.simulation import SimulationCreate


class SimulationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.url = 'sqlite:///' + (Path(self.temp.name) / 'simulations.db').as_posix()
        self.engine = create_engine(self.url, connect_args={'check_same_thread': False})
        User.__table__.create(self.engine)
        Holding.__table__.create(self.engine)
        run_migration(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        app = FastAPI()
        app.include_router(router, prefix='/api')

        def test_db():
            with self.sessions() as db:
                yield db
        app.dependency_overrides[get_db] = test_db
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        for name, value in [('SIMULATION_ENABLED', True), ('SIMULATION_MAX_AGENTS', 6),
                            ('SIMULATION_MAX_ROUNDS', 10), ('SIMULATION_MAX_MODEL_CALLS', 40)]:
            self.enterContext(patch.object(settings, name, value))
        self.headers = {'Authorization': 'Bearer ' + create_access_token({'sub': '1'})}
        self.other = {'Authorization': 'Bearer ' + create_access_token({'sub': '2'})}
        self.admin = {'Authorization': 'Bearer ' + create_access_token({'sub': '3'})}
        with self.sessions() as db:
            for uid, role in [(1, 'user'), (2, 'user'), (3, 'admin')]:
                db.add(User(id=uid, email=f'simulation{uid}@test.local', hashed_password='unused', role=role, is_active=True))
            db.add(Holding(user_id=1, ticker='AAPL', company='Apple', shares=2, avg_price=100,
                           current_price=120, value=240, weight=100, sector='Technology',
                           risk='Learning', score=50, sentiment='Neutral', currency='USD'))
            db.add(Holding(user_id=2, ticker='PRIVATE', company='Other user', shares=1, avg_price=900,
                           value=900, weight=100, sector='Other', risk='Learning', score=50, sentiment='Neutral'))
            db.commit()

    def tearDown(self):
        self.client.close()
        self.engine.dispose()
        self.temp.cleanup()

    def create(self, body=None):
        return self.client.post('/api/simulations', headers=self.headers,
                                json=body or {'scenario': 'A hypothetical interest rate increase', 'tickers': ['aapl']})

    def test_creation_and_snapshot_hash(self):
        with patch('app.services.model_provider.generate_model_answer') as infer:
            response = self.create()
        self.assertEqual(response.status_code, 201, response.text)
        infer.assert_not_called()
        data = response.json()
        self.assertEqual(data['status'], 'configured')
        self.assertEqual(data['version'], 'simulation-v1')
        self.assertEqual(data['snapshot']['inputs']['request']['tickers'], ['AAPL'])
        self.assertEqual(data['snapshot']['inputs']['holdings'][0]['shares'], '2.0')
        self.assertNotIn('PRIVATE', response.text)
        self.assertNotIn('user_id', response.text)
        inputs = data['snapshot']['inputs']
        encoded = json.dumps(inputs, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()
        self.assertEqual(data['snapshot']['sha256'], hashlib.sha256(encoded).hexdigest())
        self.assertEqual(data, self.client.get('/api/simulations/' + data['id'], headers=self.headers).json())

    def test_validation_and_no_invalid_writes(self):
        invalid = [
            {'scenario': ''}, {'scenario': ' ' * 12}, {'scenario': 'x' * 4001},
            {'scenario': 'Valid scenario', 'title': '   '},
            {'scenario': 'Valid scenario', 'user_id': 2},
            {'scenario': 'Valid scenario', 'status': 'queued'},
            {'scenario': 'Valid scenario', 'snapshot': {}},
            {'scenario': 'Valid scenario', 'tickers': ['AAPL', 'aapl']},
            {'scenario': 'Valid scenario', 'tickers': ['invalid ticker']},
            {'scenario': 'Valid scenario', 'tickers': ['AAPL'] * 21},
        ]
        for config in ({'rounds': 0}, {'rounds': 11}, {'rounds': True}, {'rounds': '5'},
                       {'rounds': 1.5}, {'seed': -1}, {'seed': 2**31}, {'seed': False},
                       {'agentTypes': []}, {'agentTypes': ['unknown']},
                       {'agentTypes': ['risk_manager', 'risk_manager']},
                       {'rounds': 10, 'maxModelCalls': 39}, {'maxModelCalls': 0}, {'maxModelCalls': 41},
                       {'maxModelCalls': 1}, {'provider': 'paid'}, {'allowPortfolioWrites': True}):
            invalid.append({'scenario': 'Valid scenario', 'configuration': config})
        for body in invalid:
            with self.subTest(body=body):
                self.assertEqual(self.create(body).status_code, 422)
        with self.sessions() as db:
            self.assertEqual(db.query(SimulationRun).count(), 0)
            self.assertEqual(db.query(SimulationSnapshot).count(), 0)

    def test_server_limits_and_supported_agents(self):
        for name, value in [('SIMULATION_MAX_AGENTS', 3), ('SIMULATION_MAX_ROUNDS', 4),
                            ('SIMULATION_MAX_MODEL_CALLS', 39)]:
            with patch.object(settings, name, value):
                self.assertEqual(self.create().status_code, 422)
        response = self.create({'scenario': 'All six agent types configured', 'configuration': {
            'agentTypes': ['institutional_investor', 'retail_investor', 'risk_manager',
                           'quantitative_analyst', 'news_sentiment_analyst', 'portfolio_manager'],
            'rounds': 6, 'maxModelCalls': 36}})
        self.assertEqual(response.status_code, 201, response.text)

    def test_auth_and_isolation_including_admin(self):
        run_id = self.create().json()['id']
        for headers in (self.other, self.admin):
            self.assertEqual(self.client.get('/api/simulations', headers=headers).json()['runs'], [])
            result = self.client.get('/api/simulations/' + run_id, headers=headers)
            self.assertEqual(result.status_code, 404)
            self.assertNotIn('AAPL', result.text)
        for method, path in [('get', '/api/simulations'), ('get', '/api/simulations/' + run_id),
                             ('post', '/api/simulations')]:
            response = getattr(self.client, method)(path, **({'json': {'scenario': 'Valid scenario'}} if method == 'post' else {}))
            self.assertEqual(response.status_code, 401)
        response = self.client.get('/api/simulations/' + str(uuid4()), headers=self.headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.client.get('/api/simulations/not-a-uuid', headers=self.headers).status_code, 422)

    def test_disabled_mode_blocks_existing_and_new_records(self):
        run_id = self.create().json()['id']
        with patch.object(settings, 'SIMULATION_ENABLED', False):
            self.assertEqual(self.create().status_code, 404)
            self.assertEqual(self.client.get('/api/simulations', headers=self.headers).status_code, 404)
            self.assertEqual(self.client.get('/api/simulations/' + run_id, headers=self.headers).status_code, 404)
        with self.sessions() as db:
            self.assertEqual(db.query(SimulationRun).count(), 1)
            self.assertEqual(db.get(SimulationRun, run_id).status, 'configured')
        self.assertEqual(self.client.get('/api/simulations/' + run_id, headers=self.headers).status_code, 200)

    def test_persistence_and_frozen_inputs_after_portfolio_and_config_change(self):
        response = self.create().json()
        run_id = response['id']
        with self.sessions() as db:
            holding = db.query(Holding).filter_by(user_id=1).one()
            holding.shares = 99
            db.commit()
        # Dispose/reopen the engine as well as sessions to prove file persistence.
        self.engine.dispose()
        reopened = create_engine(self.url)
        with sessionmaker(bind=reopened)() as db:
            self.assertEqual(db.get(SimulationSnapshot, run_id).inputs, response['snapshot']['inputs'])
        reopened.dispose()
        with patch.object(settings, 'SIMULATION_MODEL', 'changed-after-capture'):
            retrieved = self.client.get('/api/simulations/' + run_id, headers=self.headers).json()
        self.assertEqual(response, retrieved)
        for operation in ('patch', 'put', 'delete'):
            self.assertEqual(getattr(self.client, operation)('/api/simulations/' + run_id, headers=self.headers).status_code, 405)

    def test_snapshot_mutation_rejected_by_database(self):
        run_id = self.create().json()['id']
        for sql in ("UPDATE simulation_snapshots SET sha256 = 'changed' WHERE run_id = :id",
                    "DELETE FROM simulation_snapshots WHERE run_id = :id"):
            with self.assertRaises(IntegrityError):
                with self.engine.begin() as connection:
                    connection.execute(text(sql), {'id': run_id})
        with self.sessions() as db:
            self.assertIsNotNone(db.get(SimulationSnapshot, run_id))
        with self.assertRaises(IntegrityError):
            with self.engine.begin() as connection:
                connection.execute(text("UPDATE simulation_runs SET status = 'queued' WHERE id = :id"), {'id': run_id})

    def test_atomic_create_and_no_holdings_writes(self):
        with self.sessions() as db:
            before = [(h.id, h.shares, h.value, h.updated_at) for h in db.query(Holding).order_by(Holding.id)]
        def fail_commit(db):
            db.flush()  # Run and snapshot INSERTs must both roll back.
            raise RuntimeError('Synthetic commit failure')
        with patch.object(self.sessions.class_, 'commit', fail_commit):
            with self.assertRaisesRegex(RuntimeError, 'Synthetic commit failure'):
                self.create()
        with self.sessions() as db:
            self.assertEqual(db.query(SimulationRun).count(), 0)
            self.assertEqual(db.query(SimulationSnapshot).count(), 0)
        self.create()
        with self.sessions() as db:
            self.assertEqual(before, [(h.id, h.shares, h.value, h.updated_at) for h in db.query(Holding).order_by(Holding.id)])

    def test_migration_is_additive_and_idempotent(self):
        result = self.create().json()
        for _ in range(2):
            run_migration(self.engine)
        self.assertIn('simulation_snapshots', inspect(self.engine).get_table_names())
        self.assertEqual(self.client.get('/api/simulations/' + result['id'], headers=self.headers).json(), result)
        with self.sessions() as db:
            self.assertEqual(db.query(User).count(), 3)
            self.assertEqual(db.query(Holding).count(), 2)

    def test_pagination_and_empty_portfolio(self):
        for _ in range(3):
            self.create()
        result = self.client.get('/api/simulations?limit=2&offset=1', headers=self.headers)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(len(result.json()['runs']), 2)
        for query in ('limit=101', 'limit=0', 'offset=-1'):
            self.assertEqual(self.client.get('/api/simulations?' + query, headers=self.headers).status_code, 422)
        result = self.client.post('/api/simulations', headers=self.admin, json={'scenario': 'Empty portfolio scenario'})
        self.assertEqual(result.status_code, 201)
        self.assertEqual(result.json()['snapshot']['inputs']['holdings'], [])

    def test_unavailable_numeric_input_and_snapshot_byte_limit(self):
        with self.sessions() as db:
            holding = db.query(Holding).filter_by(user_id=1).one()
            holding.current_price = float('inf')
            db.commit()
        result = self.create()
        self.assertEqual(result.status_code, 201, result.text)
        self.assertIsNone(result.json()['snapshot']['inputs']['holdings'][0]['currentPrice'])
        with self.sessions() as db:
            holding = db.query(Holding).filter_by(user_id=1).one()
            holding.company = 'x' * (1024 * 1024)
            db.commit()
        self.assertEqual(self.create().status_code, 422)
        with self.sessions() as db:
            self.assertEqual(db.query(SimulationRun).count(), 1)

    def test_portfolio_snapshot_count_limit(self):
        with self.sessions() as db:
            db.execute(Holding.__table__.insert(), [dict(user_id=1, ticker=f'T{i}', company='Test',
                shares=1, avg_price=1, value=1, weight=1, sector='Other', risk='Learning',
                score=50, sentiment='Neutral') for i in range(1000)])
            db.commit()
        result = self.create()
        self.assertEqual(result.status_code, 422)
        self.assertIn('1000 holdings', result.text)
        with self.sessions() as db:
            self.assertEqual(db.query(SimulationRun).count(), 0)


class SimulationSettingsTests(unittest.TestCase):
    def test_disabled_default_and_provider_restrictions(self):
        self.assertIs(Settings.model_fields['SIMULATION_ENABLED'].default, False)
        for invalid in ({'SIMULATION_PROVIDER': 'paid'}, {'SIMULATION_MAX_AGENTS': 7},
                        {'SIMULATION_MAX_ROUNDS': 11}, {'SIMULATION_MAX_MODEL_CALLS': 41}):
            with self.assertRaises(ValidationError):
                Settings(_env_file=None, **invalid)

    def test_schema_rejects_client_owned_identity(self):
        with self.assertRaises(ValidationError):
            SimulationCreate(scenario='Valid scenario', userId=2)


if __name__ == '__main__':
    unittest.main()
