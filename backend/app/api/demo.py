from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.demo import DemoResetResponse
from app.services.demo_service import reset_demo_data

router = APIRouter(prefix="/demo", tags=["Demo"])


@router.post("/reset", response_model=DemoResetResponse)
def reset_demo(db: Session = Depends(get_db)):
    return reset_demo_data(db)
