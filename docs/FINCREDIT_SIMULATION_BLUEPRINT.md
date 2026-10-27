# FinCredit AI 3.0 — Multi-Agent Market Simulation Engine

Technical implementation blueprint · Based on your existing GitHub repository and MiroFish architecture

I reviewed your [FinCredit AI repository](https://github.com/sreemaanshivkirth05/fincredit-ai?utm_source=chatgpt.com) and its latest development branches, including your Investment Committee release and editorial UI redesign.

My recommendation is to build FinCredit Simulation Lab, an integrated environment where users can simulate how different market participants respond to financial events, observe portfolio impacts, compare possible outcomes, and review the evidence and assumptions behind each result.

This should become a new capability inside FinCredit AI—not a separate application or a rewrite of what you already built.

Implementation scope

Proposed

New module

## Simulation Lab

Initial simulation

## 6 agent types

Default execution

## Local-first

Target software cost

## $0

Keep existing research, paper trading, portfolio scenarios, Investment Committee, Ask AI, reports, governance, and the new editorial visual design.

## 1. What we will build

The finished feature will let a user enter a question such as:

How might a 50-basis-point interest rate increase affect technology stocks and my existing portfolio?

FinCredit AI will:

1. Retrieve relevant market, SEC, and portfolio information.
2. Create a reproducible scenario using a frozen data snapshot.
3. Configure distinct simulated market participants.
4. Run bounded interaction rounds between those participants.
5. Produce possible market narratives and agent decisions.
6. Apply explicitly defined price-shock scenarios to the existing portfolio risk engine.
7. Compare results, identify disagreements, and generate an evidence-backed report.

The important design principle is that agent opinions must not be mistaken for calculated market probabilities or future prices. Quantitative stress testing and LLM-generated behavioral simulation will be separate components.

## 2. Architecture

Existing Next.js application

New `/simulation-lab` page, existing editorial theme

FastAPI — Simulation API

Authentication · Validation · Run management · Ownership

LangGraph simulation orchestrator

Context builder

Agent registry

Memory manager

Scenario runner

Risk calculator

Evidence auditor

Ollama / HF

Local models and optional inference

PostgreSQL

Runs, snapshots, interactions, provenance

Simulation analysis + report

Agent timeline · Scenario comparison · Portfolio impact · Audit trail

This reuses your existing LangGraph infrastructure rather than introducing a second competing agent framework.

The MiroFish-inspired elements are the agents' distinct behaviors, temporal memory, interaction rounds, and emergent group dynamics.

## 3. Preserve existing FinCredit AI features

Your repository already contains the essential foundations for this extension:

| Existing capability             | Integration decision                                            |
| ------------------------------- | --------------------------------------------------------------- |
| JWT authentication              | Reuse and require for simulation endpoints                      |
| Stock research and SEC data     | Read existing research services; do not duplicate them          |
| Paper-trading portfolio         | Read-only snapshot input; never automatically execute trades    |
| Deterministic scenario analysis | Reuse for stress-testing calculations                           |
| Investment Committee            | Allow users to attach simulation findings to a committee review |
| Ask AI                          | Add retrieval of completed simulation results                   |
| Reports and governance          | Store simulation provenance and export results                  |
| Editorial UI redesign           | Extend its design system; no global restyling                   |

I also found an important branch detail: [PR #5 (Investment Committee)](https://github.com/sreemaanshivkirth05/fincredit-ai/pull/5?utm_source=chatgpt.com) and [PR #6 (editorial redesign)](https://github.com/sreemaanshivkirth05/fincredit-ai/pull/6?utm_source=chatgpt.com) are still open, with the redesign stacked on the committee release.

Implementation should start from your current local `feat/editorial-ui-redesign` working tree, after checking its status and creating a separate feature branch. We should not build from `main` and accidentally lose newer work.

Nothing in this plan requires deployment or automatically pushing your changes to GitHub.

## 4. Multi-agent simulation design

I recommend starting with six agent types, not thousands of agents. That keeps local inference practical and makes the system easier to evaluate.

Institutional Investor

Evaluates fundamentals, valuation, liquidity, and strategic portfolio allocation. Can express buying, selling, holding, or uncertainty.

Retail Investor

Models simplified retail reactions to news, market sentiment, and price movements. Its assumptions are configurable rather than inferred from real investors.

Risk Manager

Examines volatility, concentration, downside exposure, and whether other agents' conclusions exceed the available evidence.

Quantitative Analyst

Uses deterministic financial metrics, stress testing, and historical evidence rather than inventing returns or probabilities.

News and Sentiment Analyst

Reviews timestamped news and disclosed sources, separating actual events from hypothetical assumptions.

Portfolio Manager

Evaluates agent findings against the user's simulated holdings and proposes research questions, never real trades.

Each agent will have its own role instructions, risk tolerance, observation permissions, reasoning budget, and temporary memory. Their outputs will follow a strict Pydantic schema.

Agent actions should be limited to a controlled vocabulary such as `BUY`, `SELL`, `HOLD`, and `ABSTAIN`, accompanied by rationale, evidence IDs, uncertainties, and simulated allocation intentions.

The engine must support ABSTAIN: insufficient evidence is a valid outcome.

## 5. Simulation execution algorithm

For the first release:

- Default to 4 active agents and 5 rounds, with 6 available agent types.
- Use sequential inference locally to avoid exhausting RAM.
- Publish only validated, structured events.
- Store snapshots after each round for resumability.
- Stop on completion, cancellation, budget exhaustion, repeated non-progress, or error.
- Set hard limits on context length, total LLM calls, runtime, and stored event size.

```
def run_simulation(config, snapshot, agents):    state = initialize_state(config, snapshot)    record_audit_event(state, "started")    for round_number in range(config.max_rounds):        check_cancelled_or_exceeded_budget(state)        observations = build_round_observations(state)        for agent in agents:            context = get_agent_context(agent, observations)            response = infer_structured_action(agent, context)            action = validate_action(response, snapshot)            persist_agent_action(state.id, agent.id, action)        # Aggregate intentions, not invented market prices.        state = advance_simulated_market_state(state)        persist_round_checkpoint(state)        if should_stop(state):            break    risk_results = compute_deterministic_risk(state, snapshot)    report = generate_auditable_report(state, risk_results)    return finalize_run(state, report)
```

The `advance_simulated_market_state` operation should implement explicit, versioned rules. An agent's statement alone must not mechanically translate into a realistic market price change.

For meaningful testing, run controlled scenario ensembles and compare variation across seeds or independent LLM repetitions. Even with fixed seeds, LLM inference may not be perfectly reproducible, so each run should capture model versions, prompts, parameters, code version, and input hashes.

## 6. Database architecture

Keep your existing PostgreSQL instance. Add new tables through additive, reversible database migrations.

| Table                     | Contents                                                       |
| ------------------------- | -------------------------------------------------------------- |
| `simulation_runs`         | User ID, scenario, status, timestamps, model and configuration |
| `simulation_snapshots`    | Immutable market and portfolio input references                |
| `simulation_agents`       | Agent type, persona configuration, initial state               |
| `simulation_rounds`       | Round order, checkpoints, timestamps                           |
| `simulation_actions`      | Validated decisions, rationale, evidence references            |
| `simulation_memories`     | Run-scoped summaries and observations                          |
| `simulation_risk_results` | Calculated scenario metrics and assumptions                    |
| `simulation_reports`      | Final narrative, limitations, provenance                       |
| `simulation_audit_events` | Execution, errors, cancellation, model calls                   |

Use JSONB for bounded variable configurations and strongly typed columns for ownership, status, timestamps, and financial measurements.

Important database rules:

- Every run belongs to an authenticated user.
- Every nested record is accessed through a verified run owner.
- Portfolio snapshots are immutable and isolated.
- Outputs are append-only after finalization.
- Monetary calculations use decimal-safe arithmetic where appropriate.
- A failed run must not change holdings, trades, or existing reports.
- Historical runs must remain readable after an agent prompt or model changes.

For memory, start with PostgreSQL-based short summaries and structured facts. Add `pgvector` only if actual retrieval testing shows a benefit. A separate Zep Cloud service is not required.

## 7. Backend and API integration

These are proposed module names, subject to aligning with your existing services after inspecting the local working tree.

```

backend/app/
├── api/
│   └── simulation.py
├── schemas/
│   └── simulation.py
├── models/
│   └── simulation.py
├── services/
│   └── simulation/
│       ├── orchestrator.py
│       ├── agent_registry.py
│       ├── scenario_builder.py
│       ├── memory.py
│       ├── market_dynamics.py
│       ├── quantitative_engine.py
│       ├── evidence_validator.py
│       ├── report_builder.py
│       └── provider_adapter.py
├── agents/
│   └── simulation_graph.py
└── workers/
    └── simulation_worker.py

frontend/
├── app/
│   └── simulation-lab/
│       ├── page.tsx
│       └── [runId]/page.tsx
├── components/
│   └── simulation/
│       ├── ScenarioBuilder.tsx
│       ├── AgentTimeline.tsx
│       ├── DecisionMatrix.tsx
│       ├── SimulationProgress.tsx
│       ├── PortfolioImpact.tsx
│       └── SimulationReport.tsx
└── lib/
    └── simulation-api.ts

```

The backend should expose versioned endpoints that follow your current API conventions:

| Endpoint                        | Method | Function                          |
| ------------------------------- | ------ | --------------------------------- |
| `/api/simulations`              | POST   | Validate and create a run         |
| `/api/simulations`              | GET    | List owned runs                   |
| `/api/simulations/{id}`         | GET    | Retrieve status and configuration |
| `/api/simulations/{id}/events`  | GET    | Paginated events or SSE stream    |
| `/api/simulations/{id}/cancel`  | POST   | Request cancellation              |
| `/api/simulations/{id}/report`  | GET    | Retrieve report and risk results  |
| `/api/simulations/{id}/compare` | POST   | Compare compatible runs           |

The API should return `202 Accepted` for queued work and an identifier that supports polling. Progress streaming through Server-Sent Events can be added after basic polling is reliable.

A background worker should claim runs atomically from PostgreSQL. Begin with one worker process, transaction-safe claiming, heartbeats, lease expiration, and retry rules. This avoids requiring Redis or Celery immediately.

Each job needs idempotent creation, bounded retries, and protection against simultaneous workers executing the same run.

## 8. Free model strategy: Ollama + Hugging Face

Given your Windows laptop with 16 GB RAM and integrated graphics, I would optimize for modest memory consumption, not maximum agent count.

| Function               | Recommended approach                                         | Cost             |
| ---------------------- | ------------------------------------------------------------ | ---------------- |
| Agent reasoning        | Ollama with a small quantized Qwen instruct model            | Free locally     |
| Structured responses   | Ollama JSON-schema outputs + Pydantic validation             | Free             |
| Financial calculations | NumPy, pandas, SciPy, existing Python services               | Free             |
| Sentence embeddings    | Local Hugging Face sentence-transformer model                | Free             |
| Agent memory           | PostgreSQL initially                                         | Free locally     |
| Workflow orchestration | Existing LangGraph                                           | Free locally     |
| Charts                 | Existing Recharts                                            | Free             |
| Optional HF inference  | Hugging Face models, local or quota-limited hosted inference | Depends on quota |

My starting model target is a 3B–4B parameter quantized instruct model, chosen after checking Ollama compatibility, memory footprint, structured-output quality, and financial evaluation performance. Use a smaller 1B–2B model for constrained machines if necessary.

The same model can serve every agent using different system instructions. Six agents do not require six models loaded into RAM.

Hugging Face can provide model downloads and local embedding models. Hosted Hugging Face inference is not guaranteed to be unlimited or permanently free, so it should remain optional.

The engine must also have a deterministic demonstration mode that does not need an LLM. This mode should replay clearly labeled predefined agent decisions and compute genuine deterministic portfolio results—not present fabricated AI generations as live inference.

## 9. Frontend integration

Your newest UI uses a light editorial design, ivory surfaces, forest-green actions, charcoal typography, and financial tables. I would keep that visual language.

The Simulation Lab should contain a scenario configuration workspace, live agent activity timeline, financial scenario comparison, evidence drawer, and report view.

FINCREDIT / RESEARCH

# Simulation Lab

Illustrative interface — no simulation executed

Market event

Interest rate increase: +0.50%

Simulation rounds

5 rounds · 4 agents

Example agent activity

Quant Analyst

Evaluates rate sensitivity assumptions

Risk Manager

Checks downside and concentration

Institutional Investor

Reviews valuation and asset allocation

Example scenario stress-test

-12%-8%-4%0%4%BullBaseBear

Illustrative user-defined asset shocks, not MiroFish or model forecasts.

This preview is only to show the layout and information hierarchy. The live implementation should display calculated values from the user's snapshot, not hard-coded percentages.

## 10. Phased implementation roadmap

I would divide the actual coding work into six independently testable milestones.

Phase 1 — Integration foundation

Inspect the latest local branch, record the current baseline, create a feature branch, add configuration flags, migrations, API schemas, and persistent simulation records.

Exit condition: The existing app still passes its regression tests, and a new run can be created and retrieved without launching agents.

Phase 2 — Simulation engine

Implement agent personas, strict output validation, the LangGraph round runner, run-scoped memory, stop conditions, checkpoints, cancellation, and Ollama inference.

Exit condition: Four agents complete a five-round synthetic scenario with validated and persisted events.

Phase 3 — Financial intelligence

Integrate market snapshots, SEC fundamentals, existing portfolio analytics, risk calculations, and assumption-driven scenario comparison.

Exit condition: Portfolio impacts reconcile with the existing deterministic analytics engine.

Phase 4 — Simulation Lab UI

Build the new navigation entry, scenario creation interface, progress tracking, agent timeline, analysis charts, and report experience.

Exit condition: A user can create, monitor, cancel, reopen, and inspect a simulation through the browser.

Phase 5 — Research integration and auditability

Link completed simulations to Investment Committee reviews, Ask AI, and existing report workflows. Add evidence checks, model provenance, and export support.

Exit condition: A reviewer can trace each conclusion to source material, a simulated agent statement, or an explicit calculation.

Phase 6 — Testing and hardening

Add automated integration tests, resource limits, dependency failure tests, migration checks, local-model evaluations, and full manual QA.

Exit condition: The feature passes acceptance criteria, existing product behavior remains intact, and the local demo runs without paid inference.

## 11. Testing and acceptance criteria

Testing is especially important because the system mixes stochastic LLM outputs with deterministic calculations.

| Test area           | Required checks                                                        |
| ------------------- | ---------------------------------------------------------------------- |
| API                 | Validation, malformed inputs, rate limits, missing resources           |
| Authentication      | Cross-user access returns 403 or 404 without leaking run details       |
| Financial integrity | Zero-shock neutrality, P/L reconciliation, currency isolation          |
| Agent output        | Invalid JSON, unsupported actions, missing evidence, abstentions       |
| Execution           | Cancellation, restarts, duplicate requests, lease expiration           |
| Model availability  | Ollama offline, timeout, memory exhaustion, invalid inference          |
| Evidence            | Missing citations, stale data, prompt injection from retrieved content |
| Frontend            | Loading, empty, failure, cancel, completed, mobile accessibility       |
| Regression          | Portfolio trading, committee, Ask AI, stock research, reports          |
| Reproducibility     | Stored inputs, model identifiers, prompt versions, configuration       |

For numerical accuracy, compare portfolio stress calculations against fixed reference fixtures using appropriately tight tolerances.

For agent quality, create at least 20 benchmark scenarios, including contradictory news, missing SEC data, concentrated portfolios, extreme shocks, and adversarial inputs. Measure schema validity, groundedness, calculation accuracy, successful completion, and unsupported financial claims.

Run each benchmark multiple times to understand behavioral variability. A plausible-sounding simulation is not sufficient evidence of prediction quality.

A useful initial set of engineering targets would be:

- 100% authorization checks on all user-owned records.
- 100% financial calculation agreement with deterministic reference tests.
- No direct changes to paper holdings from a simulation.
- No invented citations accepted by the evidence validator.
- All benchmark scenarios terminate within configured budgets.
- All previously passing Playwright and backend regression tests still pass.

## 12. Engineering safeguards

There are several decisions that will keep FinCredit AI reliable as the project grows.

Security: Treat SEC, news, and web content as untrusted input. Agents should not be able to invoke unrestricted tools, modify portfolios, access other users' records, or execute generated code.

Simulation realism: Use simulated orders and transparent agent rules, not assertions that the LLM recreates actual investor behavior. Any proposed market-clearing model must declare its artificial liquidity, depth, slippage, and impact assumptions.

Cost control: Set per-run token ceilings and per-user quotas, stream or summarize older memory, and avoid loading multiple copies of a model.

Observability: Track run duration, calls, token estimates, inference failures, invalid responses, restart count, and calculation provenance.

Licensing: Reimplement MiroFish-inspired patterns within your existing architecture. Avoid copying its AGPL-licensed implementation into FinCredit AI without reviewing licensing obligations.

Failure behavior: A model failure should mark the run as incomplete or explicitly degraded. Deterministic calculations may remain available, but they must never be misrepresented as an AI-generated simulation.

## 13. Local implementation setup

Your normal application environment can remain unchanged: Next.js, FastAPI, PostgreSQL, Docker, VS Code, and Ollama.

A safe starting Git workflow, once local changes have been inspected and preserved, would be:

```

cd C:\Users\shivk\fincredit-ai

git status
git branch --show-current
git log -1 --oneline

# After verifying the expected local branch and
# preserving any outstanding modifications:
git switch -c feat/fincredit-simulation-lab

```

Then add the backend migration and schemas before any UI work.

Suggested new configuration:

```

SIMULATION_ENABLED=false
SIMULATION_MODE=local
SIMULATION_MAX_AGENTS=6
SIMULATION_DEFAULT_AGENTS=4
SIMULATION_MAX_ROUNDS=10
SIMULATION_DEFAULT_ROUNDS=5
SIMULATION_CONCURRENT_RUNS=1
SIMULATION_PROVIDER=ollama
SIMULATION_MODEL=<locally-installed-model>
SIMULATION_MAX_MODEL_CALLS=40
SIMULATION_MEMORY_BACKEND=postgres
SIMULATION_ALLOW_PORTFOLIO_WRITES=false

```

The exact model name should be chosen from models verified to run reliably on your laptop. Configuration limits must also be enforced server-side; environment variables alone are not a security boundary.

## 14. My final implementation recommendation

Recommended first release

FinCredit Simulation Lab v1 should deliver:

- Four concurrently participating logical agents, invoked sequentially
- Five-round simulations with configurable scenarios
- Persistent memory and a fully auditable event timeline
- Deterministic portfolio stress-testing integration
- Local Ollama reasoning and offline demonstration mode
- An interactive frontend matching your editorial design
- Investment Committee and report integration

I would not start with thousands of agents, a complex social-network simulator, external Zep memory, paid APIs, or a full market exchange implementation. They increase complexity without proving that the core feature works or produces useful results.

The first deliverable should be a trustworthy, observable, locally runnable simulation engine. Once that is validated, we can add agent populations, knowledge graph relationships, market microstructure models, and historical calibration.

Current status: This is a technical plan, not an implemented feature. I inspected the available GitHub code and branch metadata, but I have not modified your local working tree, created migrations, executed tests, or changed any existing functionality.

The best next development action is Phase 1: baseline verification, additive schema design, and simulation API foundation, built on your latest editorial UI branch.