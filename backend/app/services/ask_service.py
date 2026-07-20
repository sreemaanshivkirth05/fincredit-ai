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
    db.refresh(agent_run)

    return {
        "agentRunId": agent_run.id,
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

    return {
        "totalRuns": len(agent_runs),
        "runs": [
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
        ],
        "message": "Agent runs loaded from PostgreSQL successfully",
    }


def get_agent_runs_by_ticker_service(ticker: str, db: Session):
    normalized_ticker = ticker.upper().strip()

    agent_runs = (
        db.query(AgentRun)
        .filter(AgentRun.ticker == normalized_ticker)
        .order_by(AgentRun.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "ticker": normalized_ticker,
        "totalRuns": len(agent_runs),
        "runs": [
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
        ],
        "message": f"Latest AI agent runs loaded for ticker {normalized_ticker}",
    }


from fastapi import HTTPException

def get_agent_run_by_id_service(agent_run_id: int, db: Session):
    agent_run = db.query(AgentRun).filter(AgentRun.id == agent_run_id).first()

    if not agent_run:
        raise HTTPException(status_code=404, detail="Agent run not found")

    return {
        "id": agent_run.id,
        "question": agent_run.question,
        "ticker": agent_run.ticker,
        "answer": agent_run.answer,
        "workflow": agent_run.workflow,
        "agentsUsed": agent_run.agents_used,
        "groundingScore": agent_run.grounding_score,
        "unsupportedClaims": agent_run.unsupported_claims,
        "status": agent_run.status,
        "riskDrivers": agent_run.risk_drivers,
        "evidence": agent_run.evidence,
        "suggestedActions": agent_run.suggested_actions,
        "createdAt": agent_run.created_at,
    }