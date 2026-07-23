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
