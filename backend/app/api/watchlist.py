from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.watchlist import WatchlistResponse
from app.services.watchlist_service import get_watchlist_data

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


@router.get("", response_model=WatchlistResponse)
def get_watchlist(db: Session = Depends(get_db)):
    return get_watchlist_data(db)