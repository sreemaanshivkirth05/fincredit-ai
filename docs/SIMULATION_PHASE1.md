# Simulation Lab Phase 1: configuration foundation

Reference plan: [blueprint](FINCREDIT_SIMULATION_BLUEPRINT.md). The supplied pasted Markdown was copied there without modifying its content. The user's Phase 1 scope governs implementation: configured records only; no agents, inference, executable queue, financial simulation, or new UI. The blueprint's future `202` queued-work contract is deliberately not used.

## Implemented contract

- `SIMULATION_ENABLED=false` by default. All three endpoints authenticate with existing JWTs, then enforce the flag server-side. Signed-in requests get 404 when disabled; unsigned requests get 401. Turning the flag off preserves existing records.
- `POST /api/simulations` returns **201 Created** with a UUID, `configured` status, version, creation timestamp, and immutable input snapshot.
- `GET /api/simulations?limit=50&offset=0` returns `runs`, `limit`, `offset`. Limit is 1-100; ordering is newest first with ID as a tie-breaker. Lists omit full snapshots.
- `GET /api/simulations/{uuid}` returns an owned record and its stored snapshot. Other users, including admins, get 404. No update/delete/start/cancel endpoint exists.
- Creation rejects unknown fields, supplied ownership/status/snapshot fields, duplicate agents/tickers, invalid tickers, oversized strings, noninteger numeric configuration and budgets that cannot cover agents times rounds.
- Six agent types are configuration choices only. Defaults: institutional investor, risk manager, quantitative analyst, portfolio manager; five rounds, seed 42, maximum 40 model calls. These settings do not execute anything or promise perfect future reproducibility.
- Hard request limits: 6 agents, 10 rounds, 40 model calls, 20 tickers, 4,000 scenario characters, 120 title characters. Server settings can lower the agent/round/call ceilings. If a lower ceiling conflicts with defaults, send an explicit smaller configuration.
- `SIMULATION_PROVIDER` accepts only `ollama` or `huggingface`. `SIMULATION_MODEL` is an optional identifier; empty uses the configured Ollama model or the current HF adapter's model identifier. These record intended configuration, not successful inference or a verified model version. Credentials and provider endpoint URLs are never included in snapshots.

Example request:

```json
{
  "title": "Rates and technology",
  "scenario": "How might a hypothetical 50-basis-point rate increase affect my technology holdings?",
  "tickers": ["AAPL"],
  "configuration": {
    "agentTypes": ["institutional_investor", "risk_manager", "quantitative_analyst", "portfolio_manager"],
    "rounds": 5,
    "seed": 42,
    "maxModelCalls": 40
  }
}
```

## Storage and input boundary

Two additive tables are introduced: `simulation_runs` (owner FK, title, configured status, version, timestamp) and `simulation_snapshots` (one-to-one run FK, timestamp, JSONB inputs on PostgreSQL, SHA-256). No later-phase tables are created. A database check constraint rejects executable statuses in Phase 1.

The snapshot stores the validated request, intended provider/model, and all holdings belonging to the user at creation. Holdings contain source IDs, ticker/company, shares, prices, sector, currency, and stored update time. Numeric source values are finite decimal strings or null; this preserves the representation of existing float inputs without claiming to recover lost precision. No portfolio analytics, quote fetching, SEC enrichment, or changes to holdings/transactions/reports take place. Portfolio snapshots are capped at 1,000 holdings and 1 MiB; oversized input is rejected rather than silently truncated.

Snapshots remain unchanged after holdings or model configuration change. SQL triggers reject UPDATE and DELETE on the snapshot table, including direct SQL, on PostgreSQL and test SQLite. JSON is hashed as UTF-8 using `json.dumps(inputs, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)`. Hashes support integrity comparison; they are not a signature or protection against a database administrator removing safeguards.

`python -m app.db.simulation_migration` creates only the new tables and immutability safeguards, using idempotent additive preparation consistent with the repository. It never seeds or resets data. Normal Docker demo bootstrap and release preparation also invoke it. No destructive rollback command is provided; turning the feature off is the rollback for Phase 1, preserving saved inputs.

## Local verification without demo reset

The currently running containers are not automatically rebuilt by editing source. Run these commands from the actual repository root in PowerShell. The optional local override uses the existing seed-free release schema preparation instead of demo bootstrap. It recreates only the API service; frontend, PostgreSQL, and committee worker stay running. It adds no services or volumes.

1. Leave the feature disabled and start the updated API:

   ```powershell
   $env:SIMULATION_ENABLED = "false"
   docker compose -f docker-compose.yml -f compose.simulation-local.yml up -d --no-deps --build backend
   docker compose ps
   ```

2. Sign in normally at `http://localhost:3000`. In that tab's browser developer console, define this helper. It reads the current JWT internally and never prints it. Do not share console storage or authorization headers.

   ```javascript
   async function simulationRequest(path = "", method = "GET", body) {
     const response = await fetch("http://localhost:8000/api/simulations" + path, {
       method,
       headers: {
         "Content-Type": "application/json",
         Authorization: "Bearer " + localStorage.getItem("fincredit_access_token")
       },
       ...(body === undefined ? {} : { body: JSON.stringify(body) })
     });
     const data = await response.json();
     if (!response.ok) throw new Error("HTTP " + response.status + ": " + JSON.stringify(data.detail));
     return data;
   }
   await simulationRequest();
   ```

   Expect **HTTP 404: Simulation Lab is disabled** for the signed-in user. An unsigned request returns 401.

3. Enable the feature explicitly and recreate only the API:

   ```powershell
   $env:SIMULATION_ENABLED = "true"
   docker compose -f docker-compose.yml -f compose.simulation-local.yml up -d --no-deps backend
   ```

4. In the same signed-in tab, create a configuration and print only its ID/status:

   ```javascript
   var simulationDraft = await simulationRequest("", "POST", {
     title: "Phase 1 local check",
     scenario: "Challenge a hypothetical interest rate increase using my stored holdings.",
     tickers: ["AAPL"]
   });
   console.log({ id: simulationDraft.id, status: simulationDraft.status });
   var simulationId = simulationDraft.id;
   var originalSnapshot = JSON.stringify(simulationDraft.snapshot);
   ```

   Expect `configured`, never queued/running. Inspect Network for **201**. This only adds your simulation record and snapshot. It makes no model call and creates no committee job or paper trade.

5. Run `await simulationRequest()` and `await simulationRequest("/" + simulationId)`. Expect the new record and frozen inputs. Reload the page, redefine the helper, and retrieve the same ID; it must persist. Keep the ID separately; reloading clears console variables.

6. Send an invalid configuration, e.g. `await simulationRequest("", "POST", {scenario: "Invalid rounds example", configuration: {rounds: 11}})`. Expect 422 and no new record. Sending a `userId`, `status`, or `snapshot` field must also fail.

7. Optionally use the dedicated manual-test account to change one paper holding, then retrieve the saved simulation. Its snapshot/hash must remain unchanged. Do not modify existing personal holdings merely to test immutability; automated tests cover it without your database.

8. Sign in as a different normal user or admin in another browser profile; define the helper there and retrieve the first account's ID. Expect 404. Its list must exclude the first account's run. Never transfer JWTs between profiles.

9. Disable the feature again with step 1 (omit `--build` on repeat). Expect 404 for the saved ID. Re-enable and retrieve it again to confirm disabling did not delete it. Leave disabled when finished. Never run database reset, `down -v`, or demo-reset scripts for these checks.

There is no Simulation Lab page in Phase 1. Existing Settings shows the existing research model, not the separate future simulation configuration. The missing `qwen3:1.7b` Ollama model remains a live-inference blocker only; this foundation does not require or download a model. HF live inference is untested.

## Automated verification

Use the already installed Docker backend environment and mount source read-only. This executes isolated test fixtures, not application bootstrap:

```powershell
docker compose run --rm --no-deps --volume "${PWD}:/workspace:ro" --workdir /workspace/backend backend python -m unittest discover -s tests -v
```

The ordinary suite uses temporary file-backed SQLite for simulation persistence tests and skips the three opt-in PostgreSQL tests. It covers validation, limits, flag defaults/disabled mode, real JWTs, admin/ordinary-user isolation, persistence across sessions/engine reopening, frozen snapshots, hash calculation, SQL update/delete rejection, atomic rollback, no portfolio writes, pagination, and migration repeatability.

The three PostgreSQL tests were also executed against a separate temporary `postgres:16` container with tmpfs storage and a dedicated empty database named `fincredit_simulation_test`. They check JSONB persistence and ownership, trigger/status enforcement, and migration repeatability with existing fixture rows. They never target the running application's database. To rerun, supply `SIMULATION_TEST_DATABASE_URL` to an empty disposable PostgreSQL database with exactly that database name; the tests refuse any other name or any existing tables. Never use the application's DATABASE_URL for these tests.

Baseline before implementation: 37 backend tests passed. Phase 1 checks and existing regressions: 51 passed, three PostgreSQL tests skipped by default; the three PostgreSQL tests passed separately. Python bytecode compilation, parsing, and main application OpenAPI registration passed; default/optional-override Compose validation and Git whitespace checks passed.

At the initial implementation checkpoint, frontend/browser regression suites were not rerun: no frontend source changed, local node_modules was absent, and existing full-stack demo tests may reset database records. The running application database had not yet been migrated or modified. Subsequent verification against the rebuilt local API is recorded in [live verification results](SIMULATION_PHASE1_LIVE_VERIFICATION.md). Browser interaction/visual checks remain pending. Existing dependency deprecation warnings remain unchanged. No simulation model quality/execution tests apply until later phases.
