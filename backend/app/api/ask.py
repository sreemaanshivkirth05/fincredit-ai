from fastapi import APIRouter

from app.schemas.ask import AskRequest, AskResponse
from app.services.ask_service import ask_fincredit_service

router = APIRouter(prefix="/ask", tags=["Ask FinCredit"])


@router.post("", response_model=AskResponse)
def ask_fincredit(request: AskRequest):
    return ask_fincredit_service(request.question)