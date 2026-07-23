from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.governance import GovernanceResponse
from app.services.governance_service import get_governance_data

router = APIRouter(prefix="/governance", tags=["Governance"])


@router.get("", response_model=GovernanceResponse)
def get_governance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_governance_data(db)
