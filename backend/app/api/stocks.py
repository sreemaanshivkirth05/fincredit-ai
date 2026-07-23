from fastapi import APIRouter, Query

from app.schemas.stocks import StockSearchResponse
from app.services.stock_universe_service import search_stocks

router = APIRouter(prefix="/stocks", tags=["Stocks"])


@router.get("/search", response_model=StockSearchResponse)
def search_stocks_route(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=10, ge=1, le=25),
):
    return search_stocks(q, limit)
