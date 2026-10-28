"""Professional agent contracts and deterministic decision-quality controls."""
import unittest

from pydantic import ValidationError

from app.schemas.simulation import AgentDecision, AgentType
from app.services.simulation_agent_profiles import AGENT_PROFILES, ordered_agent_types
from app.services.simulation_orchestrator import (
    SimulationExecutionError, _quality_score, _validate_role_decision,
)


def decision_payload(**changes):
    payload = {
        "action": "HOLD",
        "ticker": "AAPL",
        "allocationIntentPct": 0,
        "confidence": 55,
        "rationale": "The frozen evidence supports maintaining a bounded simulated position.",
        "thesis": "The frozen holding and scenario support a cautious hold over several months.",
        "counterThesis": "Missing live fundamentals could make the stored portfolio view obsolete.",
        "catalysts": ["Evidence that scenario pressure is temporary"],
        "risks": ["Stored pricing may be stale", "Scenario transmission remains uncertain"],
        "timeHorizon": "months",
        "riskScore": 58,
        "riskFlags": ["data_staleness", "scenario_uncertainty"],
        "dataQuality": "medium",
        "sizingRationale": "No allocation change is proportional to the incomplete frozen evidence.",
        "disconfirmingEvidenceNeeded": ["Current fundamentals that contradict the thesis"],
        "evidenceIds": ["scenario:input", "ticker:AAPL", "holding:1"],
        "uncertainties": ["No live market or news data was supplied"],
    }
    payload.update(changes)
    return payload


class AgentQualityTests(unittest.TestCase):
    def test_all_roles_have_mandates_and_professional_execution_order(self):
        self.assertEqual(set(AGENT_PROFILES), set(AgentType))
        configured = [
            AgentType.portfolio_manager, AgentType.risk_manager,
            AgentType.institutional_investor, AgentType.quantitative_analyst,
        ]
        self.assertEqual(ordered_agent_types(configured), [
            AgentType.quantitative_analyst, AgentType.institutional_investor,
            AgentType.risk_manager, AgentType.portfolio_manager,
        ])
        for profile in AGENT_PROFILES.values():
            self.assertGreaterEqual(len(profile.process), 4)
            self.assertGreaterEqual(len(profile.red_flags), 4)
            self.assertGreaterEqual(profile.temperature, 0)
            self.assertLessEqual(profile.temperature, 0.2)

    def test_direction_sizing_and_confidence_must_be_consistent(self):
        invalid = [
            decision_payload(action="BUY", allocationIntentPct=-10),
            decision_payload(action="SELL", allocationIntentPct=10),
            decision_payload(action="HOLD", allocationIntentPct=10),
            decision_payload(action="ABSTAIN", ticker="AAPL"),
            decision_payload(dataQuality="low", confidence=61),
            decision_payload(riskFlags=["none", "model_risk"]),
        ]
        for payload in invalid:
            with self.subTest(payload=payload):
                with self.assertRaises(ValidationError):
                    AgentDecision.model_validate(payload)

    def test_role_specific_challenge_and_confidence_calibration(self):
        evidence = [{"id": "scenario:input", "kind": "hypothetical_scenario"}]
        decision = AgentDecision.model_validate(decision_payload(
            confidence=50, dataQuality="low", evidenceIds=["scenario:input"],
            risks=["Only one risk was identified"],
        ))
        with self.assertRaisesRegex(SimulationExecutionError, "independent challenges"):
            _validate_role_decision(decision, AgentType.risk_manager.value, evidence)
        overconfident = AgentDecision.model_validate(decision_payload(
            confidence=56, dataQuality="low", evidenceIds=["scenario:input"],
        ))
        with self.assertRaisesRegex(SimulationExecutionError, "confidence"):
            _validate_role_decision(
                overconfident, AgentType.institutional_investor.value, evidence,
            )

    def test_quality_score_is_deterministic_and_explainable(self):
        quality = _quality_score(AgentDecision.model_validate(decision_payload()))
        self.assertEqual(quality["score"], 86)
        self.assertEqual(quality["band"], "strong")
        self.assertEqual(set(quality["components"]), {
            "evidence", "riskDiscipline", "counterThesis",
            "falsifiability", "confidenceDiscipline",
        })


if __name__ == "__main__":
    unittest.main()
