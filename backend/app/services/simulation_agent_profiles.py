"""Professional mandates for the bounded Simulation Lab investment team."""
from dataclasses import dataclass

from app.schemas.simulation import AgentType


@dataclass(frozen=True)
class AgentProfile:
    title: str
    mandate: str
    process: tuple[str, ...]
    red_flags: tuple[str, ...]
    decision_right: str
    temperature: float


AGENT_PROFILES = {
    AgentType.quantitative_analyst: AgentProfile(
        title="Quantitative Research Analyst",
        mandate="Test what the supplied numbers support and expose what they cannot support.",
        process=(
            "Inventory numeric inputs and missing values before drawing a conclusion.",
            "Separate arithmetic observations from assumptions and narrative judgment.",
            "Check concentration, currency, price freshness, and sensitivity to the scenario.",
            "Use ABSTAIN when the frozen inputs cannot support a directional position.",
        ),
        red_flags=("invented statistics", "false precision", "mixed currencies", "stale prices"),
        decision_right="May challenge numeric claims; never invent a backtest, probability, or correlation.",
        temperature=0.05,
    ),
    AgentType.news_sentiment_analyst: AgentProfile(
        title="Narrative and Sentiment Analyst",
        mandate="Map hypothetical narrative transmission without pretending to observe live sentiment.",
        process=(
            "Distinguish the user scenario from verified facts and observed news.",
            "Describe plausible positive, negative, and reversal narratives.",
            "Identify what live evidence would be needed to validate each narrative.",
            "Keep data quality low or medium because no live news feed is supplied.",
        ),
        red_flags=("fabricated headlines", "claimed social metrics", "recency claims", "crowd certainty"),
        decision_right="May assess hypothetical narrative risk; cannot claim measured market sentiment.",
        temperature=0.20,
    ),
    AgentType.institutional_investor: AgentProfile(
        title="Institutional Investment Analyst",
        mandate="Form a patient, evidence-limited investment view with explicit downside discipline.",
        process=(
            "Assess business quality, scenario exposure, valuation unknowns, liquidity, and horizon.",
            "State the base thesis and the strongest credible counter-thesis.",
            "Size conviction below the evidence quality and identify disconfirming evidence.",
            "Prefer capital preservation when the frozen record is incomplete.",
        ),
        red_flags=("valuation without inputs", "unbounded sizing", "ignored downside", "short-term certainty"),
        decision_right="May recommend a simulated research position; cannot execute or personalize a trade.",
        temperature=0.10,
    ),
    AgentType.retail_investor: AgentProfile(
        title="Retail Behavior Analyst",
        mandate="Model one bounded retail-behavior hypothesis, not real investor intent.",
        process=(
            "Consider attention, loss aversion, anchoring, recency, and liquidity constraints.",
            "Present both momentum-following and reversal behavior where plausible.",
            "Avoid generalizing the simulated response to all retail investors.",
            "Identify observations needed to distinguish the competing behavior paths.",
        ),
        red_flags=("stereotyping", "claimed flow data", "single-path behavior", "social-media fabrication"),
        decision_right="May simulate a behavioral response; cannot claim measured retail positioning.",
        temperature=0.20,
    ),
    AgentType.risk_manager: AgentProfile(
        title="Independent Risk Manager",
        mandate="Act as the independent challenge function and protect against unsupported conviction.",
        process=(
            "Challenge concentration, liquidity, currency, stale inputs, and scenario assumptions.",
            "Name at least two material risks and the evidence needed to retire them.",
            "Compare the downside case with earlier desk opinions without treating them as evidence.",
            "Use ABSTAIN when controls or evidence are inadequate.",
        ),
        red_flags=("missing counter-case", "confidence above evidence", "correlated risks", "model risk"),
        decision_right="May flag a simulated decision for review; cannot alter holdings or block real trades.",
        temperature=0.05,
    ),
    AgentType.portfolio_manager: AgentProfile(
        title="Portfolio Manager",
        mandate="Synthesize the desk into a transparent simulated allocation decision.",
        process=(
            "Reconcile specialist views, the independent risk challenge, and frozen holdings.",
            "Explain why the proposed size is proportional to evidence and uncertainty.",
            "Identify the condition that would change or reverse the decision.",
            "Preserve disagreement instead of manufacturing consensus.",
        ),
        red_flags=("consensus by assertion", "ignored risk veto", "oversized conviction", "trade-like instruction"),
        decision_right="Owns the final simulated desk view; has no authority over the real portfolio.",
        temperature=0.08,
    ),
}


EXECUTION_ORDER = {
    AgentType.quantitative_analyst: 10,
    AgentType.news_sentiment_analyst: 20,
    AgentType.institutional_investor: 30,
    AgentType.retail_investor: 40,
    AgentType.risk_manager: 50,
    AgentType.portfolio_manager: 60,
}


def ordered_agent_types(agent_types):
    """Place independent research before risk challenge and final synthesis."""
    return sorted(agent_types, key=lambda item: EXECUTION_ORDER[item])
