from sqlalchemy.orm import Session

from app.agents.fincredit_graph import run_fincredit_graph
from app.models.agent_run import AgentRun


def ask_fincredit_service(question: str, db: Session):
    cleaned_question = question.strip()

    graph_result = run_fincredit_graph(cleaned_question, db)

    audit = graph_result["audit"]

    agent_run = AgentRun(
        question=cleaned_question,
        ticker=graph_result.get("ticker"),
        answer=graph_result["answer"],
        workflow=audit["workflow"],
        agents_used=audit["agentsUsed"],
        grounding_score=audit["groundingScore"],
        unsupported_claims=audit["unsupportedClaims"],
        status=audit["status"],
        risk_drivers=graph_result["risk_drivers"],
        evidence=graph_result["evidence"],
        suggested_actions=graph_result["suggested_actions"],
    )

    db.add(agent_run)
    db.commit()

    return {
        "question": cleaned_question,
        "answer": graph_result["answer"],
        "riskDrivers": graph_result["risk_drivers"],
        "evidence": graph_result["evidence"],
        "suggestedActions": graph_result["suggested_actions"],
        "audit": audit,
        "message": "Ask FinCredit response generated with LangGraph agent workflow and stored in PostgreSQL",
    }


def get_agent_runs_service(db: Session):
    agent_runs = (
        db.query(AgentRun)
        .order_by(AgentRun.created_at.desc())
        .limit(25)
        .all()
    )

    runs_response = [
        {
            "id": run.id,
            "question": run.question,
            "ticker": run.ticker,
            "answer": run.answer,
            "workflow": run.workflow,
            "agentsUsed": run.agents_used,
            "groundingScore": run.grounding_score,
            "unsupportedClaims": run.unsupported_claims,
            "status": run.status,
            "riskDrivers": run.risk_drivers,
            "evidence": run.evidence,
            "suggestedActions": run.suggested_actions,
            "createdAt": run.created_at,
        }
        for run in agent_runs
    ]

    return {
        "totalRuns": len(runs_response),
        "runs": runs_response,
        "message": "Agent run history loaded from PostgreSQL",
    }