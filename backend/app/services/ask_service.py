from sqlalchemy.orm import Session

from app.agents.fincredit_graph import run_fincredit_graph


def ask_fincredit_service(question: str, db: Session):
    cleaned_question = question.strip()

    graph_result = run_fincredit_graph(cleaned_question, db)

    return {
        "question": cleaned_question,
        "answer": graph_result["answer"],
        "riskDrivers": graph_result["risk_drivers"],
        "evidence": graph_result["evidence"],
        "suggestedActions": graph_result["suggested_actions"],
        "audit": graph_result["audit"],
        "message": "Ask FinCredit response generated with LangGraph agent workflow",
    }