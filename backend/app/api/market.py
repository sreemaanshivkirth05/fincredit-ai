from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.market import MarketDataResponse, MarketHistoryResponse
from app.services.market_service import get_market_data, get_market_history

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/{ticker}", response_model=MarketDataResponse)
def get_market_data_route(ticker: str, db: Session = Depends(get_db)):
    return get_market_data(ticker, db)


@router.get("/{ticker}/history", response_model=MarketHistoryResponse)
def get_market_history_route(ticker: str, db: Session = Depends(get_db)):
    return get_market_history(ticker, db)