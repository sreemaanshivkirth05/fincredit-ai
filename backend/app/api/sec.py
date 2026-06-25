from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.sec import SecCompanyFactsResponse, SecFundamentalsHistoryResponse
from app.services.sec_service import (
    get_sec_company_facts,
    get_sec_fundamentals_history,
)

router = APIRouter(prefix="/sec", tags=["SEC Data"])


@router.get("/company-facts/{ticker}", response_model=SecCompanyFactsResponse)
def get_sec_company_facts_route(ticker: str, db: Session = Depends(get_db)):
    return get_sec_company_facts(ticker, db)


@router.get(
    "/company-facts/{ticker}/history",
    response_model=SecFundamentalsHistoryResponse,
)
def get_sec_fundamentals_history_route(ticker: str, db: Session = Depends(get_db)):
    return get_sec_fundamentals_history(ticker, db)