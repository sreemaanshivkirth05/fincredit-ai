# Portfolio scenario intelligence

This upgrade adds a read-only scenario lab to `/portfolio` and a deterministic portfolio analytics node to the existing LangGraph research workflow. It also fixes a transaction isolation defect in the portfolio summary and validates buy/sell quantities before database writes.

## Demo

1. Sign in and add two paper holdings from different sectors.
2. Open Portfolio and find **Portfolio scenario lab**.
3. Leave the market shock at `-10`, choose a sector, and set its override to `-20`.
4. Run the scenario. Review position impacts, largest position, top-three exposure, and effective holdings.
5. Change an input: prior results disappear so they cannot be mistaken for the new scenario.
6. Ask AI about portfolio concentration. The workflow receives the full calculated analytics, including a default -10% scenario. If the model fails, the deterministic answer includes the same metrics.

Custom scenarios are not persisted or forwarded to Ask AI; Ask AI uses the documented default scenario. No database migration or additional market provider is required.

## API

Both endpoints require the existing bearer-token authentication and filter holdings by the authenticated user:

- `GET /api/portfolio/analytics`: concentration and default -10% scenario.
- `POST /api/portfolio/scenario`: user-supplied market and sector shocks.

Example request:

```json
{
  "marketShockPercent": -10,
  "sectorShocks": { "Technology": -20 }
}
```

Percentages must be finite and between -100 and 100 inclusive. Sector names match stored holdings exactly. A sector override replaces the market shock for matching holdings. Unknown sector names produce warnings. Results are grouped by currency; no FX conversion or cross-currency total is produced by these endpoints.

## Calculation method

For each holding, value is shares × stored price. Missing or non-finite current prices fall back to average cost with a warning. Invalid shares, negative prices, or unavailable fallback prices exclude a holding with a warning.

For each currency group:

- Weight = holding value / group total value.
- Concentration index = sum of squared weights, ranging from near zero to one.
- Effective holdings = 1 / concentration index; a single holding is one and N equal-weight holdings are N.
- Scenario position value = holding value × (1 + applicable shock / 100).
- Scenario group value = sum of unrounded scenario position values.

Totals are calculated before rounding display amounts. Allocation concentration is not a volatility estimate, a return forecast, or a risk model. A linear shock omits cash, fees, dividends, correlations, liquidity effects, and rebalancing. Stored prices can be stale or manually supplied paper-trade prices. The analytics endpoints do not refresh quotes or write holdings/transactions.

## AI integration

The new **Portfolio Analytics Agent** runs after the Evidence Agent and before the LLM Answer Agent. It uses the complete user portfolio rather than the six-item prompt preview, adds a calculated evidence summary per currency, and supplies the full metrics and assumptions directly to the model. The model is instructed to use calculated numbers rather than perform arithmetic. Deterministic fallback retains the metrics.

The existing `groundingScore` and `unsupportedClaims` fields remain legacy heuristics; they are not measured hallucination metrics. Calculated evidence confidence describes computation over stored inputs, not independent verification of market data. This upgrade does not establish production readiness or financial-model validation.

## Validation

Run from `backend`:

```bash
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
python -m compileall -q app
```

Backend tests cover concentration, scenario overrides, rounding, empty portfolios, total-loss shocks, currency separation, invalid inputs, actual JWT authentication, two-user isolation, read-only execution, model input, and model-failure fallback. API tests use isolated SQLite storage; PostgreSQL deployment behavior and live-provider behavior require separate integration checks.

Run from `frontend`:

```bash
npm ci
npx tsc --noEmit
npm run build
npx eslint components/portfolio-scenario.tsx lib/api.ts tests/e2e/portfolio-scenario.spec.ts
npx playwright install chromium
npx playwright test tests/e2e/portfolio-scenario.spec.ts
```

The new browser tests mock API responses to test request payloads, rendered impacts, stale-result clearing, input validation, and API errors without requiring credentials, PostgreSQL, live market data, or Ollama. They do not substitute for full-stack E2E tests. GitHub Actions runs backend tests, TypeScript checks, and these UI tests.

## Portfolio / interview description

Implemented a deterministic portfolio analytics layer in a Next.js/FastAPI paper-trading platform, with concentration metrics, currency-separated scenario analysis, and position-level shock attribution. Integrated calculated metrics into a LangGraph research workflow and deterministic fallback, and added authenticated API regression tests that caught and prevent cross-user transaction exposure.

## Remaining work

The repository still needs a dedicated production-hardening pass: secure session storage and rotation, measured AI evaluations, live-data freshness/provenance, concurrency-safe trade writes, and PostgreSQL integration testing. The existing summary cards also aggregate holdings without FX conversion; use the scenario lab's currency groups for comparisons involving multiple currencies.
