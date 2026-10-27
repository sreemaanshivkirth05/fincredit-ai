# Phase 1 rebuilt local API verification

Verified 2026-10-27 against `http://localhost:8000` on `feat/fincredit-simulation-lab`. Running simulation source hashes matched workspace files. All checks below used the rebuilt running API and its PostgreSQL database, with two newly registered isolated test accounts. Existing users' portfolios were not exercised or modified.

## Automated live checks

| Check | Observed result |
| --- | --- |
| Registration/login | Both fresh accounts registered and logged in successfully; credentials stayed in memory and were not recorded |
| Authentication | Unsigned simulation list rejected with 401 |
| Configured creation | POST returned 201 and `configured`; snapshot contained only account A's holding; creating it added no Committee job |
| Retrieval/listing | GET by UUID matched the created record; list contained it |
| Ownership | Account B's list was empty; fetching account A's UUID returned 404 |
| Validation | Client-supplied queued status and excessive rounds returned 422 |
| Snapshot immutability | PATCH returned 405; direct SQL UPDATE was rejected by the immutability trigger inside an explicitly rolled-back transaction |
| Snapshot independence | A second paper purchase changed only the test portfolio from 2 to 3 shares; saved simulation inputs/hash stayed identical |
| Backend restart | The same record and snapshot survived `docker compose restart backend`; list still contained it |
| Disabled mode | Signed-in create/list/retrieve all returned 404 after backend recreation with the flag false |
| Re-enable | Re-enabling restored access to the same unchanged run |
| Existing APIs while disabled | Current user, dashboard, portfolio, Ask history and Committee history all returned successful responses |
| Existing data | Internal per-row hashes compared all 30 pre-existing rows across the database; zero rows changed or disappeared |

Final state: **Simulation Lab disabled** as requested by the Phase 1 verification guide. Backend alone was restarted/recreated. Frontend, committee-worker, PostgreSQL, and their volumes remained running. No resets, deletions, model downloads, deployment or Git publication occurred.

Two new verification accounts and their test records were deliberately retained. Account A has one AAPL paper position (3 shares, two test BUY transactions), one simulation configuration, one Ask record and one Committee review. Account B is the empty isolation control. Passwords were random, transient, and discarded; no tokens or passwords appear in this report or its JSON data. Use your own existing account for browser checks.

Machine-readable check results and test record identifiers: [live results JSON](SIMULATION_PHASE1_LIVE_RESULTS.json).

## Existing workflow checks and inference limits

| Workflow | Automated result | Interpretation |
| --- | --- | --- |
| Login/logout | Registration, login, current-user and logout endpoints succeeded | Browser token removal/redirects still need manual verification; logout endpoint success alone does not prove browser session clearing |
| Dashboard | Loaded the test account and correctly reported one portfolio position | API regression passed |
| Portfolio | Recorded a 2-share paper buy, then another share; portfolio and transaction endpoints persisted the test data; other account remained empty | API paper-buy/read/isolation regression passed; sell/dialog UI not covered by this run |
| Ask AI | Returned a nonempty answer, saved it and retrieved its history record | **Deterministic fallback**, not model-generated |
| Committee | Existing worker processed a new review, saved evidence/events, listed/reopened it, and denied the other account access | **Partial** packet; 0 generated perspectives, 2 unavailable perspectives |

Ollama's tags endpoint responds, but configured `qwen3:1.7b` is still absent. This explains the live-inference blocker. Hugging Face is not selected and was not tested. No model was downloaded. Successful fallback/partial paths do not constitute successful live inference, and this does not block Phase 1 configuration persistence.

Frontend `/login`, `/dashboard`, `/portfolio`, `/ask`, and `/committee` each returned HTTP 200. These are automated HTTP availability checks, not proof of client-side rendering, interaction, accessibility or layout.

## Browser checks still needed

Use your normal account or the manually created test account from the acceptance checklist. Avoid **Reset demo data** and leave existing holdings unchanged.

1. Open `http://localhost:3000/login`, sign in, and confirm redirection to Dashboard. Refresh the page: the session should persist and saved counts should settle without an endless loading indicator.
2. Open Portfolio. Check that your existing holdings and transaction history render. Open a trade form and cancel it; no new transaction should appear. Paper-buy API behavior was already exercised with isolated records above.
3. Open Ask FinCredit and submit a question if desired. Expect a visible answer and evidence/audit details. With the currently missing model, audit Status should explicitly identify fallback; do not interpret it as generated inference.
4. Open Investment Committee. Create a review only if you want another personal test record, then inspect Brief, Debate, Evidence, Scenarios and Timeline. Expect a saved **partial** packet and unavailable model interpretations until a model is configured. Reload and reopen the same run. Existing worker execution was verified automatically above.
5. Sign out and revisit `/dashboard`; expect Login with no accessible protected content. This checks browser session handling beyond the API logout response.
6. At roughly 390px width, check navigation open/close, route changes, form readability, long text and table scrolling. Desktop/mobile visual behavior has not been verified by this automated session.

There is no Simulation Lab page in Phase 1. If you also want to repeat its API checks from a signed-in browser, follow [the Phase 1 guide](SIMULATION_PHASE1.md); it includes explicit enable/disable commands and a helper that does not print the token.

## Repeating the automated verification

The opt-in local helper adds fresh test accounts/records, briefly restarts only the backend, and leaves simulations disabled. It never deletes records or prints credentials:

```powershell
python scripts/verify_simulation_phase1.py --allow-api-restarts
```

Run only against the local rebuilt development API when no Committee job is active and other users are not concurrently editing records. A source-hash mismatch fails verification instead of claiming tests against stale code. The pre-existing-row comparison detects concurrent modifications too; coordinate this check with other local activity. Each repeat adds another isolated fixture set and replaces the JSON report with the latest results.

No application implementation changed during this verification. Phase 2 remains unstarted. The previous isolated backend/unit and PostgreSQL suites were not rerun because this session added only the live verification helper and documentation; the new helper itself completed successfully against the running API.
