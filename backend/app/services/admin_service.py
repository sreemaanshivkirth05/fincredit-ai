from sqlalchemy.orm import Session

from app.models.agent_run import AgentRun
from app.models.holding import Holding
from app.models.portfolio_transaction import PortfolioTransaction
from app.models.user import User
from app.models.watchlist_company import WatchlistCompany
from app.services.ask_service import agent_run_to_dict
from app.services.portfolio_service import holding_to_dict, transaction_to_dict
from app.services.watchlist_service import watchlist_company_to_dict


def safe_float(value):
    return float(value or 0)


def user_to_summary(db: Session, user: User):
    holdings = db.query(Holding).filter(Holding.user_id == user.id).all()
    holdings_count = len(holdings)
    transactions_count = (
        db.query(PortfolioTransaction)
        .filter(PortfolioTransaction.user_id == user.id)
        .count()
    )
    watchlist_count = (
        db.query(WatchlistCompany).filter(WatchlistCompany.user_id == user.id).count()
    )
    agent_runs_count = db.query(AgentRun).filter(AgentRun.user_id == user.id).count()

    portfolio_value = sum(safe_float(holding.value) for holding in holdings)
    total_cost = sum(
        safe_float(holding.total_cost)
        or safe_float(holding.shares) * safe_float(holding.avg_price)
        for holding in holdings
    )

    return {
        "id": user.id,
        "email": user.email,
        "fullName": user.full_name,
        "role": user.role,
        "isActive": user.is_active,
        "createdAt": user.created_at,
        "holdingsCount": holdings_count,
        "transactionsCount": transactions_count,
        "watchlistCount": watchlist_count,
        "agentRunsCount": agent_runs_count,
        "portfolioValue": portfolio_value,
        "totalCost": total_cost,
        "unrealizedPL": portfolio_value - total_cost,
    }


def get_admin_overview(db: Session):
    users = db.query(User).all()
    holdings = db.query(Holding).all()

    total_portfolio_value = sum(safe_float(holding.value) for holding in holdings)

    return {
        "totalUsers": len(users),
        "activeUsers": sum(1 for user in users if user.is_active),
        "adminUsers": sum(1 for user in users if user.role == "admin"),
        "totalHoldings": len(holdings),
        "totalTransactions": db.query(PortfolioTransaction).count(),
        "totalWatchlistItems": db.query(WatchlistCompany).count(),
        "totalAgentRuns": db.query(AgentRun).count(),
        "totalPortfolioValue": total_portfolio_value,
        "message": "Admin overview loaded successfully.",
    }


def get_admin_users(db: Session):
    users = db.query(User).order_by(User.created_at.desc(), User.id.desc()).all()
    summaries = [user_to_summary(db, user) for user in users]

    return {
        "totalUsers": len(summaries),
        "users": summaries,
        "message": "Admin users loaded successfully.",
    }


def get_admin_user_detail(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {
            "user": None,
            "holdings": [],
            "transactions": [],
            "watchlist": [],
            "agentRuns": [],
            "message": "User not found.",
        }

    holdings = (
        db.query(Holding)
        .filter(Holding.user_id == user.id)
        .order_by(Holding.weight.desc(), Holding.id.asc())
        .all()
    )
    transactions = (
        db.query(PortfolioTransaction)
        .filter(PortfolioTransaction.user_id == user.id)
        .order_by(PortfolioTransaction.created_at.desc())
        .limit(20)
        .all()
    )
    watchlist = (
        db.query(WatchlistCompany)
        .filter(WatchlistCompany.user_id == user.id)
        .order_by(WatchlistCompany.id.asc())
        .all()
    )
    agent_runs = (
        db.query(AgentRun)
        .filter(AgentRun.user_id == user.id)
        .order_by(AgentRun.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "user": user_to_summary(db, user),
        "holdings": [holding_to_dict(holding) for holding in holdings],
        "transactions": [
            transaction_to_dict(transaction) for transaction in transactions
        ],
        "watchlist": [watchlist_company_to_dict(item) for item in watchlist],
        "agentRuns": [agent_run_to_dict(run) for run in agent_runs],
        "message": f"Read-only admin detail loaded for {user.email}.",
    }
