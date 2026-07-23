from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.ask import (
    AgentRunsByTickerResponse,
    AgentRunsResponse,
    AskRequest,
    AskResponse,
    AgentRunItemResponse,
)
from app.services.ask_service import (
    ask_fincredit_service,
    get_agent_runs_by_ticker_service,
    get_agent_runs_service,
    get_agent_run_by_id_service,
)

router = APIRouter(prefix="/ask", tags=["Ask FinCredit"])


@router.post("", response_model=AskResponse)
def ask_fincredit(
    request: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ask_fincredit_service(request.question, db, current_user.id)


@router.get("/runs", response_model=AgentRunsResponse)
def get_agent_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_agent_runs_service(db, current_user)


@router.get("/runs/by-ticker/{ticker}", response_model=AgentRunsByTickerResponse)
def get_agent_runs_by_ticker(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_agent_runs_by_ticker_service(ticker, db, current_user)

@router.get("/runs/{agent_run_id}", response_model=AgentRunItemResponse)
def get_agent_run_by_id(
    agent_run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_agent_run_by_id_service(agent_run_id, db, current_user)
