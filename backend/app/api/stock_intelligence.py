from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import bearer_scheme
from app.db.database import get_db
from app.models.user import User
from app.schemas.stock_intelligence import StockIntelligenceResponse
from app.services.stock_intelligence_service import get_stock_intelligence

router = APIRouter(prefix="/intelligence", tags=["Stock Intelligence"])


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user = db.query(User).filter(User.id == int(user_id)).first()
    except (JWTError, TypeError, ValueError):
        return None

    if not user or not user.is_active:
        return None

    return user


@router.get("/stocks/{ticker}", response_model=StockIntelligenceResponse)
def get_stock_intelligence_route(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    return get_stock_intelligence(db, ticker, current_user)
