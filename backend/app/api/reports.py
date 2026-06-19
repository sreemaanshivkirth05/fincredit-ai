from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.reports import ReportsResponse
from app.services.reports_service import get_reports_data

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=ReportsResponse)
def get_reports(db: Session = Depends(get_db)):
    return get_reports_data(db)