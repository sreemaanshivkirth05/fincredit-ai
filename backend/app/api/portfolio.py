from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.portfolio import (
    PortfolioActionResponse,
    PortfolioBuyRequest,
    PortfolioResponse,
    PortfolioSellRequest,
    PortfolioStatusResponse,
    PortfolioTransactionsResponse,
)
from app.services.portfolio_service import (
    add_stock_to_portfolio,
    get_portfolio_data,
    get_portfolio_status,
    get_portfolio_transactions,
    remove_holding_from_portfolio,
    sell_stock_from_portfolio,
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("", response_model=PortfolioResponse)
def get_portfolio(db: Session = Depends(get_db)):
    return get_portfolio_data(db)


@router.get("/transactions", response_model=PortfolioTransactionsResponse)
def get_transactions(db: Session = Depends(get_db)):
    return get_portfolio_transactions(db)


@router.get("/{ticker}/status", response_model=PortfolioStatusResponse)
def check_portfolio_status(ticker: str, db: Session = Depends(get_db)):
    return get_portfolio_status(db, ticker)


@router.post("/buy", response_model=PortfolioActionResponse)
def buy_stock_for_portfolio(
    request: PortfolioBuyRequest,
    db: Session = Depends(get_db),
):
    return add_stock_to_portfolio(db, request)


@router.post("/sell", response_model=PortfolioActionResponse)
def sell_stock_for_portfolio(
    request: PortfolioSellRequest,
    db: Session = Depends(get_db),
):
    return sell_stock_from_portfolio(db, request)


@router.delete("/{ticker}", response_model=PortfolioActionResponse)
def delete_portfolio_holding(ticker: str, db: Session = Depends(get_db)):
    return remove_holding_from_portfolio(db, ticker)
