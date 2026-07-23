# FinCredit AI Interview Story

## Opening Story

FinCredit AI is a full-stack stock research and paper-trading platform I built to show how I think about product workflows, data integration, AI orchestration, testing, and launch readiness.

The idea came from a common beginner-investor problem: research is fragmented. A person might look at a price chart, skim news, check fundamentals, track a position in a spreadsheet, and then ask a chatbot for help. FinCredit AI puts that workflow into one local/demo-ready product so the user can practice research decisions without risking real money.

## What The Product Does

The app supports a complete simulated workflow:

1. Login as a user.
2. Search a ticker or company.
3. Review market data, chart history, SEC fundamentals, and news.
4. Add a stock to a watchlist or paper portfolio.
5. Refresh portfolio/watchlist prices.
6. Simulate buys and sells.
7. Track transaction history, realized P/L, unrealized P/L, and portfolio weights.
8. Ask an AI assistant questions using portfolio-aware context.
9. Review evidence, risk drivers, fallback status, and reports.
10. Login as admin to inspect read-only usage and user summaries.

## The Engineering Story

I built FinCredit AI as a full-stack application:

- Next.js and TypeScript for the frontend
- FastAPI for the backend
- PostgreSQL and SQLAlchemy for persistence
- JWT auth with user and admin roles
- yfinance for market/news data
- SEC Company Facts for fundamentals
- LangGraph/LangChain for AI workflow orchestration
- Local Ollama with deterministic timeout fallback
- Playwright for E2E testing and screenshot capture
- Docker Compose and deployment docs for local full-stack runs

## Hard Problems And Tradeoffs

### Partial Data Failure

External data is messy. yfinance can be slow or inconsistent, and SEC Company Facts is not available for every ticker. I handled this by making SEC fundamentals a section-level fallback instead of a page-breaking error. Market data, news, watchlist actions, portfolio actions, and Ask AI remain usable.

### Stock Universe Expansion

The first version used a small ticker-to-CIK map. I expanded it with a dynamic stock search endpoint that uses SEC's company ticker mapping and a local popular-stock fallback. That made the app feel less like a hardcoded demo and more like a real research tool.

### AI Demo Stability

Local LLMs can be slow or unavailable. Instead of letting that break demos, I added deterministic timeout fallback behavior. The app still produces a structured answer with evidence and risk context.

### User Isolation

Because the app has portfolios, watchlists, transactions, and AI history, user isolation matters. Backend services scope data to the authenticated user, and the admin console is role-gated and read-only.

### Testing Live-Data Workflows

Live market values change, so Playwright tests avoid brittle exact price assertions. The tests verify page health, visible workflows, navigation, auth, and stable content instead of specific financial values.

## What I Would Emphasize By Role

## Data Engineer Angle

I would emphasize the backend data model, user-scoped relationships, PostgreSQL persistence, yfinance/SEC ingestion, normalization, refresh workflows, and testable API boundaries.

## Data Analyst / BI Angle

I would emphasize portfolio value, cost basis, P/L, risk drivers, watchlists, transaction history, admin summaries, and how the interface turns financial data into explainable workflows.

## AI Engineer Angle

I would emphasize LangGraph orchestration, context gathering, evidence-backed responses, deterministic fallback, risk-driver generation, and user-specific AI history.

## Full-Stack Engineer Angle

I would emphasize end-to-end ownership: frontend routes, protected auth flows, backend APIs, database design, external services, AI workflow, tests, Docker, docs, and recruiter-ready launch materials.

## Common Interview Questions

### Why did you build this?

I wanted a project that connects full-stack engineering, data integration, AI workflows, and product thinking. Stock research is a good domain because the data is structured but incomplete, the workflows are understandable, and the limitations are important to communicate honestly.

### What makes this more than a dashboard?

It includes the whole workflow: research, watchlist, simulated portfolio, buy/sell transactions, P/L, user-specific history, portfolio-aware AI, evidence/risk output, reports, governance, and admin analytics.

### How does the AI avoid being a black box?

The AI workflow gathers explicit context and returns evidence records, risk drivers, audit status, and fallback information. It is designed to support research, not promise predictive certainty.

### What happens when SEC data is missing?

The stock page shows a section-level warning explaining that SEC Company Facts are mainly available for SEC-reporting public companies. The rest of the page remains usable. Ask AI can still answer from portfolio, transactions, watchlist, market data, and news.

### What did you do for testing?

I used backend compile checks, frontend TypeScript checks, production build checks, Playwright E2E tests, screenshot capture, and manual API smoke tests. E2E tests cover auth, dashboard, portfolio, watchlist, stock research, Ask AI, reports, governance, admin, and screenshot generation.

### What would you improve next?

I would deploy the app publicly, add hosted LLM support, harden auth storage beyond localStorage, add scheduled price refresh jobs, improve analytics, add more backend unit/API tests, and publish a short demo video.

### Is this financial advice?

No. It is paper trading only and designed for educational stock research workflows. It does not place real trades or recommend real-money investments.

## STAR Story

### Situation

Beginner investors often have to combine market data, fundamentals, news, and portfolio tracking manually across multiple tools.

### Task

Build a portfolio-ready project that demonstrates full-stack engineering, external data integration, AI workflow design, auth, testing, and launch documentation.

### Action

I built FinCredit AI with Next.js, FastAPI, PostgreSQL, yfinance, SEC Company Facts, LangGraph, local Ollama fallback, JWT auth, user-specific data isolation, admin analytics, Docker support, and Playwright E2E tests.

### Result

The final MVP supports a repeatable demo flow: login, search stocks, research AAPL/AMZN/GOOGL/META/AMD/PLTR, simulate portfolio actions, refresh prices, ask portfolio-aware AI questions, inspect evidence/risk output, and review admin analytics. The project is documented with screenshots, architecture notes, resume bullets, launch checklist, and interview-ready explanations.
