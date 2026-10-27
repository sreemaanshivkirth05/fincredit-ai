# Codespaces review: 2026-10-27

Branch: `feat/fincredit-simulation-lab`. No staging, commit, push, or GitHub
publication was performed. Existing Simulation Phase 1, model-provider changes,
verification scripts, and historical verification documentation are preserved.

## Configuration ready for review

- Minimum 4 CPUs / 16 GB; select the 4-core machine when creating the Codespace.
- Development tools only at creation; application, worker, and Ollama startup
  are manual. No automatic model download or inference.
- Automatically forward 3000/8000; private by default with a private-access
  attach hook. Services bind to loopback. PostgreSQL/Ollama have no published ports.
- Both model clients use internal Ollama and `qwen3.5:4b`. One loaded model,
  one parallel generation, existing 180-second/384-output-token CPU limits.
- Simulation remains disabled. Additive schema preparation avoids demo reset.
- Named database/model volumes; exact lifecycle/test/backup commands in
  [CODESPACES.md](CODESPACES.md).
- Optional Next.js API proxy keeps private Codespaces browser requests on the
  frontend origin. Default local and production settings remain compatible.

## Validation completed

| Check | Result |
| --- | --- |
| Base Compose | Passed |
| Base + simulation-local override | Passed |
| Base + Codespaces override | Passed; merged ports, environments, limits, volumes, proxy asserted |
| Production Compose | Passed using synthetic interpolation values only |
| Devcontainer JSON and lifecycle structure | Passed |
| Existing backend unittest suite | 55 passed, 3 PostgreSQL tests skipped; 58 discovered |
| Python compilation | Passed for backend/app and scripts |
| TypeScript | Passed |
| Existing CI Playwright suites | 3 passed |
| Next.js production build with Codespaces proxy settings | Passed; internal rewrite confirmed in build manifest |
| Live Next.js proxy check | Passed GET, POST body, and Authorization forwarding using a synthetic local server |
| Git whitespace | Passed |
| Read-only credential and candidate scan | No findings; local .env ignored and untracked |
| Index | Empty |

Validation ran on Windows using isolated Python 3.13 dependencies and the
installed Node runtime. Codespaces uses Python 3.12/Node 22 as the app does in
Docker/CI. Existing deprecation and chart-size warnings did not fail tests.
Docker Compose CLI 5.6.0 validated configuration without a running Docker daemon.
A Docker image build, running Codespace, real model download/generation, and
isolated PostgreSQL tests were **not** verified in this session. The daemon was
unavailable; no attempt was made to start application services or download weights.

## Credential/data review

The only local credential/environment file found outside dependency caches was
`.env`: ignored and untracked. No credential, database, or model files are in the
intended list. Sanitized environment examples deliberately remain shareable.
Existing public development demo defaults and synthetic test fixtures are not
local account credentials. Historical JSON reports contain synthetic test
identifiers and sanitized status, with no saved authentication values.

`scripts/check_git_safety.py` checks candidate paths, provider-token/private-key/
JWT patterns, and matches to sensitive values in local ignored environment files.
It reports paths and line numbers only. Heuristic scanning supplements source
review and cannot establish that every possible secret format is absent.
Re-run it after any edits and before staging:

```bash
python scripts/check_git_safety.py
git diff --check
git diff --cached --name-only
```

Local `.venv`, frontend dependencies/build/test output, `.env`, credentials,
model weights, database files, and backups stay excluded. Nothing has been staged.

## Safe files intended for staging

42 reviewed candidate files, including this review record:

- `.devcontainer/compose.env.example`
- `.devcontainer/devcontainer.json`
- `.devcontainer/private-ports.sh`
- `.env.example`
- `.gitignore`
- `README.md`
- `backend/.dockerignore`
- `backend/.env.example`
- `backend/app/agents/fincredit_graph.py`
- `backend/app/api/simulation.py`
- `backend/app/core/config.py`
- `backend/app/db/bootstrap_demo.py`
- `backend/app/db/init_db.py`
- `backend/app/db/prepare_release.py`
- `backend/app/db/simulation_migration.py`
- `backend/app/main.py`
- `backend/app/models/simulation.py`
- `backend/app/schemas/simulation.py`
- `backend/app/services/model_provider.py`
- `backend/app/services/simulation_service.py`
- `backend/tests/test_model_provider.py`
- `backend/tests/test_simulation.py`
- `backend/tests/test_simulation_postgres.py`
- `compose.codespaces.yml`
- `compose.production.yml`
- `compose.simulation-local.yml`
- `docker-compose.yml`
- `docs/CODESPACES.md`
- `docs/CODESPACES_REVIEW.md`
- `docs/FINCREDIT_SIMULATION_BLUEPRINT.md`
- `docs/MANUAL_TEST_CHECKLIST.md`
- `docs/MODEL_CONNECTION.md`
- `docs/MODEL_CONNECTION_LIVE_RESULTS.json`
- `docs/SIMULATION_PHASE1.md`
- `docs/SIMULATION_PHASE1_LIVE_RESULTS.json`
- `docs/SIMULATION_PHASE1_LIVE_VERIFICATION.md`
- `frontend/.dockerignore`
- `frontend/Dockerfile`
- `frontend/next.config.ts`
- `scripts/check_git_safety.py`
- `scripts/verify_model_connection.py`
- `scripts/verify_simulation_phase1.py`
