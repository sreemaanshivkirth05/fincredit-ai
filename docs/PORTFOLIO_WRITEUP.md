# FinCredit AI - Portfolio Project Writeup

## One-Line Summary

FinCredit AI is a full-stack stock research and paper-trading platform with simulated portfolios, dynamic ticker search, evidence-backed AI answers, user-specific data, and admin analytics.

## Problem

Beginner investors often research stocks across disconnected tools: market pages, SEC filings, news feeds, spreadsheets, notes, and general-purpose chatbots. That creates a workflow problem: price data, fundamentals, portfolio context, transaction history, and reasoning are separated.

FinCredit AI addresses that gap as an educational paper-trading tool. It helps users practice research habits without placing real orders or making real-money recommendations.

## Solution

FinCredit AI brings the core research loop into one local/demo-ready MVP:

1. Search a ticker or company.
2. Review market data, chart context, SEC fundamentals, and news.
3. Add the stock to a watchlist or simulated portfolio.
4. Refresh portfolio/watchlist prices.
5. Track simulated buy/sell transactions and P/L.
6. Ask portfolio-aware AI questions.
7. Review evidence, risk drivers, audit details, and reports.

The product is designed for explanation and repeatability. Demo reset tooling, Playwright E2E coverage, Docker support, screenshots, and role-based admin views make it easier to present to recruiters and interviewers.

## Target Users

- Beginner investors learning research workflows with paper trading
- Students practicing data-driven financial analysis
- Recruiters and hiring managers evaluating full-stack, data, and AI engineering ability
- Developers studying how to connect a frontend app, FastAPI services, PostgreSQL, external data sources, and an AI workflow

## Core Product Flow

The demo flow starts at the public landing page and moves into a protected analyst workspace:

1. Login as the demo user.
2. Reset demo data from the dashboard.
3. Search for a ticker such as `AAPL`, `AMZN`, `GOOGL`, `META`, `AMD`, or `PLTR`.
4. Open the stock research page.
5. Review chart, market stats, SEC fundamentals, news, watchlist state, and portfolio state.
6. Add the stock to the watchlist or paper portfolio.
7. Open the portfolio, refresh prices, sell a small amount, and inspect transaction history.
8. Ask AI a portfolio-aware question and inspect the evidence/risk output.
9. Login as admin and review read-only user analytics.

## Key Features

- Public landing page and protected workspace
- JWT login, registration, profile, logout, and role-based admin access
- User-specific portfolio holdings, watchlists, transactions, reports, and AI history
- Dynamic stock search using SEC company ticker data with a local popular-stock fallback
- Stock Intelligence layer with investment case scorecard, financial health scanner, valuation reality check, bull/bear/base case, portfolio fit, decision readiness, and evidence strength
- Market data and chart flows powered by yfinance
- SEC Company Facts fundamentals when available
- Section-level SEC fallback for ETFs, funds, ADRs, or unsupported tickers
- Paper buy/sell simulation with cost basis, value, realized P/L, and unrealized P/L
- Portfolio and watchlist price refresh workflows
- Portfolio-aware Ask AI workflow using portfolio, transaction, watchlist, market, SEC, news, evidence, and risk context
- Deterministic fallback when local Ollama is unavailable or slow
- Generated reports and governance/audit views
- Read-only admin dashboard
- Playwright E2E tests and screenshot capture
- Docker Compose support and deployment documentation

## Technical Architecture

FinCredit AI is split into a Next.js frontend, FastAPI backend, PostgreSQL database, and external data/AI integrations.

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui-style components, Recharts, Playwright
- Backend: FastAPI, SQLAlchemy, Pydantic settings, JWT auth
- Database: PostgreSQL for users, holdings, transactions, watchlists, reports, market snapshots, SEC fundamentals, and AI runs
- Data: yfinance for market/news data and SEC Company Facts for fundamentals
- AI: LangGraph/LangChain workflow with local Ollama and deterministic timeout fallback
- Testing: backend compile checks, TypeScript checks, production build, Playwright E2E, screenshot capture

## Backend Architecture

The backend exposes route groups for auth, dashboard, portfolio, watchlist, stock search, market data, SEC fundamentals, news, Ask AI, reports, governance, and admin.

Key backend responsibilities:

- Authenticate users and issue JWTs
- Scope user data by authenticated account
- Persist holdings, watchlist rows, transactions, snapshots, reports, and AI runs
- Fetch and normalize yfinance market/news data
- Resolve ticker-to-CIK values using a local fallback map plus SEC ticker mapping
- Fetch SEC Company Facts when available
- Run the LangGraph AI workflow and save agent outputs
- Provide read-only admin summaries without exposing tokens or password hashes

## Frontend Architecture

The frontend is organized as a protected app workspace plus a public landing page.

Key frontend responsibilities:

- Render the landing page and app routes
- Store local MVP JWT session data in localStorage
- Guard protected routes and role-gated admin routes
- Provide dynamic stock search with manual ticker fallback
- Render stock research pages with graceful section-level SEC fallback
- Support portfolio/watchlist actions and refresh workflows
- Present AI answers, evidence, risk drivers, and audit status
- Capture product screenshots through Playwright

## AI Workflow

Ask AI is portfolio-aware. Instead of answering from only the user question, the workflow gathers context from:

- Current portfolio holdings
- Recent transactions
- Watchlist entries
- Market snapshots
- SEC fundamentals when available
- Recent news signals
- Risk drivers
- Evidence records

LangGraph coordinates the workflow and LangChain/Ollama can generate natural language responses locally. If Ollama is unavailable or slow, the backend returns a deterministic fallback answer so demos remain stable.

## Data Sources

- yfinance: market data, stock metadata, price refreshes, chart data, and news signals
- SEC Company Facts: public company fundamentals such as revenue, net income, assets, liabilities, and equity when available
- PostgreSQL: persisted application state and historical snapshots

SEC data availability varies by ticker. ETFs, funds, ADRs, or unsupported issuers may still show market data while displaying a section-level SEC warning.

## Authentication And User Isolation

FinCredit AI uses JWT authentication with separate `user` and `admin` roles.

User-specific data includes:

- Portfolio holdings
- Watchlist entries
- Transactions
- AI history
- Reports

The admin dashboard is role-gated and read-only. It is designed for product/usage visibility, not account modification.

## Admin Dashboard

The admin console shows:

- Total users
- Portfolio value summary
- Transaction counts
- AI run counts
- User list
- Read-only user detail panels

The admin flow demonstrates role-based access while avoiding sensitive auth data exposure.

## Testing Strategy

The project uses layered verification:

- Backend compile check with `python -m compileall app`
- Frontend TypeScript check with `npx tsc --noEmit`
- Production build with `npm run build`
- Playwright E2E tests for auth, dashboard, portfolio, watchlist, stock research, Ask AI, admin, screenshots, and smoke routes
- Manual API smoke checks for health, stock search, SEC fundamentals, portfolio, watchlist, and Ask AI

## Docker/Deployment Readiness

The repo includes:

- Backend Dockerfile
- Frontend Dockerfile
- Docker Compose local stack
- PostgreSQL service configuration
- Environment examples
- Deployment guide
- Pre-deployment checklist

Ollama is not included in Docker Compose. The app remains demo-stable because Ask AI can return deterministic fallback output when the local LLM is unavailable.

## Known Limitations

- Paper trading only
- Not financial advice
- No brokerage integration
- No real orders
- No predictive certainty
- yfinance data may be delayed, unavailable, or inconsistent
- SEC Company Facts coverage varies by ticker and issuer type
- localStorage JWT storage is an MVP/demo approach
- Local Ollama may be slow or unavailable
- Dependency audit items are documented and deferred for intentional upgrade testing

## Future Roadmap

- Public cloud deployment
- Hosted LLM option for production environments
- Production-grade session strategy
- Scheduled price refresh worker
- Richer allocation analytics
- Better news summarization and source filtering
- Portfolio website case study
- Short demo video for recruiters
- More backend unit/API tests

## What I Learned

- How to connect product workflows across frontend, backend, database, external data, and AI orchestration
- How to keep an AI app demo-stable with timeout fallback behavior
- How to design user isolation and role-based admin access
- How to handle partial data availability gracefully instead of breaking a page
- How to convert raw stock data into deterministic research signals without presenting financial advice
- How to write E2E tests around live-data workflows without asserting brittle exact values
- How to present a technical project as a recruiter-friendly product story

## Interview Talking Points

- "This is a paper-trading research workflow, not a stock prediction or brokerage app."
- "The hardest product decision was making partial data failure graceful, especially SEC coverage for unsupported tickers."
- "The AI answer is grounded in portfolio, transactions, watchlist, market, SEC, news, evidence, and risk context."
- "LangGraph gives the AI workflow structure and makes the fallback path predictable."
- "User isolation is enforced through authentication context and database relationships."
- "The admin dashboard is read-only so I can show product visibility without exposing sensitive auth data."
- "Playwright tests make the demo repeatable and protect the core routes."
- "The project is designed to show full-stack execution, data integration, AI workflow design, and launch readiness."
