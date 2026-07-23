# FinCredit AI Demo Walkthrough

## One-Sentence Pitch

FinCredit AI is a full-stack stock research and paper-trading MVP that helps beginner investors practice evidence-based decisions with user-specific portfolios and portfolio-aware AI.

## Problem It Solves

Beginner investors often jump between market pages, news, fundamentals, spreadsheets, and notes. FinCredit AI puts research, simulated decisions, transaction history, risk context, and AI explanations into one guided workflow.

## Tech Stack Summary

- Frontend: Next.js, TypeScript, Tailwind, shadcn/ui, Recharts
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Auth: JWT with user/admin roles
- AI: LangGraph, LangChain, Ollama, deterministic timeout fallback
- Data: yfinance and SEC Company Facts
- Testing/deployment prep: Playwright, Docker, docker-compose

## Demo Credentials

Local demo only:

- Demo user: `demo@fincredit.ai` / `DemoPass123!`
- Admin user: `admin@fincredit.ai` / `AdminPass123!`

## 2-Minute Demo

1. Open `http://localhost:3000/` and frame the project as paper trading, not financial advice.
2. Login as the demo user and land on `/dashboard`.
3. Reset demo data so the walkthrough is repeatable.
4. Open `/stock/AAPL` and show the chart, market metrics, SEC fundamentals, news, watchlist action, portfolio action, and Ask AI handoff.
5. Add AAPL to the portfolio or watchlist.
6. Open `/ask` and ask: `Should I add more AAPL to my simulated portfolio? Use my transactions and evidence.`
7. Show that the answer cites portfolio, transactions, market, SEC, news, watchlist, risk drivers, and fallback/audit status.
8. Login as admin and open `/admin` to show read-only user analytics.

## 5-Minute Demo

1. Open the landing page and explain the beginner investor workflow.
2. Login as the demo user.
3. Open `/dashboard`, reset demo data, and point out the protected workspace.
4. Search or navigate to `/stock/AAPL`.
5. Review the stock research page: price chart, market data, SEC fundamentals, news, watchlist status, portfolio holding status, and Ask AI entry point.
6. Add AAPL to the watchlist.
7. Add AAPL to the paper portfolio.
8. Open `/portfolio`, refresh prices, sell 1 share, and review the transaction history with BUY/SELL rows.
9. Open `/watchlist`, refresh prices, and explain that watchlist state is scoped to the signed-in user.
10. Open `/ask` and ask a portfolio-aware question about AAPL.
11. Walk through the response, evidence, risk drivers, and LLM/fallback status.
12. Open reports or governance if available and show the audit/reporting path.
13. Logout, login as admin, and open `/admin`.
14. Explain that admin views are read-only and do not expose password hashes, tokens, or private secrets.

## Interview Talking Points

- The product is designed around an end-to-end research workflow, not stock prediction.
- Every user has isolated portfolio, watchlist, transaction, report, and AI history data.
- The AI response is grounded in structured evidence from portfolio data, transactions, watchlist, market data, SEC facts, and news.
- LangGraph coordinates a multi-step research workflow with predictable fallback behavior.
- If local Ollama is slow or unavailable, the backend returns a deterministic fallback so the demo remains stable.
- The admin page is read-only and supports product/usage inspection without exposing sensitive auth data.
- Playwright E2E tests cover the recruiter demo paths so the walkthrough is repeatable.
- Docker and env examples make the project easier to run outside the original development machine.

## Common Questions And Answers

### Why did you build this?

I wanted a project that connects data engineering, product thinking, and AI into one realistic workflow. Beginner investors need more than a price chart; they need portfolio context, transactions, fundamentals, news, and a way to reason through decisions safely.

### What makes it different from a normal stock dashboard?

Most dashboards stop at market data. FinCredit AI combines stock research, simulated trading, user-specific portfolio state, evidence-backed AI answers, reports, governance, admin analytics, and E2E-tested demo flows.

### How does user isolation work?

Users authenticate with JWTs. Backend services scope portfolio holdings, watchlist entries, transactions, reports, and AI runs to the current authenticated user through database relationships and request-level auth context.

### What does LangGraph do here?

LangGraph structures the AI workflow into a predictable graph: collect portfolio context, market data, SEC fundamentals, news, transactions, watchlist context, risk signals, and then produce an evidence-backed answer with audit metadata.

### What happens if Ollama is slow?

The backend uses timeout handling and deterministic fallback responses. That keeps the product usable during demos even when a local LLM is unavailable or too slow.

### How did you test it?

The project uses backend compile checks, frontend TypeScript checks, production builds, and Playwright E2E tests covering auth, dashboard, stock research, portfolio, watchlist, Ask AI, admin, and screenshot workflows.

### What would you improve next?

I would deploy it publicly, add a hosted LLM option, harden auth storage beyond localStorage, add scheduled price refresh jobs, expand analytics, and create a polished portfolio case study with a demo video.

### Is this financial advice?

No. It is a simulated paper-trading and education tool. It does not place real orders or recommend real-money trades.

## Key Engineering Highlights

- FastAPI + PostgreSQL backend with SQLAlchemy models and services
- JWT auth with user/admin roles
- User-specific data isolation across portfolio, watchlist, transactions, and AI runs
- Read-only admin dashboard
- LangGraph agent workflow with local Ollama timeout fallback
- yfinance and SEC Company Facts integration
- Playwright E2E testing for landing, auth, dashboard, portfolio, watchlist, stock, ask, admin, demo, and screenshot flows
- Environment-based config and Docker/deployment prep

## Known Limitations

- Paper trading only; no real trades or brokerage integration
- Not financial advice
- yfinance data can be delayed, unavailable, or inconsistent
- SEC facts vary by company and filing availability
- Ollama may be slow or unavailable on some machines
- localStorage JWT storage is an MVP approach

## Future Roadmap

- GitHub portfolio launch with screenshots and demo video
- Cloud deployment
- Hosted LLM option
- Richer analytics and allocation views
- Portfolio allocation recommendations
- Real-time or scheduled price refresh worker
- OAuth/social login and production session hardening
