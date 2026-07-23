from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.models.portfolio_transaction import PortfolioTransaction
from app.schemas.portfolio import PortfolioBuyRequest, PortfolioSellRequest


def normalize_ticker(ticker: str) -> str:
    return ticker.strip().upper()


def calculate_unrealized_pl(value: float, total_cost: float):
    unrealized_pl = value - total_cost
    unrealized_pl_percent = (
        (unrealized_pl / total_cost) * 100 if total_cost else 0
    )

    return unrealized_pl, unrealized_pl_percent


def holding_to_dict(holding: Holding):
    current_price = holding.current_price or holding.avg_price
    total_cost = holding.total_cost or holding.shares * holding.avg_price
    value = holding.shares * current_price

    unrealized_pl, unrealized_pl_percent = calculate_unrealized_pl(
        value=value,
        total_cost=total_cost,
    )

    return {
        "ticker": holding.ticker,
        "company": holding.company,
        "shares": holding.shares,
        "avgPrice": holding.avg_price,
        "currentPrice": current_price,
        "totalCost": total_cost,
        "value": value,
        "weight": holding.weight,
        "unrealizedPL": unrealized_pl,
        "unrealizedPLPercent": unrealized_pl_percent,
        "sector": holding.sector,
        "risk": holding.risk,
        "score": holding.score,
        "sentiment": holding.sentiment,
        "currency": holding.currency or "USD",
        "exchange": holding.exchange,
        "createdAt": holding.created_at,
        "updatedAt": holding.updated_at,
    }


def transaction_to_dict(transaction: PortfolioTransaction):
    return {
        "id": transaction.id,
        "ticker": transaction.ticker,
        "company": transaction.company,
        "action": transaction.action,
        "shares": transaction.shares,
        "price": transaction.price,
        "totalAmount": transaction.total_amount,
        "realizedPL": transaction.realized_pl,
        "realizedPLPercent": transaction.realized_pl_percent,
        "currency": transaction.currency or "USD",
        "exchange": transaction.exchange,
        "createdAt": transaction.created_at,
    }


def get_holding_by_ticker(db: Session, ticker: str):
    cleaned_ticker = normalize_ticker(ticker)

    return (
        db.query(Holding)
        .filter(func.upper(Holding.ticker) == cleaned_ticker)
        .first()
    )


def recalculate_portfolio_weights(db: Session):
    holdings = db.query(Holding).order_by(Holding.id.asc()).all()

    total_value = 0

    for holding in holdings:
        current_price = holding.current_price or holding.avg_price
        holding.value = holding.shares * current_price
        total_value += holding.value

    for holding in holdings:
        holding.weight = round((holding.value / total_value) * 100, 2) if total_value else 0

        total_cost = holding.total_cost or holding.shares * holding.avg_price

        unrealized_pl, unrealized_pl_percent = calculate_unrealized_pl(
            value=holding.value,
            total_cost=total_cost,
        )

        holding.total_cost = total_cost
        holding.unrealized_pl = unrealized_pl
        holding.unrealized_pl_percent = unrealized_pl_percent
        holding.updated_at = datetime.utcnow()


def get_portfolio_status(db: Session, ticker: str):
    cleaned_ticker = normalize_ticker(ticker)
    holding = get_holding_by_ticker(db, cleaned_ticker)

    if holding:
        recalculate_portfolio_weights(db)
        db.commit()
        db.refresh(holding)

    return {
        "ticker": cleaned_ticker,
        "isInPortfolio": holding is not None,
        "holding": holding_to_dict(holding) if holding else None,
    }


def add_stock_to_portfolio(db: Session, request: PortfolioBuyRequest):
    cleaned_ticker = normalize_ticker(request.ticker)

    if request.shares <= 0:
        raise HTTPException(status_code=400, detail="Shares must be greater than 0.")

    if request.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0.")

    existing_holding = get_holding_by_ticker(db, cleaned_ticker)
    buy_amount = request.shares * request.price

    if existing_holding:
        old_shares = existing_holding.shares
        old_total_cost = existing_holding.total_cost or (
            existing_holding.shares * existing_holding.avg_price
        )

        new_shares = old_shares + request.shares
        new_total_cost = old_total_cost + buy_amount
        new_avg_price = new_total_cost / new_shares

        existing_holding.company = request.company or existing_holding.company
        existing_holding.sector = request.sector or existing_holding.sector
        existing_holding.shares = new_shares
        existing_holding.avg_price = new_avg_price
        existing_holding.current_price = request.price
        existing_holding.total_cost = new_total_cost
        existing_holding.value = new_shares * request.price
        existing_holding.currency = request.currency or existing_holding.currency or "USD"
        existing_holding.exchange = request.exchange or existing_holding.exchange
        existing_holding.updated_at = datetime.utcnow()

        holding = existing_holding
    else:
        holding = Holding(
            ticker=cleaned_ticker,
            company=request.company or cleaned_ticker,
            shares=request.shares,
            avg_price=request.price,
            current_price=request.price,
            total_cost=buy_amount,
            value=buy_amount,
            weight=0,
            unrealized_pl=0,
            unrealized_pl_percent=0,
            sector=request.sector or "Unknown",
            risk="Learning",
            score=50,
            sentiment="Neutral",
            currency=request.currency or "USD",
            exchange=request.exchange,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(holding)

    transaction = PortfolioTransaction(
        ticker=cleaned_ticker,
        company=request.company or holding.company or cleaned_ticker,
        action="BUY",
        shares=request.shares,
        price=request.price,
        total_amount=buy_amount,
        realized_pl=None,
        realized_pl_percent=None,
        currency=request.currency or "USD",
        exchange=request.exchange,
        created_at=datetime.utcnow(),
    )

    db.add(transaction)
    db.flush()

    recalculate_portfolio_weights(db)

    db.commit()
    db.refresh(holding)
    db.refresh(transaction)

    return {
        "ticker": cleaned_ticker,
        "message": f"Bought {request.shares:g} simulated shares of {cleaned_ticker}.",
        "holding": holding_to_dict(holding),
        "transaction": transaction_to_dict(transaction),
    }


def sell_stock_from_portfolio(db: Session, request: PortfolioSellRequest):
    cleaned_ticker = normalize_ticker(request.ticker)

    if request.shares <= 0:
        raise HTTPException(status_code=400, detail="Shares must be greater than 0.")

    if request.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0.")

    holding = get_holding_by_ticker(db, cleaned_ticker)

    if not holding:
        raise HTTPException(
            status_code=404,
            detail=f"{cleaned_ticker} is not in the portfolio.",
        )

    if request.shares > holding.shares:
        raise HTTPException(
            status_code=400,
            detail="Cannot sell more shares than currently held.",
        )

    avg_price = holding.avg_price
    proceeds = request.shares * request.price
    realized_pl = (request.price - avg_price) * request.shares
    realized_pl_percent = ((request.price - avg_price) / avg_price) * 100 if avg_price else 0
    remaining_shares = holding.shares - request.shares

    transaction = PortfolioTransaction(
        ticker=cleaned_ticker,
        company=holding.company,
        action="SELL",
        shares=request.shares,
        price=request.price,
        total_amount=proceeds,
        realized_pl=realized_pl,
        realized_pl_percent=realized_pl_percent,
        currency=holding.currency or "USD",
        exchange=holding.exchange,
        created_at=datetime.utcnow(),
    )

    db.add(transaction)

    if remaining_shares <= 0:
        db.delete(holding)
        response_holding = None
    else:
        holding.shares = remaining_shares
        holding.current_price = request.price
        holding.total_cost = avg_price * remaining_shares
        holding.value = remaining_shares * request.price

        unrealized_pl, unrealized_pl_percent = calculate_unrealized_pl(
            value=holding.value,
            total_cost=holding.total_cost,
        )

        holding.unrealized_pl = unrealized_pl
        holding.unrealized_pl_percent = unrealized_pl_percent
        holding.updated_at = datetime.utcnow()
        response_holding = holding

    db.flush()

    recalculate_portfolio_weights(db)

    db.commit()
    db.refresh(transaction)

    if response_holding:
        db.refresh(response_holding)

    return {
        "ticker": cleaned_ticker,
        "message": f"Sold {request.shares:g} simulated shares of {cleaned_ticker}.",
        "holding": holding_to_dict(response_holding) if response_holding else None,
        "transaction": transaction_to_dict(transaction),
    }


def remove_holding_from_portfolio(db: Session, ticker: str):
    cleaned_ticker = normalize_ticker(ticker)
    holding = get_holding_by_ticker(db, cleaned_ticker)

    if not holding:
        return {
            "ticker": cleaned_ticker,
            "message": f"{cleaned_ticker} is not in the portfolio.",
            "holding": None,
            "transaction": None,
        }

    db.delete(holding)
    db.flush()

    recalculate_portfolio_weights(db)

    db.commit()

    return {
        "ticker": cleaned_ticker,
        "message": f"{cleaned_ticker} removed from portfolio.",
        "holding": None,
        "transaction": None,
    }


def get_portfolio_data(db: Session):
    holdings = db.query(Holding).order_by(Holding.id.asc()).all()

    recalculate_portfolio_weights(db)
    db.commit()

    holdings = db.query(Holding).order_by(Holding.id.asc()).all()
    holdings_response = [holding_to_dict(holding) for holding in holdings]

    transactions = (
        db.query(PortfolioTransaction)
        .order_by(PortfolioTransaction.created_at.desc())
        .limit(10)
        .all()
    )

    transactions_response = [
        transaction_to_dict(transaction) for transaction in transactions
    ]

    total_value = sum(item["value"] for item in holdings_response)
    total_cost = sum(item["totalCost"] or 0 for item in holdings_response)

    unrealized_pl = total_value - total_cost
    unrealized_pl_percent = (
        (unrealized_pl / total_cost) * 100 if total_cost else 0
    )

    holdings_count = len(holdings_response)

    high_risk_exposure = sum(
        item["weight"] for item in holdings_response if item["risk"] == "High"
    )

    if holdings_count > 0:
        overall_risk = round(
            sum(item["score"] * item["weight"] for item in holdings_response) / 100
        )
    else:
        overall_risk = 0

    sector_totals = {}

    for holding in holdings_response:
        sector = holding["sector"] or "Unknown"
        sector_totals[sector] = sector_totals.get(sector, 0) + holding["value"]

    sector_allocation = [
        {
            "name": sector,
            "value": round((sector_value / total_value) * 100, 2)
            if total_value
            else 0,
        }
        for sector, sector_value in sector_totals.items()
    ]

    sector_allocation = sorted(
        sector_allocation,
        key=lambda item: item["value"],
        reverse=True,
    )

    return {
        "totalValue": total_value,
        "totalCost": total_cost,
        "unrealizedPL": unrealized_pl,
        "unrealizedPLPercent": unrealized_pl_percent,
        "overallRisk": overall_risk,
        "highRiskExposure": high_risk_exposure,
        "holdingsCount": holdings_count,
        "holdings": holdings_response,
        "sectorAllocation": sector_allocation,
        "transactions": transactions_response,
        "message": "Portfolio API connected to PostgreSQL successfully",
    }


def get_portfolio_transactions(db: Session, limit: int = 50):
    safe_limit = max(1, min(limit, 200))

    transactions = (
        db.query(PortfolioTransaction)
        .order_by(PortfolioTransaction.created_at.desc())
        .limit(safe_limit)
        .all()
    )

    transactions_response = [
        transaction_to_dict(transaction) for transaction in transactions
    ]

    return {
        "count": len(transactions_response),
        "transactions": transactions_response,
        "message": "Portfolio transaction history loaded successfully",
    }
