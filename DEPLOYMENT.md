# FinCredit AI Deployment Checklist

## Local Development

- Copy `backend\.env.example` to `backend\.env`.
- Copy `frontend\.env.example` to `frontend\.env.local`.
- Set `DATABASE_URL` to a local PostgreSQL database.
- Run `.\venv\Scripts\python.exe -m app.db.phase_40l_auth_migration`.
- Start FastAPI with `.\venv\Scripts\python.exe -m uvicorn app.main:app --reload`.
- Start Next.js with `npm run dev`.

## Production Environment Variables

Backend:

- `APP_ENV=production`
- `DATABASE_URL`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `OLLAMA_MODEL`
- `LLM_TIMEOUT_SECONDS`

Frontend:

- `NEXT_PUBLIC_API_BASE_URL`

## Backend Considerations

- Use a managed PostgreSQL database or a secured self-hosted PostgreSQL instance.
- Run schema/auth migration steps before serving traffic.
- Set `CORS_ALLOWED_ORIGINS` to exact frontend origins, not broad wildcards.
- Replace the local JWT fallback secret with a long random secret.
- Use HTTPS end to end.
- Review whether `/api/demo/reset` should be disabled, protected further, or hidden outside demo environments.

## Frontend Considerations

- Set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend origin before building.
- Confirm protected routes redirect cleanly when a token is missing or expired.
- Treat localStorage JWT storage as an MVP/demo pattern. Harden token storage and session rotation before production use.

## Ollama Caveat

Local Ollama works well for development machines and VM-style deployments that can run the model service. Typical serverless platforms do not host a local Ollama daemon. FinCredit AI should still return deterministic fallback answers when the local LLM is unavailable or times out.

## Pre-Deployment Tests

```powershell
cd C:\Users\shivk\fincredit-ai\backend
.\venv\Scripts\python.exe -m compileall app

cd C:\Users\shivk\fincredit-ai\frontend
npx tsc --noEmit
npm run test:e2e
npm run test:e2e:headed
npm audit
```
