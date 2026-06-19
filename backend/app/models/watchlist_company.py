from sqlalchemy import Column, Integer, String

from app.db.database import Base


class WatchlistCompany(Base):
    __tablename__ = "watchlist_companies"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    risk = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False)
    sentiment = Column(String, nullable=False)
    filing = Column(String, nullable=False)
    status = Column(String, nullable=False)