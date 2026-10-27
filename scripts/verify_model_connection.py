"""Opt-in local inference checks; never prints credentials or full research answers.

Uses fresh persistent test records. Does not download models, deploy, or delete data.
"""
import argparse
from datetime import datetime, timezone
import json
import secrets
import time

from verify_simulation_phase1 import ROOT, COMPOSE, backend_python, docker, fingerprints, request, wait_ready


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--restart-services', action='store_true', help='Build/recreate backend and committee worker using local configuration')
    args = parser.parse_args()
    existing = fingerprints()
    active = backend_python('''
import json
from sqlalchemy import text
from app.db.database import engine
with engine.connect() as connection:
    count = connection.execute(text("SELECT count(*) FROM committee_runs WHERE status IN ('queued','running')")).scalar_one()
print(json.dumps({'active':count}))
''')
    assert active['active'] == 0, 'Wait for active reviews before verifying model connections'
    report = {'checkedAtUTC': datetime.now(timezone.utc).isoformat(), 'directGeneration': {}, 'workflows': {}}
    try:
        if args.restart_services:
            docker(COMPOSE + ['up', '-d', '--no-deps', '--build', 'backend', 'committee-worker'])
            wait_ready()
        for service in ('backend', 'committee-worker'):
            source = '''
import json, time
from app.core.config import settings
from app.services.model_provider import generate_model_answer, ModelUnavailable
safe = {'provider':settings.LLM_PROVIDER,'model':settings.OLLAMA_MODEL,
        'timeoutSeconds':settings.LLM_TIMEOUT_SECONDS,'maxOutputTokens':settings.OLLAMA_MAX_OUTPUT_TOKENS,
        'hfTokenPresent':bool(settings.HF_TOKEN.get_secret_value()),
        'spaceKeyConfigured':len(settings.FINCREDIT_SPACE_KEY.get_secret_value())>=32,
        'simulationEnabled':settings.SIMULATION_ENABLED}
started=time.monotonic()
try:
    answer=generate_model_answer('Reply with exactly: FinCredit connection OK')
    safe.update(status='model_generated',actualProvider=answer.provider,actualModel=answer.model,
                nonempty=bool(answer.strip()),exactSyntheticResponse=answer.strip()=='FinCredit connection OK',
                truncated=bool(answer.notice),elapsedSeconds=round(time.monotonic()-started,2))
except ModelUnavailable as error:
    safe.update(status='unavailable',reason=str(error),elapsedSeconds=round(time.monotonic()-started,2))
print(json.dumps(safe))
'''
            # Allow the configured per-call timeout while keeping progress visible.
            import subprocess
            result = subprocess.run(['docker', 'compose', 'exec', '-T', service, 'python', '-'],
                                    input=source, text=True, capture_output=True, cwd=ROOT, timeout=200)
            if result.returncode:
                raise RuntimeError('Direct container check failed; inspect sanitized diagnostics')
            data = json.loads(result.stdout)
            report['directGeneration'][service] = data
            print(json.dumps({'service': service, 'directGeneration': data}), flush=True)
            assert data['status'] == 'model_generated' and data['nonempty'], 'Direct inference failed'
        a, b = report['directGeneration'].values()
        assert all(a[key] == b[key] for key in ('provider','model','timeoutSeconds','maxOutputTokens')), 'Provider configurations differ'
        assert not a['simulationEnabled'] and not b['simulationEnabled'], 'Simulation Lab must remain disabled'

        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + secrets.token_hex(3)
        email = 'model-verify-' + stamp + '@example.test'
        password = secrets.token_urlsafe(30)
        registered = request('/auth/register', 'POST', {'email':email,'password':password,'fullName':'Isolated Model Verification'})
        token = request('/auth/login', 'POST', {'email':email,'password':password})['accessToken']
        password = None
        report['testAccount'] = {'id':registered['user']['id'],'email':email}
        print(json.dumps({'stage':'ask_started','provider':a['provider'],'model':a['model']}), flush=True)
        started = time.monotonic()
        ask = request('/ask', 'POST', {'question':'What portfolio evidence is missing for this empty simulated account? Explain the limitations without inventing facts or numeric values.'}, token)
        audit = ask['audit']['status']
        report['workflows']['ask'] = {'id':ask['agentRunId'],'generated':audit.startswith('Generated with '),
            'fallback':'fallback' in audit.lower(),'auditStatus':audit,'answerCharacters':len(ask['answer']),
            'elapsedSeconds':round(time.monotonic()-started,2)}
        assert request('/ask/runs/' + str(ask['agentRunId']), token=token)['id'] == ask['agentRunId']
        print(json.dumps({'ask':report['workflows']['ask']}), flush=True)

        print(json.dumps({'stage':'committee_started'}), flush=True)
        started = time.monotonic()
        run = request('/committee/runs','POST', {'question':'Challenge the evidence gaps in this empty simulated portfolio. State uncertainty and avoid invented facts.'},token,expected=202)
        deadline = time.monotonic() + 420
        last_role = None
        while run['status'] in ('queued','running') and time.monotonic() < deadline:
            time.sleep(2)
            run = request('/committee/runs/' + run['id'], token=token)
            role = run['events'][-1]['role'] if run['events'] else None
            if role != last_role:
                print(json.dumps({'committeeStage':role,'elapsedSeconds':round(time.monotonic()-started,1)}), flush=True)
                last_role = role
        perspectives = run.get('result',{}).get('perspectives',[])
        report['workflows']['committee'] = {'id':run['id'],'status':run['status'],
            'elapsedSeconds':round(time.monotonic()-started,2),
            'perspectives':[{'role':p['role'],'status':p['status'],'provider':p.get('provider'),
                             'model':p.get('model'),'notice':p.get('notice',''),
                             'auditFlags':bool(p['audit']['missingCitations'] or p['audit']['unknownReferences'] or p['audit']['percentageReview']['findings'])} for p in perspectives]}
        print(json.dumps({'committee':report['workflows']['committee']}), flush=True)
        assert run['status'] in ('completed','partial'), 'Committee failed to finish'
    finally:
        after = fingerprints()
        changed = sum(1 for table, rows in existing.items() for key, digest in rows.items()
                      if after.get(table,{}).get(key) != digest)
        report['preexistingRowsCompared'] = sum(len(rows) for rows in existing.values())
        report['changedOrMissingPreexistingRows'] = changed
        (ROOT / 'docs' / 'MODEL_CONNECTION_LIVE_RESULTS.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'preexistingRowsCompared':report['preexistingRowsCompared'],'changedOrMissingPreexistingRows':changed}), flush=True)
        assert changed == 0, 'Pre-existing rows changed during verification'


if __name__ == '__main__':
    main()
