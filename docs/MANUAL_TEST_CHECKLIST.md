# Local application acceptance checklist

Session: 2026-10-27. Branch: `feat/editorial-ui-redesign`.

Unchecked items are pending, not passed. Record PASS, FAIL, or BLOCKED and a short observation against each ID. Work through one section at a time.

## Session rules and baseline

- Use `http://localhost:3000` consistently; API is `http://localhost:8000`.
- Preserve existing database records. Do not use **Reset demo data**, delete existing positions, run demo reset scripts, or remove Docker volumes. Existing demo scripts recommend resets; skip those steps here.
- Use fresh accounts A and B for paper trades and isolation tests. Choose passwords privately. Never paste passwords, tokens, full environment files, authorization headers, or unredacted network exports into chat.
- Do not run the full existing E2E/demo/screenshot suite against this database: some paths reset demo data. Some tests also assume the old login prefill behavior or mock APIs.
- Four services were running at inspection: frontend, backend, committee-worker, postgres; postgres was healthy. This is infrastructure readiness, not an application test pass.
- Read-only live provider probe: configured Ollama `qwen3:1.7b` failed generation; Ollama version/tags endpoints responded, but that model was absent. HF was not selected or tested. Model success remains BLOCKED until configuration/model availability is resolved.
- Local source and running container images can differ. If a bug fix changes application code, rebuild only affected services without resetting data; verify the resulting behavior again.

## 1. Login and dashboard — start here

- [ ] L1: Open a private browser window and navigate directly to `/dashboard`. Expect `/login?next=%2Fdashboard` and no personal dashboard records.
- [ ] L2: On `/login`, confirm Email and Password start empty, password is masked, and ivory/green styling is readable. Submit empty fields; browser validation should prevent login.
- [ ] L3: Enter `manual-invalid@example.test` and a privately chosen incorrect password, then click **Login**. Expect an error, no dashboard access, and an enabled button for retry.
- [ ] L4: Click **Use demo credentials**, then **Login**. The first button only fills the form. Expect `/dashboard` after Login, with no endless session/loading indicator.
- [ ] D1: Expect **A clearer view**, **At a glance**, **Your research notebook**, and **Latest reports**. Loading placeholders should settle into records, explicit empty states, or a visible error.
- [ ] D2: Note **Your portfolio positions** and compare with the number of positions on `/portfolio`; return to Overview. Committee count represents up to the latest 50 personal reviews; reports are a shared library. Empty records must not show invented content.
- [ ] D3: Click **Refresh**, then reload the browser. Expect the same saved records and a valid signed-in session. Any error should identify the failed overview or saved-review load.
- [ ] D4: Open **Start a committee review**, then return to Overview. Open each shortcut: **Research a company** -> `/stock/AAPL`, **Inspect your portfolio** -> `/portfolio`, **Ask a focused question** -> `/ask`. Return after each; do not submit research/trades yet.
- [ ] D5: If notebook entries exist, open one; expect `/committee?run=...` with that saved question. If reports exist, open one; expect its detail page. Otherwise verify the explanatory empty states.
- [ ] L5: Click the top-bar **Sign out** icon. Expect `/login`. Revisit `/dashboard` and use Back/reload; personal records must remain inaccessible after the guard settles.

## 2. Registration and account profile

- [ ] R1: Open `/register`. Fill Full name, Email, Password, Confirm password for fresh account A. First use mismatched passwords; expect **Passwords do not match** and no account creation.
- [ ] R2: Correct confirmation and submit. Expect automatic sign-in and `/dashboard`. Open `/profile`; verify your chosen name/email and normal user role. Do not send the password to anyone.
- [ ] R3: Sign out and attempt registration with the same email. Expect a visible error and no duplicate account. Log back into account A successfully.
- [ ] R4: Check the new account's portfolio, watchlist, Ask history, and committee history. Expect no other user's personal records. Shared report records may appear.

## 3. Stock search and research

- [ ] S1: Enter `aapl` in top-bar **Search stock ticker** and submit. Expect `/stock/AAPL`. Blank/invalid ticker input should not navigate and should show validation.
- [ ] S2: Inspect quote, currency, chart, period controls, SEC fundamentals, news, and intelligence sections. Check ticker/company consistency and source timestamps. Missing upstream data should have explicit section-level messages, not fabricated zero metrics.
- [ ] S3: Exercise stock-page search suggestions if present with a company name and ticker; choose a result. Try an unknown ticker and an ETF such as SPY; expect graceful unavailable/limited SEC data and usable navigation.
- [ ] S4: Open the company view `/company/AAPL`. Check loading, available company data, and links back into research. No blank/crashed page.
- [ ] S5: Exercise stock-page watchlist, paper-buy, and Ask handoffs using account A during the relevant sections below. Expect the intended ticker to carry through.

## 4. Portfolio and paper transactions

- [ ] P1: On account A, open `/portfolio`; inspect empty state. Use the add/buy flow (or stock-page portfolio action) to record 2 AAPL shares at a paper price of 100 USD. Expect 2 shares, average cost 100, total cost 200, and one BUY transaction. Current market value may differ from cost.
- [ ] P2: Buy 1 more AAPL share at 130. Expect 3 shares, cost 330, average cost 110, and an additional BUY row. Reload to verify persistence.
- [ ] P3: Sell 1 AAPL share at 120 through the sell flow. Expect 2 shares remaining, cost basis 220 and realized gain 10 for that sale, subject to displayed rounding; a SELL row must appear.
- [ ] P4: Attempt zero/negative quantities and a sell greater than remaining shares. Expect rejection and unchanged holdings/transaction counts. Cancel an open trade form; expect no write.
- [ ] P5: Refresh prices. Expect a quote update or explicit upstream failure, no duplicate trade. Cross-check shares x stored price against value and value minus cost against unrealized P/L. Mixed-currency summary totals are a known limitation; use Scenario Lab currency groups for valid comparisons.
- [ ] P6: Only on a disposable test holding, inspect removal behavior and cancel before confirming. Do not remove pre-existing user data. Confirm transactions remain visible after navigation/reload.

## 5. Watchlist

- [ ] W1: Add AAPL through stock research under account A. Open `/watchlist`; expect one matching entry and persistence after reload.
- [ ] W2: Attempt to add AAPL again. Expect prevention or an explicit duplicate response, never duplicate rows.
- [ ] W3: Refresh prices, open research from the row, and check ticker consistency. Missing market data should show a clear state.
- [ ] W4: Remove only the entry created in W1. Expect it gone after reload and no portfolio/transaction deletion. Re-add it for isolation testing.

## 6. Portfolio Scenario Lab

- [ ] Q1: On `/portfolio`, find **Portfolio scenario lab**. Set **Market shock (%)** to -10, no sector override, and click **Run scenario**. For each currency group expect scenario value = stored value x 0.90 and change = stored value x -0.10, within rounding.
- [ ] Q2: Choose an existing **Sector override** and set **Sector shock (%)** to -20. Expect that sector to use -20 instead of -10; other sectors retain -10. Check position impacts, largest position, top-three exposure, and effective holdings.
- [ ] Q3: Change an input after a run. Expect prior results to disappear until rerun. Try -101/101; expect validation and no changed holdings or transactions. Try -100; affected positions should reach zero.
- [ ] Q4: Check empty account B later: explicit empty state, no invented exposures. If test holdings cover multiple currencies, expect separate groups and no FX total. Missing prices should produce warnings/fallback assumptions.
- [ ] Q5: Confirm scenarios do not create paper transactions. Custom inputs are not saved or passed to Ask; Ask uses its default -10% scenario.

## 7. Ask FinCredit

- [ ] A1: On account A, ask: `What is my AAPL exposure and what would a 10 percent market decline do to my simulated holdings? Use evidence and explain missing data.` Expect progress, then an answer or actionable error without endless loading.
- [ ] A2: Inspect evidence, holdings/transaction context, risk drivers, scenario values, and audit **Status**. Compare calculated values with Scenario Lab's default scenario.
- [ ] A3: Record provenance explicitly: `Generated with ollama: ...` or `Generated with huggingface: ...` means a model response was retained. `Fallback...` or `Deterministic fallback after percentage review flags` means the displayed answer is deterministic, even if a model was attempted. HTTP success alone does not prove inference worked.
- [ ] A4: Check question/ticker handoff from stock research, history if exposed, and persistence after reload. Heuristic grounding/unsupported-claim scores are not factual verification.
- [ ] A5: With the currently missing model, expect a labelled deterministic fallback. After model availability is resolved, repeat and record actual provider/model and audit status; do not call fallback a model success.

## 8. Investment Committee

- [ ] C1: Open `/committee` as A. Enter `Challenge my AAPL investment thesis using my portfolio concentration and saved evidence.` and ticker AAPL; click **Convene committee**. Expect saved queued/running status and polling, with no portfolio mutations.
- [ ] C2: While active, try another submission from a second tab in the same account. Expect only one accepted active run; conflicting requests should receive a visible error (API 409).
- [ ] C3: Wait for terminal status. Inspect **Brief**, **Debate**, **Evidence**, **Scenarios**, **Timeline**. Timeline should show bounded sequential responsibilities; source gaps must be stated. Current missing-model setup should produce **partial**, not fabricated viewpoints.
- [ ] C4: Toggle **Guided view** / **Advanced view**. In Debate inspect each perspective's actual provider/model/status and notices. Only perspectives marked `generated` are model-generated; unavailable perspectives are not. Scenarios, evidence collection, and assembled brief are deterministic.
- [ ] C5: Click an evidence citation when present; expect Evidence tab and matching saved ID. Inspect raw snapshot in Advanced view, capture/source timestamps, missing data, and audit limitations. Citation/percentage checks do not verify semantic truth.
- [ ] C6: Navigate away, reopen from **Saved research**, and reload the `?run=` link. Expect the same ID, saved evidence/results and timestamps; completed records must not trigger regeneration.
- [ ] C7: Click **Export**. Expect `fincredit-research-<id>.json`; open locally and compare ID, question, status, version, snapshot, events, and results with the selected run. No credentials or tokens should appear. Treat exported portfolio data as private.
- [ ] C8: Start another run and immediately click **Stop** while queued/running. Expect **cancelled**, persistence after reload, and no later completed result replacing cancellation. An already completed run can legitimately win the race; retry with a fresh run if so.
- [ ] C9: For reliable queued cancellation, coordinate a brief worker stop only when no unrelated review is active; restart it afterward. Do not interrupt other users' jobs merely to force a test. Verify a later new run can proceed.
- [ ] C10: Model success path remains pending until actual generation works. Re-run C1-C7 after resolving it. HF success/timeout/quota checks are conditional on a configured free Space; do not purchase hardware or expose keys to perform them.

## 9. Settings and model connection

- [ ] M1: Open `/settings`, click **Refresh**. Expect configured provider/model, credential-presence boolean, fallback setting, workflow and execution boundary; no credential values. This page explicitly is not a health check.
- [ ] M2: Compare a fresh Ask audit and Committee perspective provenance with Settings. Provider routing fallback (HF -> Ollama) is still model-generated if Ollama responds; deterministic answer fallback is not.
- [ ] M3: Operator live probe must run through the backend's actual provider adapter and record success/failure, actual provider/model and duration without response bodies or secrets. A reachable Ollama server or installed-model list alone is insufficient.
- [ ] M4: If configuration changes are needed, review the exact change first, recreate only backend/worker as needed, preserve the database volume, and repeat live generation plus Ask/Committee. Do not configure paid providers.

## 10. Admin and user isolation

- [ ] I1: As normal user A, navigate directly to `/admin`. Expect **Access denied** and no admin data. Unauthenticated admin API requests must be rejected; authenticated normal-user requests must return 403.
- [ ] I2: Register account B in a separate browser/profile. Expect no A holdings, transactions, watchlist, Ask history, dashboard personal counts or committee history. Visit A's `/committee?run=<id>`: no packet; authenticated underlying run API must return 404.
- [ ] I3: Add a different paper holding/watchlist item for B. Refresh A; its records must be unchanged. Inspect B's empty/own Scenario Lab and Ask context for leakage.
- [ ] I4: Sign in with an existing local admin privately. Expect read-only overview, user summaries and user details. Current code intentionally allows admin inspection of users' holdings, transactions, watchlist and Ask records; this is distinct from ordinary-user isolation. Password hashes/tokens/secrets must never appear.
- [ ] I5: Admin's personal portfolio and committee views must remain admin-account scoped. Admin must not retrieve A's committee packet through the ordinary committee endpoint. Shared legacy Reports/Governance data is expected, not private per-user storage.

## 11. Remaining routes: reports, governance, profile

- [ ] E1: Open `/reports`, available report detail links, and `/governance`. Expect matching stored/shared records or clear empty/error states; no broken navigation. Exercise any review action only on designated disposable test records after inspecting its effect.
- [ ] E2: Check `/profile` against current account and its logout action. `/settings` is canonical; inspect legacy `/setings` behavior without treating it as the primary route.
- [ ] E3: Open `/` signed out; inspect landing CTAs and links to login/register. Unavailable report IDs or ticker pages must fail clearly rather than show another unrelated record.

## 12. Mobile, keyboard and navigation

- [ ] U1: At 390 x 844 and 320px width, revisit login, registration, dashboard, stock, portfolio/scenarios, watchlist, Ask, Committee tabs/history, settings, profile, reports, governance and admin access state. Expect readable ivory/green surfaces, reachable controls, no clipped text or page-wide overflow. Wide tables may scroll within their panels.
- [ ] U2: Click **Open navigation**. Expect all applicable routes, selected route indicator, and close after navigation. Reopen and test Escape, close button and backdrop. Desktop sidebar should return at wide width.
- [ ] U3: Use keyboard Tab/Shift+Tab/Enter through forms, search, navigation and dialogs. Check visible focus, labels, **Skip to content**, cancellation and error announcements. Long questions/evidence should wrap without hiding controls.
- [ ] U4: Check browser Back/Forward, deep links, reload while signed in, logout, and denied routes. Loading/errors should recover without exposing stale data from a previous account.

## Bug reporting and retest

Report: test ID, route, browser/viewport, account label (A/B/demo/admin), exact actions, expected vs actual, time and timezone, and visible error text with secrets removed. Do not paste tokens, password fields, environment files, or raw HAR files.

For each reported bug: inspect relevant source and narrowly scoped sanitized service logs; explain cause and proposed local fix before editing; preserve existing changes and database records; run focused checks; rebuild only affected Docker services if needed; repeat the failing test and adjacent flow. No commits, pushes, merges or deployment.
