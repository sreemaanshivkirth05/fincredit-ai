# Research agents and Workbench

Ask AI now adds three LangGraph stages after evidence collection: a rule-based Research Planner, a quantitative Stress-Test Agent, and a Skeptical Reviewer. The answer stage passes their findings to the existing Ollama model, checks explicit percentages, and saves a Research Workbench with the answer. The percentage reviewer is a deterministic check inside the answer stage, not a separate model call.

Try:
- Stress-test my portfolio during a severe market decline.
- Challenge my investment thesis for AAPL.
- Where is my portfolio too concentrated?

## What is calculated

The planner identifies question intent and lists required source checks. Evidence availability is the fraction of these checks with available context present. Market and SEC values are stored; the existing news stage may retrieve headlines during the request. It is not an accuracy, completeness, or freshness score. The planner does not autonomously fetch missing sources.

Scenarios apply -10% and -25% market shocks, plus a -30% override for the dominant sector in each currency group. If different currencies have different dominant sectors, all those sectors are shocked. Sector overrides replace the market shock. Currency groups remain separate; no FX conversion or probabilistic risk model is implied. Missing current prices and omitted positions produce warnings.

The skeptical reviewer flags missing evidence, a largest holding over an illustrative 25% threshold, a single-sector portfolio, stale-data uncertainty, and unreconciled SEC periods. These are evidence checks, not an independent analyst's model-generated thesis.

The answer reviewer checks explicit percentage literals against supplied percentage values. An unmatched percentage in a model draft triggers the existing deterministic answer. It does not verify semantic attribution, dollar amounts, prose, source truth, or forecasts. Matching a number does not prove a claim. Flags describe the reviewed draft; the calculated Workbench is appended afterward.

## Persistence and compatibility

`researchDetails` is returned by POST `/api/ask` and saved in nullable `agent_runs.research_details`. The existing authenticated run-history endpoints return it; older rows return null. Research Workbench summaries are appended to answers, so generated reports retain the findings. Existing API field names `groundingScore` and `unsupportedClaims` remain for compatibility; for new research runs they mean evidence availability and unmatched percentage flags. Ask AI displays these accurate labels.

Docker startup applies the additive, repeatable PostgreSQL migration automatically. For a native installation, run from `backend` before starting the updated API:

```bash
python -m app.db.phase_43_research_migration
```

## Run the upgrade

This branch includes the earlier portfolio scenario and Docker bootstrap upgrades. From the existing repository directory with this branch checked out:

```bash
git fetch origin
git switch feat/research-agent-workbench
docker compose up -d --build
```

Open http://localhost:3000/ask. Keep the same Compose project/directory to reuse your existing database volume. Do not remove database volumes to update the app. If you downloaded a ZIP instead of cloning with Git, download this branch and replace the project source files in your existing project directory before rebuilding.

Ollama is optional and is not supplied by the default Compose setup. Without a reachable model, the calculated agents and Workbench still run and the answer uses the existing fallback.

## Validation

Backend unit and authenticated API tests cover source gaps, currency separation, missing prices, percentage checks, fallback behavior, persistence, old rows, and user isolation. The frontend has a mocked Playwright test for Workbench rendering, alongside TypeScript and production-build checks. No live market service or model is required for these tests.
