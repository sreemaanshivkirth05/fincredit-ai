# FinCredit AI 0.2 — Committee research release

## Delivered

- `/committee`: a responsive research workstation with saved reviews, bounded bull/bear debate, evidence IDs, deterministic scenario tables, export and recorded execution events.
- Eight explicit responsibilities: Supervisor, Fundamental Analyst, Quant Analyst, Portfolio Risk Officer, Bull Analyst, Bear Analyst, Evidence Auditor, Synthesizer. Six are deterministic services; two request interpretations from the configured model. They are not eight independent models.
- One bounded debate round. The bear can challenge the bull’s response; no recursive loops, tool execution or automatic portfolio mutations.
- Persistent PostgreSQL snapshots and workflow version. Completed runs are immutable through the API. Export includes the original source material, outputs and timestamps.
- A separate worker processes the durable queue. PostgreSQL skip-locked claims avoid double execution across workers; a partial unique index permits one queued/running review per user. Cancellation prevents publication after a stop request. Stale running jobs fail after 15 minutes when the worker next checks the queue; they are never silently replayed.
- Guided/advanced views share the same data. Advanced exposes the original snapshot and model provenance. Guided keeps the evidence, audit limitations and risk assumptions visible.
- Real configuration settings replace placeholder OpenAI billing and connection claims. Only Ollama and the existing Hugging Face Space adapter are supported.
- Dashboard now requests stored data. Holdings and AI history are scoped to the current user; legacy company reports remain a shared workspace library. Portfolio valuation by currency remains on Portfolio.
- Compact navigation, complete mobile navigation, functioning ticker search, repaired Settings route, and links into existing portfolio/research components.
- Separate HTTPS deployment composition, non-root application containers, database readiness, private database port, production secret validation and disabled production demo reset.

## Deliberate limits

This is a release candidate, not a live production certification. Full acceptance testing is deferred at the owner's request.

Committee research uses stored market/SEC/portfolio records. It does not refresh news or quotes. Capture time is not the source timestamp; review `fetchedAt`, filing dates and fact periods. Individual financial reporting periods are not reconciled. Evidence citations check identifier existence and percentage literals only, not semantic correctness, dollar amounts or source truth. Two viewpoints from one model can share errors. Missing model output produces an explicitly partial packet.

Research memory is saved versioned packets and history, not semantic vector retrieval or autonomous long-term learning. Timeline records operational summaries, not private model reasoning. No broker integration or real trading is included.

The wider roadmap remains future work: portfolio digital twin, Monte Carlo, market-event intelligence, earnings specialist, scheduler, quant lab, strategy evaluation, accuracy tracking, portfolio coach, knowledge graph, natural-language dashboards, agent tournaments and personal finance. No placeholder screens claim those features are operational.

## Checks performed for this release

- `npm run build`: Next.js compilation, TypeScript validation and static generation passed.
- Python bytecode compilation passed.
- Backend imports and OpenAPI generation succeeded, including committee endpoints.
- PostgreSQL DDL compilation confirms the queue table and active-user partial unique index.
- Production settings reject default development credentials.
- Full database migrations, Docker image builds, browser acceptance, cancellation concurrency, live model availability and HF quota behavior still require the acceptance session. Docker/PostgreSQL executables were unavailable in the implementation environment.

## Tomorrow's acceptance session

1. Back up the development database, then start `docker compose up -d --build`. Confirm postgres, backend, frontend and committee-worker are running. Open `http://localhost:3000`.
2. Sign in and verify the dashboard loads saved records. Create a second account and confirm holdings, Ask history and committee runs remain separate. Direct access to another user's committee ID must return 404; unauthenticated requests must fail.
3. Add holdings in two currencies. Research concentration and compare all three scenario rows with Portfolio calculations. Verify missing prices and empty portfolios show limitations instead of invented values.
4. Select Ollama in the root environment. Start a committee run; confirm sequential events, two perspectives, evidence navigation, advanced snapshot, export, reload/deep-link recovery, and saved research.
5. Submit twice concurrently: only one active run per user must be accepted. Stop queued and running jobs; completed packets must not be overwritten. Restart the worker during a run and confirm stale-job failure/recovery rather than duplicate inference.
6. Disable the model endpoint. Expect a partial result with available evidence/scenarios and an explicit model-unavailable notice. Re-enable it and create a new run.
7. Configure the existing HF Space credentials on the server, verify its actual runtime, then check success, denied key, timeout and quota exhaustion. No paid fallback may be activated. Do not paste tokens into chat or client code.
8. Inspect desktop and narrow mobile layouts, keyboard focus, navigation, forms, errors and long questions/evidence. Confirm generated text renders as text rather than HTML.
9. Run existing backend and Playwright regression suites. Review the committee audit against fabricated citations and unsupported percentages. A clean mechanical audit must never be presented as proof of factual accuracy.
10. On staging, apply the additive schema procedure, validate HTTPS, account lifecycle, backup/restore, worker restart and production demo-reset rejection. Only promote after these checks pass.
