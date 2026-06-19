from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.company import CompanyResponse
from app.services.company_service import get_company_data

router = APIRouter(prefix="/company", tags=["Company"])


@router.get("/{ticker}", response_model=CompanyResponse)
def get_company(ticker: str, db: Session = Depends(get_db)):
    return get_company_data(ticker, db)