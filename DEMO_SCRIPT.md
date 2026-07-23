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

## Demo Flow

1. Open the landing page at `http://localhost:3000/`.
2. Explain that it is paper trading only and not financial advice.
3. Login as the demo user.
4. Open `/dashboard` and reset demo data.
5. Open `/stock/AAPL`.
6. Review the price chart, market stats, SEC fundamentals, and news.
7. Add AAPL to the watchlist.
8. Add AAPL to the paper portfolio.
9. Open `/portfolio`.
10. Refresh portfolio prices.
11. Sell a small amount, such as 1 share.
12. Review transaction history and show BUY/SELL rows.
13. Open `/ask`.
14. Ask: `Should I add more AAPL to my simulated portfolio? Use my transactions and evidence.`
15. Show the answer, evidence, risk drivers, and LLM/fallback status.
16. Generate or review a report from the AI workflow.
17. Logout and login as the admin user.
18. Open `/admin` and show user summaries and user detail inspection.

## What To Say During The Demo

- "This app is designed around a research workflow, not stock prediction."
- "Every user has isolated portfolio, watchlist, transaction, and AI history."
- "The AI answer is grounded in structured evidence from portfolio data, transactions, watchlist, market data, SEC facts, and news."
- "If local Ollama is slow or unavailable, the backend returns a deterministic fallback so the demo remains stable."
- "The admin page is read-only and does not expose password hashes or tokens."

## Key Engineering Highlights

- FastAPI + PostgreSQL backend with SQLAlchemy models and services
- JWT auth with user/admin roles
- User-specific data isolation across portfolio, watchlist, transactions, and AI runs
- Read-only admin dashboard
- LangGraph agent workflow with local Ollama timeout fallback
- yfinance and SEC Company Facts integration
- Playwright E2E testing for landing, auth, dashboard, portfolio, watchlist, stock, ask, admin, and demo flows
- Environment-based config and Docker/deployment prep

## Known Limitations

- Paper trading only; no real trades or brokerage integration
- Not financial advice
- yfinance data can be delayed, unavailable, or inconsistent
- SEC facts vary by company and filing availability
- Ollama may be slow or unavailable on some machines
- localStorage JWT storage is an MVP approach

## Future Roadmap

- Cloud deployment and portfolio launch
- Hosted LLM option
- Richer analytics and allocation views
- Portfolio allocation recommendations
- Real-time or scheduled price refresh worker
- OAuth/social login and production session hardening
