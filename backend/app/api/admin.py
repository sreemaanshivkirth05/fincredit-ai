from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.database import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminOverviewResponse,
    AdminUserDetailResponse,
    AdminUsersResponse,
)
from app.services.admin_service import (
    get_admin_overview,
    get_admin_user_detail,
    get_admin_users,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/overview", response_model=AdminOverviewResponse)
def admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return get_admin_overview(db)


@router.get("/users", response_model=AdminUsersResponse)
def admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return get_admin_users(db)


@router.get("/users/{user_id}", response_model=AdminUserDetailResponse)
def admin_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    detail = get_admin_user_detail(user_id, db)

    if detail["user"] is None:
        raise HTTPException(status_code=404, detail="User not found.")

    return detail
