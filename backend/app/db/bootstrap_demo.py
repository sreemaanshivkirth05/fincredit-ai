"""Initialize the local Docker demo without resetting existing portfolios."""
from app.core.config import settings
from app.db.database import SessionLocal
from app.db.init_db import init_db
from app.db.phase_40l_auth_migration import run_migration
from app.db.phase_43_research_migration import run_migration as migrate_research
from app.models.holding import Holding
from app.models.portfolio_transaction import PortfolioTransaction  # Register table before create_all.
from app.models.user import User
from app.models.watchlist_company import WatchlistCompany
from app.services.demo_service import reset_demo_data


def bootstrap_demo():
    if settings.APP_ENV != "development":
        raise RuntimeError("Demo bootstrap is only supported in development.")
    init_db()
    run_migration()
    migrate_research()
    with SessionLocal() as db:
        demo = db.query(User).filter(User.email == settings.DEMO_USER_EMAIL).one()
        # Seed only a new demo account with no portfolio/trading activity.
        has_holdings = db.query(Holding).filter(Holding.user_id == demo.id).first()
        has_transactions = db.query(PortfolioTransaction).filter(PortfolioTransaction.user_id == demo.id).first()
        has_watchlist = db.query(WatchlistCompany).filter(WatchlistCompany.user_id == demo.id).first()
        if not has_holdings and not has_transactions and not has_watchlist:
            reset_demo_data(db, demo.id)
    print("FinCredit local demo is ready.")


if __name__ == "__main__":
    bootstrap_demo()
