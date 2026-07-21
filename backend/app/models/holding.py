from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.db.database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)

    ticker = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)

    shares = Column(Float, nullable=False)
    avg_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=True)

    total_cost = Column(Float, nullable=True)
    value = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)

    unrealized_pl = Column(Float, nullable=True)
    unrealized_pl_percent = Column(Float, nullable=True)

    sector = Column(String, nullable=False)
    risk = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    sentiment = Column(String, nullable=False)

    currency = Column(String, nullable=True)
    exchange = Column(String, nullable=True)

    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=True,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )