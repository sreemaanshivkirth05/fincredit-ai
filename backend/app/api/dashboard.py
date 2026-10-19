from app.core.security import get_current_user
from app.models.user import User
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import get_dashboard_data

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_dashboard_data(db, current_user.id)