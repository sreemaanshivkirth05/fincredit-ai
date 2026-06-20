from app.db.database import Base, engine
from app.models.holding import Holding
from app.models.watchlist_company import WatchlistCompany
from app.models.report import Report
from app.models.company_profile import CompanyProfile
from app.models.audit_log import AuditLog
from app.models.market_snapshot import MarketSnapshot


def init_db():
    print("Tables SQLAlchemy knows about:")
    print(Base.metadata.tables.keys())

    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables created successfully.")