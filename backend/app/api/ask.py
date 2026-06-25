from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.ask import AskRequest, AskResponse, AgentRunsResponse
from app.services.ask_service import ask_fincredit_service, get_agent_runs_service

router = APIRouter(prefix="/ask", tags=["Ask FinCredit"])


@router.post("", response_model=AskResponse)
def ask_fincredit(request: AskRequest, db: Session = Depends(get_db)):
    return ask_fincredit_service(request.question, db)


@router.get("/runs", response_model=AgentRunsResponse)
def get_agent_runs(db: Session = Depends(get_db)):
    return get_agent_runs_service(db)