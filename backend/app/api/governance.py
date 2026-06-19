from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.governance import GovernanceResponse
from app.services.governance_service import get_governance_data

router = APIRouter(prefix="/governance", tags=["Governance"])


@router.get("", response_model=GovernanceResponse)
def get_governance(db: Session = Depends(get_db)):
    return get_governance_data(db)