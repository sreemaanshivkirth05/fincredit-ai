import time

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.agents.fincredit_graph import run_fincredit_graph
from app.models.agent_run import AgentRun


def agent_run_to_dict(run: AgentRun):
    return {
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


def ask_fincredit_service(question: str, db: Session):
    start_time = time.perf_counter()
    cleaned_question = question.strip()

    if not cleaned_question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    graph_result = run_fincredit_graph(cleaned_question, db)
    runtime_seconds = time.perf_counter() - start_time
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
        "message": (
            f"Ask FinCredit response generated in {runtime_seconds:.1f}s "
            "with portfolio, transactions, watchlist, market, SEC, news, and LangGraph context"
        ),
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
        "runs": [agent_run_to_dict(run) for run in agent_runs],
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
        "runs": [agent_run_to_dict(run) for run in agent_runs],
        "message": f"Latest AI agent runs loaded for ticker {normalized_ticker}",
    }


def get_agent_run_by_id_service(agent_run_id: int, db: Session):
    agent_run = db.query(AgentRun).filter(AgentRun.id == agent_run_id).first()

    if not agent_run:
        raise HTTPException(status_code=404, detail="Agent run not found")

    return agent_run_to_dict(agent_run)
