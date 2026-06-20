from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, BigInteger

from app.db.database import Base


class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    company_name = Column(String, nullable=False)
    sector = Column(String, nullable=True)
    current_price = Column(Float, nullable=True)
    previous_close = Column(Float, nullable=True)
    day_high = Column(Float, nullable=True)
    day_low = Column(Float, nullable=True)
    volume = Column(BigInteger, nullable=True)
    market_cap = Column(BigInteger, nullable=True)
    currency = Column(String, nullable=True)
    exchange = Column(String, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)