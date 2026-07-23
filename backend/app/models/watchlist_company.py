from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, Float, Integer, String

from app.db.database import Base


class WatchlistCompany(Base):
    __tablename__ = "watchlist_companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)

    ticker = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)
    sector = Column(String, nullable=False)

    risk = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False)
    sentiment = Column(String, nullable=False)
    filing = Column(String, nullable=False)
    status = Column(String, nullable=False)

    current_price = Column(Float, nullable=True)
    previous_close = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)
    volume = Column(BigInteger, nullable=True)
    currency = Column(String, nullable=True)
    exchange = Column(String, nullable=True)

    added_at = Column(DateTime, nullable=True, default=datetime.utcnow)
