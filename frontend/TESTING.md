# Frontend E2E Testing

FinCredit AI uses Playwright for browser-level smoke and workflow tests.

## Prerequisites

1. Backend running on `http://127.0.0.1:8000`
2. Frontend available on `http://localhost:3000`
3. Phase 40L auth migration has been run

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

## Auth Migration

```powershell
cd C:\Users\shivk\fincredit-ai\backend
.\venv\Scripts\python.exe -m app.db.phase_40l_auth_migration
```

Demo credentials:

- `demo@fincredit.ai` / `DemoPass123!`
- `admin@fincredit.ai` / `AdminPass123!`

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
$body = @{
  email = "demo@fincredit.ai"
  password = "DemoPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$token = $response.accessToken

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/demo/reset" `
  -Headers @{ Authorization = "Bearer $token" } `
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
6. Login with `demo@fincredit.ai` / `DemoPass123!`.
7. Open `/profile` and verify the demo user email and role.
8. Return to `/` and click `Research AAPL`.
9. Return to `/` and click `Ask FinCredit AI`.
10. Reset demo data from `/dashboard`.
11. Review price chart, SEC fundamentals, recent news, actions, and page guidance on `/stock/AAPL`.
12. Add AAPL to the watchlist or simulate a portfolio buy.
13. Open `/portfolio`, refresh prices, and open the sell form.
14. Confirm transaction history shows BUY/SELL rows.
15. Open `/watchlist` and refresh prices.
16. Open `/ask`, submit an AAPL or portfolio-risk question, and verify answer, evidence, and governance audit sections.
17. Logout from the top bar or profile page and confirm protected pages redirect to `/login`.

## Auth E2E

The auth test verifies `/login`, demo login, `/profile`, and logout.

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm run test:e2e -- auth.spec.ts
```

## Admin API Checks

Admin login:

```powershell
$body = @{
  email = "admin@fincredit.ai"
  password = "AdminPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$token = $response.accessToken
$response | ConvertTo-Json -Depth 8
```

Admin overview:

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/admin/overview" `
  -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 8
```

Admin users:

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/admin/users" `
  -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 8
```

Non-admin forbidden check:

```powershell
$demoBody = @{
  email = "demo@fincredit.ai"
  password = "DemoPass123!"
} | ConvertTo-Json

$demoResponse = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $demoBody

$demoToken = $demoResponse.accessToken

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/admin/overview" `
  -Headers @{ Authorization = "Bearer $demoToken" } | ConvertTo-Json -Depth 8
```

Expected for non-admin: `403 Forbidden`.

## Admin E2E

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm run test:e2e -- admin.spec.ts
```

## Landing Page E2E

The landing page test verifies `/` is a public marketing page and that its CTAs link into the internal app flows.

```powershell
cd C:\Users\shivk\fincredit-ai\frontend
npm run test:e2e -- landing.spec.ts
```
