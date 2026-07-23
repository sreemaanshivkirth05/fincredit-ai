from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.watchlist import (
    WatchlistActionResponse,
    WatchlistAddRequest,
    WatchlistRefreshResponse,
    WatchlistResponse,
    WatchlistStatusResponse,
)
from app.services.watchlist_service import (
    add_stock_to_watchlist,
    get_watchlist_data,
    get_watchlist_status,
    refresh_watchlist_prices,
    remove_stock_from_watchlist,
)

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


@router.get("", response_model=WatchlistResponse)
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_watchlist_data(db, current_user.id)


@router.post("/refresh-prices", response_model=WatchlistRefreshResponse)
def refresh_prices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return refresh_watchlist_prices(db, current_user.id)


@router.get("/{ticker}/status", response_model=WatchlistStatusResponse)
def check_watchlist_status(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_watchlist_status(db, ticker, current_user.id)


@router.post("", response_model=WatchlistActionResponse)
def add_to_watchlist(
    request: WatchlistAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_stock_to_watchlist(db, request, current_user.id)


@router.delete("/{ticker}", response_model=WatchlistActionResponse)
def remove_from_watchlist(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return remove_stock_from_watchlist(db, ticker, current_user.id)
