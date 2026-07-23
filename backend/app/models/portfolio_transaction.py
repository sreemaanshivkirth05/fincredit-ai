from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.db.database import Base


class PortfolioTransaction(Base):
    __tablename__ = "portfolio_transactions"

    id = Column(Integer, primary_key=True, index=True)

    ticker = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)
    action = Column(String, nullable=False)

    shares = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)

    realized_pl = Column(Float, nullable=True)
    realized_pl_percent = Column(Float, nullable=True)

    currency = Column(String, nullable=True)
    exchange = Column(String, nullable=True)

    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)
