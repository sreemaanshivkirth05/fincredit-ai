# FinCredit AI

FinCredit AI is an AI-powered stock research and paper-trading sandbox for beginner investors. It combines stock market data, SEC fundamentals, news, simulated portfolio transactions, watchlist context, and portfolio-aware AI answers so users can practice research workflows without placing real trades.

The public landing page lives at `/`, while the internal working dashboard lives at `/dashboard`. The landing page uses an original modern SaaS layout inspired by clean Figma-style product pages.

## Key Features

- User registration and JWT login with `user` and `admin` roles
- Account-isolated portfolios, watchlists, transactions, and AI history
- Read-only admin dashboard for user summaries and usage inspection
- Stock research pages for ticker-level market data, charts, SEC fundamentals, and news
- Simulated paper trading with buy and sell flows
- Portfolio holdings, cost basis, unrealized P/L, sector exposure, and risk scoring
- Buy/sell transaction history with realized P/L on sells
- Portfolio and watchlist price refresh actions
- Watchlist monitoring before simulating a buy
- Portfolio-aware AI answers backed by holdings, transactions, watchlist, market, SEC, and news evidence
- Evidence, governance audit details, generated reports, and report review flows
- Playwright browser tests for core demo workflows

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Playwright
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- AI: LangGraph, LangChain, Ollama with timeout fallback
- Data: yfinance, SEC Company Facts API

## Architecture

- `frontend/`: Next.js app with dashboard, stock research, portfolio, watchlist, ask, reports, and governance pages.
- `backend/`: FastAPI app with routers for dashboard, portfolio, watchlist, ask, reports, governance, market, SEC, news, and demo reset.
- PostgreSQL: Stores holdings, transactions, watchlist rows, market snapshots, SEC fundamentals, reports, and agent governance data.
- AI workflow: LangGraph coordinates portfolio, transaction, watchlist, market, SEC, news, risk, evidence, and answer generation. Ollama is used locally when available, with deterministic fallback when slow or unavailable.
- External data: yfinance powers market/news data, and SEC Company Facts powers fundamentals.

## Environment Setup

Local secrets and machine-specific URLs live in ignored env files. Start by copying the examples:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
Copy-Item .env.example .env

cd C:\Users\shivk\fincredit-ai\frontend
Copy-Item .env.example .env.local
```

Update `backend\.env` with your local PostgreSQL password. Update `frontend\.env.local` only if the backend is not running at `http://127.0.0.1:8000`.

## Local Setup

Create and activate the backend virtual environment, then install backend dependencies:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
.\venv\Scripts\Activate.ps1
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

Make sure PostgreSQL is running and `DATABASE_URL` in `backend\.env` points at the correct database.

Run the auth migration once for an existing local database:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
.\venv\Scripts\python.exe -m app.db.phase_40l_auth_migration
```

Start the backend:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Install and run the frontend:

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm install
npm run dev
```

Open the app at:

```text
http://localhost:3000/
http://localhost:3000/dashboard
```

## Test Commands

Backend compile:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
.\venv\Scripts\python.exe -m compileall app
```

Frontend TypeScript:

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npx tsc --noEmit
```

Playwright:

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npx playwright install chromium
npm run test:e2e
npm run test:e2e:headed
```

Review frontend dependency advisories:

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm audit
```

## Demo Flow

1. Open `/` and use the public landing page CTAs to enter the app.
2. Login with `demo@fincredit.ai` / `DemoPass123!`.
3. Reset demo data from the dashboard or call `POST /api/demo/reset` with the demo token.
4. Open `/dashboard` and review the product loop.
5. Research AAPL from the landing page or dashboard CTA.
6. Add AAPL to the watchlist or simulate a portfolio buy.
7. Open `/portfolio` and review holdings, weights, and transaction history.
8. Refresh portfolio prices.
9. Sell a small simulated share amount.
10. Ask FinCredit AI about AAPL or portfolio concentration risk.
11. Generate a report from the AI answer and review evidence/governance details.

## Authentication

FinCredit AI now uses JWT-based authentication for the local MVP. The frontend stores the access token in `localStorage` and sends it as `Authorization: Bearer <token>` for protected API calls. This is intentionally simple for a portfolio/demo project and is not production hardening.

Local demo credentials only:

- User: `demo@fincredit.ai` / `DemoPass123!`
- Admin: `admin@fincredit.ai` / `AdminPass123!`

Each user has isolated portfolio holdings, transaction history, watchlist rows, and AI agent runs. The admin role exists for future admin dashboard access.

## Security Notes

- Replace `JWT_SECRET_KEY` with a long random value before deployment.
- Do not commit `.env` or `.env.local` files.
- Use HTTPS in production.
- Treat localStorage token storage as an MVP/demo approach, not final production auth hardening.
- Configure `CORS_ALLOWED_ORIGINS` to the exact production frontend origin.
- Do not expose tokens or password hashes in logs, API responses, or admin UI.

## Deployment Notes

- Backend deployment needs a reachable PostgreSQL `DATABASE_URL`.
- Frontend deployment needs `NEXT_PUBLIC_API_BASE_URL` set to the deployed backend origin.
- Serverless hosts usually cannot run a local Ollama daemon. Use an environment where Ollama is available, or rely on the deterministic fallback answer when local LLM calls are unavailable.
- `POST /api/demo/reset` is for local demo data reset. Protect or disable equivalent functionality before production use.
- See [DEPLOYMENT.md](DEPLOYMENT.md) for the pre-deployment checklist.

## Admin Dashboard

Admins can open `/admin` to view a read-only overview of all users, active accounts, portfolio totals, watchlist usage, transaction counts, and saved AI runs. The admin detail panel can inspect a user summary, holdings, latest transactions, watchlist items, and latest AI runs.

Admin credentials:

- `admin@fincredit.ai` / `AdminPass123!`

The admin dashboard is a local MVP for inspection only. It does not delete users, modify portfolios, show password hashes, expose tokens, or replace production admin controls.

## Disclaimer

FinCredit AI is a simulated paper-trading and education tool. It is not financial advice, does not recommend real-money trades, and does not place real orders.
