# FinCredit AI

FinCredit AI is an AI-powered stock research and paper-trading sandbox for beginner investors. It combines stock market data, SEC fundamentals, news, simulated portfolio transactions, watchlist context, and portfolio-aware AI answers so users can practice research workflows without placing real trades.

## Key Features

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

## Local Setup

Create and activate the backend virtual environment, then install backend dependencies according to your local environment:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
.\venv\Scripts\Activate.ps1
```

Make sure PostgreSQL is running and the backend environment points at the correct database. Local `.env` files are intentionally ignored by git.

Start the backend:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
python -m uvicorn app.main:app --reload
```

Install and run the frontend:

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm install
npm run dev
```

Open the app at:

```text
http://localhost:3000/dashboard
```

## Test Commands

Backend compile:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
python -m compileall app
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

## Demo Flow

1. Reset demo data from the dashboard or call `POST /api/demo/reset`.
2. Open `/dashboard` and review the product loop.
3. Research AAPL from the dashboard CTA.
4. Add AAPL to the watchlist or simulate a portfolio buy.
5. Open `/portfolio` and review holdings, weights, and transaction history.
6. Refresh portfolio prices.
7. Sell a small simulated share amount.
8. Ask FinCredit AI about AAPL or portfolio concentration risk.
9. Generate a report from the AI answer and review evidence/governance details.

## Disclaimer

FinCredit AI is a simulated paper-trading and education tool. It is not financial advice, does not recommend real-money trades, and does not place real orders.
