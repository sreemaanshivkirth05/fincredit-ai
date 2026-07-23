# Project Status

## Phase

Phase 40 MVP completion is complete after final verification.

Next recommended phase:

- Phase 41 - Cloud Deployment / Portfolio Launch

## Current Feature Summary

- Public landing page
- JWT auth with demo/admin users
- Protected dashboard
- User-specific portfolio, transactions, watchlist, and AI history
- Stock research with market data, chart, SEC fundamentals, news, watchlist, paper buy, and Ask AI actions
- Portfolio refresh, sell flow, and transaction history
- Watchlist refresh and removal flow
- Portfolio-aware Ask AI with evidence, risk drivers, audit data, and timeout fallback
- Reports and governance pages
- Read-only admin dashboard
- Docker Compose local stack
- Environment-based security/deployment configuration

## Test Status

Last verified commands are recorded during the final Phase 40 pass:

- `.\venv\Scripts\python.exe -m compileall app`
- `npx tsc --noEmit`
- `npm run build`
- `npm run test:e2e`
- `npm run test:e2e:headed`
- `npm audit`
- `npm outdated`
- Auth, portfolio, and admin API smoke checks

Dependency review:

- `npm audit` reports 10 vulnerabilities: 5 moderate, 5 high.
- `npm outdated` was reviewed without upgrading packages.
- Audit fixes were deferred because the safe dry run still changes shadcn/transitive packages, and forced fixes affect framework/tooling dependencies.

## Known Limitations

- Paper trading only
- Not financial advice
- yfinance/SEC availability can affect external data
- Ollama may be slow or unavailable; fallback is expected
- localStorage JWT storage is a local MVP approach
- Docker Compose does not include Ollama

## Recommended Next Work

- Deploy backend, frontend, and PostgreSQL to cloud infrastructure
- Add hosted LLM configuration for production
- Add scheduled price refresh jobs
- Capture screenshots under `docs/screenshots/`
- Prepare a portfolio case-study writeup
