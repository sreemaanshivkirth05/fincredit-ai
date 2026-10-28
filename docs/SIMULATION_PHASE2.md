# Simulation Lab Phase 2

Phase 2 turns a saved immutable scenario into a bounded, auditable multi-agent
research run. It is disabled by default and must be explicitly enabled on the
server. It does not place trades, alter holdings, fetch live data, estimate
probabilities, clear a market, or claim to reproduce real investor behavior.

The professional agent mandates, desk ordering, decision contract, quality
scoring, and committee synthesis are documented in
`docs/SIMULATION_AGENT_SYSTEM.md`.

## What is implemented

- Explicit authenticated start and cancellation endpoints.
- A separate polling worker with PostgreSQL skip-locked queue claims.
- Sequential agent calls to limit CPU and memory pressure.
- Professional role mandates, canonical desk ordering, same-round peer context,
  and prior-round learning without treating model opinions as evidence.
- Structured thesis/counter-thesis, catalysts, risks, horizon, sizing rationale,
  confidence calibration, and deterministic decision-quality scoring.
- Six supported research roles, strict structured actions, frozen evidence IDs,
  deterministic per-agent seeds, call/round/runtime limits, and no automatic
  model retries.
- Persisted agents, rounds, validated actions, run-scoped memory, checkpoints,
  result metadata, and ordered audit events.
- Safe failure states for unavailable models, invalid output, invalid evidence,
  budget exhaustion, stale workers, and snapshot-integrity failure.
- Cooperative cancellation between model calls. An in-flight provider request
  finishes or times out before cancellation is observed.
- Ollama or the existing free Hugging Face Space adapter only. The provider and
  model are frozen into the immutable run snapshot when the run is created.

## State flow

`configured -> queued -> running -> completed`

Queued or running runs can become `cancelled`. Validation, provider, worker, or
integrity failures become `failed`. Finished runs cannot be restarted. Only one
queued or running simulation is allowed per user.

## Codespaces setup

Use the `dc` helper from `docs/CODESPACES.md`. Confirm the model is installed
and can produce the exact smoke-test response before enabling Simulation Lab.

```bash
dc up -d ollama
dc exec -T ollama ollama list
dc exec -T ollama ollama run qwen3.5:4b 'Reply with exactly: READY'

export SIMULATION_ENABLED=true
dc up -d --build backend simulation-worker
dc logs --tail=100 simulation-worker
```

No model is downloaded automatically. Codespaces routes Simulation Lab to
`qwen3.5:4b` through the internal `ollama:11434` service. The worker processes
one model call at a time.

## Authenticated API test

The Phase 4 web interface has not been added, so use the backend OpenAPI page on
private port 8000 or an authenticated API client. First register/login through
the application and copy the access token. Set it only in the current terminal:

```bash
export TOKEN='paste-access-token-here'
```

Create the smallest useful run (two agents, one round, two calls):

```bash
curl --fail -X POST http://localhost:8000/api/simulations \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Rate scenario smoke test",
    "scenario":"A hypothetical rate increase affects the frozen portfolio.",
    "tickers":["AAPL"],
    "configuration":{
      "agentTypes":["risk_manager","portfolio_manager"],
      "rounds":1,
      "seed":42,
      "maxModelCalls":2
    }
  }'
```

Copy the returned `id`, then explicitly start and inspect it:

```bash
export RUN_ID='paste-run-id-here'
curl --fail -X POST "http://localhost:8000/api/simulations/$RUN_ID/start" \
  -H "Authorization: Bearer $TOKEN"
curl --fail "http://localhost:8000/api/simulations/$RUN_ID" \
  -H "Authorization: Bearer $TOKEN"
curl --fail "http://localhost:8000/api/simulations/$RUN_ID/events" \
  -H "Authorization: Bearer $TOKEN"
curl --fail "http://localhost:8000/api/simulations/$RUN_ID/execution" \
  -H "Authorization: Bearer $TOKEN"
```

To request cancellation while queued or running:

```bash
curl --fail -X POST "http://localhost:8000/api/simulations/$RUN_ID/cancel" \
  -H "Authorization: Bearer $TOKEN"
```

Expected completed output contains one round, two validated actions, evidence
IDs from the frozen prompt, provider/model provenance, `noPortfolioWrites: true`,
decision details, committee synthesis, and ordered audit events. A model formatting failure is intentionally recorded
as `failed`; unvalidated text is never saved as an action.

## Limits and operation

Defaults are six agents, ten rounds, forty model calls, 768 output tokens per
call, a one-hour run budget, and a ten-minute stale-worker threshold. Client
requests may choose smaller values but cannot exceed server limits. For a CPU
Codespace, begin with two agents and one round.

```bash
dc stop simulation-worker
dc logs --tail=200 simulation-worker
```

Stopping a worker during a run never triggers automatic model-call replay. Once
the stale threshold passes, another worker marks the interrupted run failed and
the user starts a new run. This preserves audit clarity and avoids duplicate
model costs or actions.
