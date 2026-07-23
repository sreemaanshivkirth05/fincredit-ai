# Frontend E2E Testing

FinCredit AI uses Playwright for browser-level smoke and workflow tests.

## Prerequisites

1. Backend running on `http://127.0.0.1:8000`
2. Frontend available on `http://localhost:3000`

Start the backend:

```powershell
cd C:\Users\shivk\fincredit-ai\backend
python -m uvicorn app.main:app --reload
```

## Install

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm install
npx playwright install chromium
```

## Run Tests

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm run test:e2e
```

Run headed:

```powershell
npm run test:e2e:headed
```

Run the Playwright UI:

```powershell
npm run test:e2e:ui
```

Open the HTML report:

```powershell
npm run test:e2e:report
```

## Notes

- The Playwright config starts the frontend with `npm run dev` when needed and reuses an existing `localhost:3000` server when one is already running.
- The backend is not started by Playwright. Start it separately before running E2E tests.
- The Ask AI test can take 20-30 seconds because the local Ollama call has a 20 second timeout before deterministic fallback returns.

## Demo Reset Test

The demo reset endpoint restores a recruiter-friendly local dataset for the paper portfolio, transaction history, and watchlist only.

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/demo/reset" `
  -Method POST | ConvertTo-Json -Depth 8
```

Dashboard reset button check:

1. Open `http://localhost:3000/dashboard`.
2. Confirm the `Reset Demo Data` button is visible.
3. Click it only when you want to reset portfolio, transactions, and watchlist demo data.
4. Confirm the browser prompt.
5. Open `/portfolio` and `/watchlist` to verify seeded demo data.

## Manual Demo Checklist

1. Start backend on `http://127.0.0.1:8000`.
2. Start frontend on `http://localhost:3000`.
3. Open `http://localhost:3000/`.
4. Confirm the landing page hero, feature grid, how-it-works section, tech stack, and disclaimer are visible.
5. Click `Try Demo` and confirm it opens `/dashboard`.
6. Return to `/` and click `Research AAPL`.
7. Return to `/` and click `Ask FinCredit AI`.
8. Reset demo data from `/dashboard`.
9. Review price chart, SEC fundamentals, recent news, actions, and page guidance on `/stock/AAPL`.
10. Add AAPL to the watchlist or simulate a portfolio buy.
11. Open `/portfolio`, refresh prices, and open the sell form.
12. Confirm transaction history shows BUY/SELL rows.
13. Open `/watchlist` and refresh prices.
14. Open `/ask`, submit an AAPL or portfolio-risk question, and verify answer, evidence, and governance audit sections.

## Landing Page E2E

The landing page test verifies `/` is a public marketing page and that its CTAs link into the internal app flows.

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm run test:e2e -- landing.spec.ts
```
