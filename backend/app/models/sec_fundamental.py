from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, Integer, String

from app.db.database import Base


class SecFundamental(Base):
    __tablename__ = "sec_fundamentals"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    cik = Column(String, nullable=False, index=True)
    company_name = Column(String, nullable=False)

    revenue = Column(BigInteger, nullable=True)
    net_income = Column(BigInteger, nullable=True)
    assets = Column(BigInteger, nullable=True)
    liabilities = Column(BigInteger, nullable=True)
    equity = Column(BigInteger, nullable=True)

    fiscal_year = Column(Integer, nullable=True)
    form = Column(String, nullable=True)
    filed = Column(String, nullable=True)
    source = Column(String, nullable=False, default="SEC Company Facts API")

    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)