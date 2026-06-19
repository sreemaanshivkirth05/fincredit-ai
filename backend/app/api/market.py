from fastapi import APIRouter

from app.schemas.market import MarketDataResponse
from app.services.market_service import get_market_data

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/{ticker}", response_model=MarketDataResponse)
def get_market_data_route(ticker: str):
    return get_market_data(ticker)