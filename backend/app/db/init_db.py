from app.db.database import Base, engine
from app.models.agent_run import AgentRun
from app.models.audit_log import AuditLog
from app.models.company_profile import CompanyProfile
from app.models.holding import Holding
from app.models.market_snapshot import MarketSnapshot
from app.models.report import Report
from app.models.report_document import ReportDocument
from app.models.sec_fundamental import SecFundamental
from app.models.watchlist_company import WatchlistCompany


def init_db():
    print("Tables SQLAlchemy knows about:")
    print(Base.metadata.tables.keys())

    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables created successfully.")