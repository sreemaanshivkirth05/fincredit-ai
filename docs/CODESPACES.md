# GitHub Codespaces

Use the current feature branch and the checked-in dev container.
Select the **4-core / 16 GB** machine in Codespaces creation options. The
`hostRequirements` setting requests that minimum; GitHub may offer a larger
machine if repository/organization policy requires it. No GPU is required.

Creation installs development tools (Python 3.12, Node 22, Docker/Compose,
GitHub CLI). It does **not** build/start the application, seed the database,
download a model, or run inference. Docker's development daemon is started by
the Docker-in-Docker feature; application services are started only below.
There are no application `postCreateCommand` or `postStartCommand` hooks.

## Compose commands and private ports

Run these Bash commands from the repository root in the Codespace. Define the
helper again in each new terminal. The explicit project name keeps volumes
stable, and the non-secret env example prevents loading a workstation `.env`.
Shell variables take precedence over env-file defaults for timeout/output limits.

```bash
mkdir -p .secrets
if [ ! -f .secrets/codespaces.env ]; then
  umask 077
  python - <<'PY'
from pathlib import Path
import secrets
Path('.secrets/codespaces.env').write_text(
    'POSTGRES_PASSWORD=' + secrets.token_hex(24) + '\n', encoding='utf-8'
)
PY
fi
set -a
. .secrets/codespaces.env
set +a

dc() {
  docker compose --project-name fincredit-codespaces \
    --env-file .devcontainer/compose.env.example \
    -f docker-compose.yml -f compose.codespaces.yml "$@"
}
docker compose version  # Requires 2.24.4 or newer for !override / !reset.
dc config --quiet
```

The private password file is ignored by Git. Source it before using `dc` in
each new terminal. If this Codespace already has a database volume created by
an older configuration, put that volume's existing password in the private
file instead of generating a different one; PostgreSQL does not change an
initialized volume's password from a new environment value.

Ports **3000** and **8000** are automatically forwarded. GitHub defaults them
to private; the attach hook explicitly reapplies private access. If that hook
fails (for example, GitHub authentication is unavailable), keep services stopped
until you can confirm **Private** in the Ports panel or run:

```bash
gh codespace ports visibility 3000:private 8000:private -c "$CODESPACE_NAME"
gh codespace ports -c "$CODESPACE_NAME"
```

Only these ports bind on Codespace loopback. PostgreSQL **5432** has its base
published mapping removed; Ollama **11434** has no published mapping. Neither
is automatically forwarded. Containers use `postgres:5432` and `ollama:11434`
on the internal Compose network. Do not add either port to the Ports panel.
The port attributes specify HTTP for the containers; GitHub supplies HTTPS on
the browser-facing forwarded URLs.

## Start the application manually

```bash
dc up -d --build postgres backend frontend
dc ps
curl --fail http://localhost:8000/api/health
curl --fail http://localhost:3000/api/health
```

Open port **3000** from the Ports panel. Create a new application account via
Register. This override uses additive `prepare_release`, without demo bootstrap
or reset; it does not seed demo/admin accounts. Existing development defaults
in the base Compose file are public demo fixtures, not deployment credentials.
Keep the Codespace private and do not use this configuration for production.

The frontend is built with an empty `NEXT_PUBLIC_API_BASE_URL` and a server-side
`/api/*` rewrite to `http://backend:8000`. Browser requests stay on the private
frontend origin and avoid cross-origin GitHub proxy authentication. Backend CORS
and frontend URL use the Codespace's HTTPS address. Port 8000 remains private
for direct API inspection. Local/production builds keep their existing API URL
unless `FINCREDIT_API_PROXY_URL` is explicitly provided.

Ollama and the background workers are not required for startup. Ask AI may use
its existing explicit deterministic fallback until a model is installed and
Ollama is running. Committee jobs remain queued until the worker starts.

## Use free Hugging Face cloud models instead of Ollama

The free cloud override runs Qwen3-8B in the Hugging Face ZeroGPU Space and
uses the Space CPU for financial-text sentiment. It does not start or download
Ollama, and local fallback remains disabled. First deploy the files under
`deployment/huggingface-space/` by following `docs/HUGGINGFACE_INFERENCE.md`.

Add these values to the existing ignored `.secrets/codespaces.env` file. Create
the token and random key privately; do not paste either value into Git, source
files, an issue, or chat.

```dotenv
HF_SPACE_ID=Sreemaan05/fincredit-ai-inference
HF_TOKEN=your_read_token
FINCREDIT_SPACE_KEY=the_same_random_key_saved_as_a_space_secret
```

Source the file and define a separate helper with the Hugging Face override
last so its provider settings take precedence:

```bash
set -a
. .secrets/codespaces.env
set +a

dc_hf() {
  docker compose --project-name fincredit-codespaces \
    --env-file .devcontainer/compose.env.example \
    -f docker-compose.yml -f compose.codespaces.yml \
    -f compose.huggingface-free.yml "$@"
}

dc_hf config --quiet
dc_hf up -d --build postgres backend frontend committee-worker
dc_hf ps
```

Enable Simulation Lab only when you are ready for a small manual test because
each professional agent action uses a ZeroGPU generation. Free daily quota can
run out during multi-agent, multi-round simulations:

```bash
export SIMULATION_ENABLED=true
dc_hf up -d --build backend simulation-worker
```

If the free quota is exhausted, requests fail with an explicit quota message.
The application does not switch to local RAM or a paid provider.

## Download the model only when ready

These are explicit network/storage and CPU operations. They are never lifecycle
hooks. Both backend and Committee use `qwen3.5:4b` at `http://ollama:11434`.
The image is pinned to the existing locally verified Ollama release `0.40.11`;
this Codespaces model/image combination still needs the smoke test below.

```bash
dc up -d ollama
# Wait for the daemon; this command does not download a model.
until dc exec -T ollama ollama list; do sleep 2; done
dc exec -T ollama ollama pull qwen3.5:4b
dc exec -T ollama ollama list
# Optional actual generation (consumes CPU):
dc exec -T ollama ollama run qwen3.5:4b 'Reply with exactly: READY'
dc up -d --build committee-worker
```

Ollama permits one parallel generation and one loaded model. Committee's
existing sequential loop is preserved; API and worker requests are serialized
by the shared Ollama server. The existing CPU settings remain **180 seconds**
per model request, **384 output tokens**, and **8192 context tokens**. Requests
queued behind another generation can time out; truncation and fallback remain
explicit in the application. No HF credentials or automatic HF fallback are
passed through this override. No model is automatically pulled on restart.

Simulation Lab uses its own **768-token** output cap for the larger professional
decision contract. It still uses the same timeout, context limit, and single
sequential Ollama slot.

Simulation Lab remains disabled by default. Phase 2 adds an explicit start API,
a separate sequential worker, persisted rounds/actions/memory, cooperative
cancellation, strict structured output validation, and audit events. It never
writes to portfolio holdings and does not claim to forecast actual markets.

Enable it only after the Ollama smoke test succeeds. Recreate the backend so the
flag reaches the API, then start the worker. This uses the already downloaded
model and performs no generation until an authenticated run is explicitly
started:

```bash
export SIMULATION_ENABLED=true
dc up -d --build backend simulation-worker
dc ps
```

The application currently exposes the Phase 2 API but does not yet include the
Phase 4 Simulation Lab interface. Use the authenticated API workflow in
`docs/SIMULATION_PHASE2.md` to run a small manual test. Stop the worker before
changing models or stopping Ollama.

## Tests

No model or Committee worker is needed for the existing isolated backend suite.
Install tools manually, then run the same checks as CI:

```bash
python -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
(cd backend && ../.venv/bin/python -m unittest discover -s tests -v)
.venv/bin/python -m compileall -q backend/app scripts
(cd frontend && npm ci && npx tsc --noEmit)
(cd frontend && npx playwright install --with-deps chromium)
(cd frontend && npx playwright test tests/e2e/portfolio-scenario.spec.ts tests/e2e/research-workbench.spec.ts)
git diff --check
python scripts/check_git_safety.py  # Paths and finding types only; no staging.
```

Playwright starts its own frontend dev server, so first stop the Compose
frontend with `dc stop frontend` if it is running. Resume with `dc up -d frontend`.
The selected CI browser suites mock backend requests. PostgreSQL-specific tests
skip unless explicitly given an empty, dedicated disposable database. To run
them without publishing PostgreSQL or touching application records:

```bash
dc up -d postgres
dc exec -T postgres createdb -U postgres fincredit_simulation_test
dc run --rm --no-deps -v "$PWD/backend/tests:/app/tests:ro" \
  -e "SIMULATION_TEST_DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/fincredit_simulation_test" \
  backend python -m unittest discover -s tests -p test_simulation_postgres.py -v
```

The test database is intentionally retained. The tests refuse a non-empty test
database on repeat runs; use a fresh disposable Codespace to repeat this check.
Never point it at `fincredit_ai`. The existing `scripts/verify_*.py` remain
workstation verification helpers; they hardcode the local Compose setup and
write their historical result reports. Do not run them unchanged in Codespaces.
Use the isolated suite and the explicit model smoke test above instead.

## Stop, resume, and preserve data

```bash
dc stop committee-worker simulation-worker ollama  # Stop inference/queue processing first.
dc stop                         # Stop the remaining application containers.
# Alternatively remove application containers/network while keeping volumes:
dc down
docker volume inspect fincredit-codespaces_postgres_data fincredit-codespaces_ollama_models
# Resume explicitly; no model re-download is needed if its volume remains:
dc up -d postgres backend frontend
dc up -d ollama committee-worker simulation-worker  # Only when inference is wanted again.
# Stop the Codespace VM itself to stop compute billing:
gh codespace stop -c "$CODESPACE_NAME"
```

PostgreSQL records live in `fincredit-codespaces_postgres_data`; downloaded
weights live in `fincredit-codespaces_ollama_models`. They survive `dc stop`,
`dc down` without `--volumes`, and normal Codespace stop/start. Docker-in-Docker
stores daemon data in its persistent `/var/lib/docker` feature volume. Do not
rely on this as a backup across full rebuild/recovery or Codespace deletion.
Never use `dc down -v`, `docker volume prune`, or `docker system prune --volumes`
when preserving data. Deleting a Codespace deletes its local storage.

Optional database backup (private and ignored; never stage it):

```bash
mkdir -p .secrets
dc exec -T postgres pg_dump -U postgres -Fc fincredit_ai > .secrets/fincredit.dump
```

Store that backup outside the Codespace privately before deletion. Models can
be downloaded again explicitly. No database files, model weights, environment
files, tokens, or personal data belong in Git; sanitized `.env.example` files
and the non-secret `compose.env.example` are intentional exceptions.

References: [machine requirements](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/configuring-dev-containers/setting-a-minimum-specification-for-codespace-machines),
[private forwarded ports](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace),
[Compose merge rules](https://docs.docker.com/reference/compose-file/merge/),
[Ollama concurrency](https://github.com/ollama/ollama/blob/main/docs/faq.mdx).
