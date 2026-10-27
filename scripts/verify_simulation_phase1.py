"""Opt-in verification of the rebuilt LOCAL API, with additive test records only.

Uses the Python standard library and Docker CLI. Never prints credentials or
response bodies. Leaves Simulation Lab disabled, as the Phase 1 guide specifies.
Existing rows are fingerprinted internally before/after; no records are deleted.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import secrets
import subprocess
import time
import urllib.error
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://localhost:8000/api'
COMPOSE = ['docker', 'compose', '-f', 'docker-compose.yml', '-f', 'compose.simulation-local.yml']


def docker(arguments, source=None, env=None):
    result = subprocess.run(arguments, input=source, text=True, capture_output=True,
                            cwd=ROOT, env=env, timeout=90)
    if result.returncode:
        # Suppress stderr: arbitrary service errors may contain sensitive values.
        raise RuntimeError('Docker verification command failed; inspect sanitized service diagnostics')
    return result.stdout


def backend_python(source):
    return json.loads(docker(['docker', 'compose', 'exec', '-T', 'backend', 'python', '-'], source))


def request(path, method='GET', body=None, token=None, expected=200):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    payload = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            status, content = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, content = error.code, error.read()
    if status != expected:
        raise AssertionError(f'{method} {path}: expected HTTP {expected}, received {status}')
    return json.loads(content) if content else None


def wait_ready():
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        try:
            request('/health')
            return
        except (OSError, AssertionError):
            time.sleep(1)
    raise RuntimeError('Backend did not become ready in 60 seconds')


def flag(enabled):
    env = dict(os.environ, SIMULATION_ENABLED=str(enabled).lower())
    docker(COMPOSE + ['up', '-d', '--no-deps', 'backend'], env=env)
    wait_ready()


def fingerprints():
    return backend_python('''
import hashlib, json
from sqlalchemy import inspect, select, MetaData, Table
from app.db.database import engine
result = {}
with engine.connect() as connection:
    for name in inspect(connection).get_table_names():
        table = Table(name, MetaData(), autoload_with=connection)
        primary = list(table.primary_key.columns)
        if not primary:
            raise RuntimeError('Cannot fingerprint a table without primary keys')
        rows = {}
        for row in connection.execute(select(table)).mappings():
            key = json.dumps([row[c.name] for c in primary], default=str)
            encoded = json.dumps(dict(row), sort_keys=True, default=str, allow_nan=False).encode()
            rows[key] = hashlib.sha256(encoded).hexdigest()
        result[name] = rows
print(json.dumps(result))
''')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-api-restarts', action='store_true',
                        help='Allow backend-only restart and feature-flag changes; adds persistent test records')
    args = parser.parse_args()
    if not args.allow_api_restarts:
        parser.error('--allow-api-restarts is required for this local integration verification')
    wait_ready()
    state = backend_python('''
import json, hashlib
from pathlib import Path
from sqlalchemy import text
from app.core.config import settings
from app.db.database import engine
with engine.connect() as connection:
    active = connection.execute(text("SELECT count(*) FROM committee_runs WHERE status IN ('queued','running')")).scalar_one()
paths = ['app/api/simulation.py', 'app/models/simulation.py', 'app/schemas/simulation.py',
         'app/services/simulation_service.py', 'app/db/simulation_migration.py', 'app/core/config.py', 'app/main.py']
print(json.dumps({'enabled': settings.SIMULATION_ENABLED, 'activeCommitteeReviews': active,
                  'sourceHashes': {p: hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in paths}}))
''')
    for name, digest in state['sourceHashes'].items():
        assert hashlib.sha256((ROOT / 'backend' / name).read_bytes()).hexdigest() == digest, 'Running source differs: ' + name
    assert state['activeCommitteeReviews'] == 0, 'Wait for existing committee reviews before restarting API'
    existing = fingerprints()
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + secrets.token_hex(3)
    report = {'checkedAtUTC': datetime.now(timezone.utc).isoformat(), 'checks': {},
              'testAccounts': [], 'recordIds': {}, 'browserChecks': 'pending manual verification'}

    def passed(name, value=True):
        report['checks'][name] = value
        print(json.dumps({'check': name, 'result': value}), flush=True)

    def persist_report():
        (ROOT / 'docs' / 'SIMULATION_PHASE1_LIVE_RESULTS.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')

    try:
        passed('rebuilt_source_matches_workspace')
        if not state['enabled']:
            flag(True)
        accounts = []
        for label in ('a', 'b'):
            email = f'phase1-verify-{stamp}-{label}@example.test'
            password = secrets.token_urlsafe(30)
            registered = request('/auth/register', 'POST', {'email': email, 'password': password,
                                  'fullName': 'Phase 1 Verification ' + label.upper()})
            authenticated = request('/auth/login', 'POST', {'email': email, 'password': password})
            assert authenticated['user']['id'] == registered['user']['id']
            accounts.append(authenticated['accessToken'])
            report['testAccounts'].append({'label': label.upper(), 'email': email, 'id': authenticated['user']['id']})
            password = None
        token, other = accounts
        passed('registration_and_login')
        request('/simulations', expected=401)
        request('/auth/me', token=token)
        passed('authentication_required')

        # Paper prices are supplied explicitly; no quote refresh or external data needed.
        request('/portfolio/buy', 'POST', {'ticker': 'AAPL', 'company': 'Phase 1 test Apple',
                'sector': 'Technology', 'shares': 2, 'price': 100, 'currency': 'USD'}, token)
        portfolio = request('/portfolio', token=token)
        assert portfolio['holdingsCount'] == 1 and portfolio['holdings'][0]['shares'] == 2
        assert len(request('/portfolio/transactions', token=token)['transactions']) == 1
        assert request('/portfolio', token=other)['holdingsCount'] == 0
        passed('portfolio_paper_buy_and_isolation')
        dashboard = request('/dashboard', token=token)
        assert dashboard['portfolioCount'] == 1
        passed('dashboard_saved_position_count')

        committee_before = request('/committee/runs', token=token)
        draft = request('/simulations', 'POST', {'title': 'Isolated Phase 1 live verification',
                'scenario': 'Verify a hypothetical interest rate increase against frozen test holdings.',
                'tickers': ['aapl']}, token, expected=201)
        run_id = draft['id']
        report['recordIds']['simulation'] = run_id
        assert draft['status'] == 'configured'
        assert draft['snapshot']['inputs']['holdings'][0]['shares'] == '2.0'
        assert len(draft['snapshot']['inputs']['holdings']) == 1
        assert request('/committee/runs', token=token) == committee_before
        passed('creation_configured_without_committee_job')
        assert request('/simulations/' + run_id, token=token) == draft
        assert any(row['id'] == run_id for row in request('/simulations', token=token)['runs'])
        passed('retrieval_and_listing')
        assert request('/simulations', token=other)['runs'] == []
        request('/simulations/' + run_id, token=other, expected=404)
        passed('cross_user_isolation')
        request('/simulations', 'POST', {'scenario': 'Invalid client status test', 'status': 'queued'}, token, expected=422)
        request('/simulations', 'POST', {'scenario': 'Invalid rounds test', 'configuration': {'rounds': 11}}, token, expected=422)
        passed('invalid_requests_rejected')
        request('/simulations/' + run_id, 'PATCH', {'snapshot': {'inputs': {}}}, token, expected=405)
        mutation = backend_python('''
import json
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from app.db.database import engine
rejected = False
with engine.connect() as connection:
    transaction = connection.begin()
    try:
        connection.execute(text("UPDATE simulation_snapshots SET sha256 = 'invalid' WHERE run_id = :id"),
                           {'id': ''' + repr(run_id) + '''})
    except DBAPIError as error:
        rejected = 'Simulation input snapshots are immutable' in str(error.orig)
    finally:
        transaction.rollback()
print(json.dumps({'rejectedByImmutableTrigger': rejected}))
''')
        assert mutation['rejectedByImmutableTrigger']
        passed('snapshot_api_and_sql_modification_blocked')
        request('/portfolio/buy', 'POST', {'ticker': 'AAPL', 'company': 'Phase 1 test Apple',
                'sector': 'Technology', 'shares': 1, 'price': 130, 'currency': 'USD'}, token)
        assert request('/portfolio', token=token)['holdings'][0]['shares'] == 3
        assert request('/simulations/' + run_id, token=token) == draft
        passed('snapshot_unchanged_after_test_portfolio_changes')

        docker(['docker', 'compose', 'restart', 'backend'])
        wait_ready()
        assert request('/simulations/' + run_id, token=token) == draft
        assert any(row['id'] == run_id for row in request('/simulations', token=token)['runs'])
        passed('backend_restart_persistence')

        ask = request('/ask', 'POST', {'question': 'Explain concentration in my simulated portfolio and its evidence gaps.'}, token)
        assert ask.get('answer') and ask.get('agentRunId')
        report['recordIds']['ask'] = ask['agentRunId']
        assert request('/ask/runs/' + str(ask['agentRunId']), token=token)['id'] == ask['agentRunId']
        status = ask['audit']['status']
        generated = status.startswith('Generated with ')
        fallback = 'fallback' in status.lower()
        assert generated or fallback, 'Unrecognized Ask provenance status'
        passed('ask_api_and_persistence', 'model_generated' if generated else 'deterministic_fallback')

        review = request('/committee/runs', 'POST', {'question': 'Review portfolio concentration and missing evidence for isolated verification.'}, token, expected=202)
        report['recordIds']['committee'] = review['id']
        deadline = time.monotonic() + 150
        while review['status'] in ('queued', 'running') and time.monotonic() < deadline:
            time.sleep(2)
            review = request('/committee/runs/' + review['id'], token=token)
        assert review['status'] in ('completed', 'partial'), 'Committee did not reach a usable terminal state'
        assert review['snapshot'] and review['events']
        assert any(row['id'] == review['id'] for row in request('/committee/runs', token=token))
        request('/committee/runs/' + review['id'], token=other, expected=404)
        perspectives = review['result']['perspectives']
        passed('committee_worker_saved_packet_and_isolation', {
            'status': review['status'], 'modelGeneratedPerspectives': sum(p['status'] == 'generated' for p in perspectives),
            'unavailablePerspectives': sum(p['status'] == 'unavailable' for p in perspectives)})

        flag(False)
        for method, path, body in [('GET', '/simulations', None), ('GET', '/simulations/' + run_id, None),
                                   ('POST', '/simulations', {'scenario': 'Disabled operation verification'})]:
            request(path, method, body, token, expected=404)
        passed('disabled_blocks_create_list_retrieve')
        # Existing application APIs must still function with simulation disabled.
        request('/auth/me', token=token)
        request('/dashboard', token=token)
        request('/portfolio', token=token)
        request('/ask/runs', token=token)
        request('/committee/runs', token=token)
        passed('existing_authenticated_apis_with_simulation_disabled')
        flag(True)
        assert request('/simulations/' + run_id, token=token) == draft
        passed('reenabling_preserves_saved_run')
        request('/auth/logout', 'POST', token=token)
        passed('logout_endpoint')
    finally:
        flag(False)
        after = fingerprints()
        changed = sum(1 for table, rows in existing.items() for key, digest in rows.items()
                      if after.get(table, {}).get(key) != digest)
        report['checks']['preexisting_records_unchanged'] = changed == 0
        report['preexistingRowsCompared'] = sum(len(rows) for rows in existing.values())
        report['changedOrMissingPreexistingRows'] = changed
        report['finalSimulationEnabled'] = False
        persist_report()
        print(json.dumps({'check': 'preexisting_records_unchanged', 'result': changed == 0,
                          'rowsCompared': report['preexistingRowsCompared']}), flush=True)
        assert changed == 0, 'Pre-existing records changed; inspect internally stored verification results'


if __name__ == '__main__':
    main()
