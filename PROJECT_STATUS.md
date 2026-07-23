# Project Status

## Phase

Phase 40 MVP completion is complete after final verification.

Phase 41 has started with GitHub portfolio launch polish:

- Phase 41A - Screenshots + GitHub presentation polish

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
- Playwright E2E tests
- Screenshot capture script for GitHub README assets

## Phase 40 Completion

- MVP product loop is complete.
- Auth, portfolio, watchlist, stock research, Ask AI, reports/governance, admin, Docker, and docs are present.
- SEC CIK handling includes AMZN and a dynamic SEC mapping fallback.
- Final verification includes backend compile, frontend typecheck, frontend build, and Playwright E2E tests.

## Phase 41 Launch Checklist

- GitHub README polish: in progress
- Product screenshots: script added; screenshots captured locally after running `npm run screenshots`
- Demo video: not recorded yet
- Resume integration: bullets drafted in `docs/RESUME_BULLETS.md`
- Portfolio website integration: not added yet
- GitHub topics and repo description: pending after push
- Public deployment: pending

## Screenshot Status

Expected screenshot files live under `docs/screenshots/`:

- `landing.png`
- `login.png`
- `dashboard.png`
- `stock-research.png`
- `portfolio.png`
- `watchlist.png`
- `ask-ai.png`
- `admin.png`

Run:

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm run screenshots
```

Screenshots should use only local demo data and should not include real secrets, personal emails, tokens, or production data.

## Test Status

Last verified command set for Phase 41A:

- `.\venv\Scripts\python.exe -m compileall app`
- `npx tsc --noEmit`
- `npm run build`
- `npm run test:e2e`
- `npm run screenshots`

Dependency review from Phase 40:

- `npm audit` reported 10 vulnerabilities: 5 moderate, 5 high.
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

- Record a 2-minute demo video
- Push polished README and screenshots to GitHub
- Add GitHub repo description and topics
- Add the project to a portfolio website
- Add resume bullets from `docs/RESUME_BULLETS.md`
- Deploy backend, frontend, and PostgreSQL to cloud infrastructure
- Add hosted LLM configuration for production
- Add scheduled price refresh jobs
