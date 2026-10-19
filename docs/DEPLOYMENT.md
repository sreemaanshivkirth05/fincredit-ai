# Deployment runbook

The repository now includes deployment configuration; it has not been deployed by this change. Use a staging environment first. Software/model routing uses Ollama or Hugging Face only. A domain/server is not supplied, and free cloud GPU availability is not guaranteed. Do not select paid hardware to follow this runbook.

## Local Docker (Windows / Docker Desktop)

1. Start Docker Desktop with Linux containers.
2. In PowerShell, open the repository folder. Run `git checkout feat/committee-release` after fetching the branch (or use main after the PR merges).
3. Optional: create the root `.env` with `LLM_PROVIDER=ollama` and `OLLAMA_MODEL=qwen3:1.7b`. Start Ollama on the host and pull that model. Alternatively follow `deployment/huggingface-space/README.md` and configure the Space secrets locally.
4. Run `docker compose up -d --build`.
5. Run `docker compose ps`, then `docker compose logs --tail=60 backend committee-worker` if a service fails.
6. Open `http://localhost:3000`. Open Committee from navigation. The backend runs at port 8000. The default local composition seeds development accounts only.
7. Stop with `docker compose down`. Do not add `-v` unless you intend to delete the database volume.

The worker is required for committee reviews. Queued reviews remain saved if it is stopped. Native development also requires `python -m app.committee_worker` from `backend` in a separate terminal after schema preparation.

## Production/staging setup

Use the standalone `compose.production.yml`, not the development composition plus overrides. Back up existing data first. A fresh production database does not receive demo users or admin credentials. Register your account normally; privileged administration must be provisioned deliberately by the operator.

Create `.env.production` on the server, never commit it:

```dotenv
DOMAIN=your-real-domain.example
POSTGRES_PASSWORD=REPLACE_WITH_STRONG_PASSWORD
DATABASE_URL=postgresql://fincredit:URL_ENCODED_PASSWORD@postgres:5432/fincredit_ai
JWT_SECRET_KEY=REPLACE_WITH_RANDOM_SECRET_AT_LEAST_40_CHARACTERS
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen3:1.7b
OLLAMA_BASE_URL=http://host.docker.internal:11434
# For the free Hugging Face Space route instead:
# LLM_PROVIDER=huggingface
# HF_SPACE_ID=Sreemaan05/fincredit-ai-inference
# HF_TOKEN=SERVER_SIDE_TOKEN
# FINCREDIT_SPACE_KEY=SAME_RANDOM_KEY_CONFIGURED_IN_SPACE
```

Generate the JWT secret using `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Use a different secret for the Space. URL-encode special characters in the database URL password. The actual domain must resolve to your server; permit inbound 80/443 for Caddy TLS. Keep Ollama and PostgreSQL private. Host Ollama must accept connections from the Docker bridge without exposing its port publicly.

```sh
docker compose --env-file .env.production -f compose.production.yml up -d --build
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=60 backend committee-worker
```

Caddy serves the frontend and `/api/*` on one HTTPS origin. Database and API ports are not published. The frontend is built with an empty API base so browser requests remain same-origin. The backend runs additive schema preparation before starting; no demo data is seeded. Seeded default accounts must be renamed/removed and passwords rotated before promoting a development database. This schema path targets the current main schema; older pre-auth databases require their prior migrations first.

For backups, use `pg_dump` through the PostgreSQL container and store the result securely outside the host. Rehearse restoration before promotion. Preserve the previous image/commit and database backup for rollback; do not remove volumes or destructively downgrade schema.

## Before opening public access

Complete `RELEASE-0.2.md` acceptance checks. Existing authentication uses bearer tokens in browser localStorage; consider hardened cookie-based sessions, rate limiting at the hosting edge, account recovery, retention policy and monitoring for a public multi-user launch. Existing report/governance functions use a shared workspace library, not private per-user report ownership. These are material deployment boundaries, not completed security certifications. The committee endpoints themselves isolate all saved runs by user, including admin users.
