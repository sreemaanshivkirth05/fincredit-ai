from fastapi import APIRouter, Query

from app.schemas.news import StockNewsResponse
from app.services.news_service import get_stock_news_data

router = APIRouter(prefix="/news", tags=["News"])


@router.get("/{ticker}", response_model=StockNewsResponse)
def get_stock_news(
    ticker: str,
    limit: int = Query(default=8, ge=1, le=20),
):
    return get_stock_news_data(ticker=ticker, limit=limit)