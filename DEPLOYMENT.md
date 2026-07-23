# FinCredit AI Deployment Guide

## Local Docker Run

```powershell
cd C:\Users\shivk\fincredit-ai
docker compose up --build
```

For a new Docker database, seed auth/demo users:

```powershell
docker compose exec backend python -m app.db.phase_40l_auth_migration
```

Open:

```text
http://localhost:3000/
http://localhost:8000/api/health
```

Docker services:

- `postgres`: PostgreSQL database with persistent `postgres_data` volume
- `backend`: FastAPI on port `8000`
- `frontend`: Next.js on port `3000`

Ollama is not included in Docker Compose. Ask AI should still return deterministic fallback answers when a local model is unavailable.

## Non-Docker Local Run

Backend:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
Copy-Item .env.example .env
.\venv\Scripts\Activate.ps1
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m app.db.phase_40l_auth_migration
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Frontend:

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

## Backend Environment Variables

- `APP_NAME`
- `APP_ENV`
- `API_PREFIX`
- `DATABASE_URL`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`
- `ADMIN_USER_EMAIL`
- `ADMIN_USER_PASSWORD`
- `OLLAMA_MODEL`
- `LLM_TIMEOUT_SECONDS`

## Frontend Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`

Set this to the public backend origin before building or deploying the frontend.

## PostgreSQL Setup

1. Create a PostgreSQL database named `fincredit_ai` or update `DATABASE_URL`.
2. Confirm the backend can connect with `/api/db-check`.
3. Run the auth migration:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
.\venv\Scripts\python.exe -m app.db.phase_40l_auth_migration
```

The migration is non-destructive and creates demo/admin users if missing. It does not duplicate users when rerun.

## Demo Reset

After logging in as the demo user, reset demo data from `/dashboard`, or call:

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/demo/reset" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Method POST | ConvertTo-Json -Depth 8
```

Review whether `/api/demo/reset` should be disabled, hidden, or further protected outside local demos.

## CORS Checklist

- Local frontend: `http://localhost:3000`
- Local alternate: `http://127.0.0.1:3000`
- Production: exact deployed frontend origin
- Avoid broad wildcards when credentials are enabled.

## JWT/Security Checklist

- Replace the local fallback `JWT_SECRET_KEY`.
- Use HTTPS in production.
- Do not log tokens or password hashes.
- Do not commit `.env` or `.env.local`.
- Treat localStorage token storage as an MVP/demo implementation.
- Rotate secrets if they were ever exposed.

## LLM/Ollama Caveat

Local Ollama works best on a development machine or VM-style host that can run the model service. Typical serverless deployments cannot run a local Ollama daemon. FinCredit AI keeps the demo stable by falling back to deterministic answers when the LLM times out or is unavailable.

## Production Checklist

- Backend has a production PostgreSQL `DATABASE_URL`.
- Frontend has `NEXT_PUBLIC_API_BASE_URL`.
- `APP_ENV=production`.
- `JWT_SECRET_KEY` is long, random, and private.
- CORS origins are exact.
- Auth migration has run.
- Demo reset policy is decided.
- HTTPS is enabled.
- Logs do not expose secrets.
- Dependency audit is reviewed.

## Dependency Audit Note

Run:

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm audit
npm outdated
```

Do not run `npm audit fix --force` without reviewing proposed framework/tooling changes. Forced audit fixes can move Next.js or shadcn in ways that need regression testing.

Final Phase 40 audit status:

- 10 vulnerabilities reported: 5 moderate, 5 high
- `npm audit fix --dry-run` changes `shadcn` and several transitive packages
- `npm audit fix --force` proposes framework/tooling changes
- No audit fixes were applied during the final stability pass

## Pre-Deployment Tests

```powershell
cd C:\Users\shivk\fincredit-ai\backend
.\venv\Scripts\python.exe -m compileall app

cd C:\Users\shivk\fincredit-ai\frontend
npx tsc --noEmit
npm run build
npm run test:e2e
npm run test:e2e:headed
npm audit
npm outdated
```

Smoke endpoints:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/portfolio`
- `GET /api/admin/overview` with admin token
