from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.portfolio import (
    PortfolioActionResponse,
    PortfolioBuyRequest,
    PortfolioRefreshResponse,
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
    refresh_portfolio_prices,
    remove_holding_from_portfolio,
    sell_stock_from_portfolio,
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("", response_model=PortfolioResponse)
def get_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_portfolio_data(db, current_user.id)


@router.get("/transactions", response_model=PortfolioTransactionsResponse)
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_portfolio_transactions(db, current_user.id)


@router.post("/refresh-prices", response_model=PortfolioRefreshResponse)
def refresh_prices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return refresh_portfolio_prices(db, current_user.id)


@router.get("/{ticker}/status", response_model=PortfolioStatusResponse)
def check_portfolio_status(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_portfolio_status(db, ticker, current_user.id)


@router.post("/buy", response_model=PortfolioActionResponse)
def buy_stock_for_portfolio(
    request: PortfolioBuyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_stock_to_portfolio(db, request, current_user.id)


@router.post("/sell", response_model=PortfolioActionResponse)
def sell_stock_for_portfolio(
    request: PortfolioSellRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return sell_stock_from_portfolio(db, request, current_user.id)


@router.delete("/{ticker}", response_model=PortfolioActionResponse)
def delete_portfolio_holding(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return remove_holding_from_portfolio(db, ticker, current_user.id)
