# Simulation Lab Professional Agent System

The professional agent upgrade makes Simulation Lab behave like a disciplined
research desk while preserving its evidence and safety boundaries. The agents
are simulated analytical roles. They do not represent real investors, access
live markets, forecast prices, give personalized advice, or trade.

## Desk workflow

Agents run sequentially to keep Codespaces CPU and memory use bounded. The
system uses a stable professional order even when the request lists roles in a
different order:

1. Quantitative Research Analyst
2. Narrative and Sentiment Analyst
3. Institutional Investment Analyst
4. Retail Behavior Analyst
5. Independent Risk Manager
6. Portfolio Manager

Only configured roles run. Research roles develop specialist views first. The
risk manager independently challenges them, and the portfolio manager produces
the last simulated desk decision. Each later agent can inspect bounded earlier
opinions from the current round and validated opinions from the prior round.
Peer opinions are clearly marked as context and cannot be cited as evidence.
Each mandate also has a bounded sampling temperature: quantitative and risk
roles are most deterministic, while narrative and behavioral roles receive a
small amount of additional variation. The seed remains fixed per agent/round.

## Professional decision contract

Every persisted action must include:

- A directionally consistent BUY, SELL, HOLD, or ABSTAIN action.
- An in-scope ticker for BUY, SELL, and HOLD.
- A thesis and strongest credible counter-thesis.
- Catalysts, material risks, time horizon, and a 0–100 risk score.
- Explicit risk flags and a low, medium, or high data-quality rating.
- Sizing rationale proportional to evidence and uncertainty.
- Evidence that would disconfirm or reverse the view.
- Frozen evidence IDs and explicit uncertainties.

BUY requires positive simulated allocation intent, SELL requires negative
intent, and HOLD/ABSTAIN require zero. ABSTAIN cannot select a ticker.
Confidence is capped at 60 for low-quality data, 75 for medium, and 85 for high.
Scenario-only decisions are capped further. The sentiment role cannot claim
high-quality data because Phase 2 has no live news feed. The risk manager must
identify at least two material challenges.

## Decision quality

The backend assigns a deterministic score after validation. It measures
evidence breadth, risk discipline, counter-thesis strength, falsifiability, and
confidence discipline. The score is transparent and stored with its component
breakdown; it is not produced by another model.

| Score | Band | Meaning |
|---:|---|---|
| 80–100 | strong | The structured decision meets the highest current controls. |
| 65–79 | adequate | The decision is usable but has identifiable limitations. |
| 0–64 | needs_review | A human should review the decision before using it as research input. |

The final run result contains deterministic committee synthesis: action counts,
majority or mixed status, average confidence/risk/quality, leading risk flags,
the portfolio-manager and risk-manager decision IDs, and review reasons. This
synthesis does not manufacture consensus and is not a probability or forecast.

## Model behavior

Ollama receives JSON mode in addition to the strict prompt contract. Hugging
Face receives the same contract through the existing free Space adapter. Every
response still passes schema, evidence-ID, ticker-scope, role, and confidence
validation before it becomes an action. Invalid output fails closed and is
never saved as a valid decision.

The professional prompts use `simulation-agent-v2`. Existing Phase 2 actions
remain readable; their newly added `decisionDetail` defaults to an empty object
during the additive PostgreSQL migration. Simulation output is capped at 768
tokens to fit the structured record; calls remain sequential. No model is
downloaded automatically.
