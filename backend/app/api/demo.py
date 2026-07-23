from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.demo import DemoResetResponse
from app.services.demo_service import reset_demo_data

router = APIRouter(prefix="/demo", tags=["Demo"])


@router.post("/reset", response_model=DemoResetResponse)
def reset_demo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return reset_demo_data(db, current_user.id)
