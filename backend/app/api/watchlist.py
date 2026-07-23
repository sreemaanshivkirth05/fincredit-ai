from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
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
def get_watchlist(db: Session = Depends(get_db)):
    return get_watchlist_data(db)


@router.post("/refresh-prices", response_model=WatchlistRefreshResponse)
def refresh_prices(db: Session = Depends(get_db)):
    return refresh_watchlist_prices(db)


@router.get("/{ticker}/status", response_model=WatchlistStatusResponse)
def check_watchlist_status(ticker: str, db: Session = Depends(get_db)):
    return get_watchlist_status(db, ticker)


@router.post("", response_model=WatchlistActionResponse)
def add_to_watchlist(
    request: WatchlistAddRequest,
    db: Session = Depends(get_db),
):
    return add_stock_to_watchlist(db, request)


@router.delete("/{ticker}", response_model=WatchlistActionResponse)
def remove_from_watchlist(ticker: str, db: Session = Depends(get_db)):
    return remove_stock_from_watchlist(db, ticker)
