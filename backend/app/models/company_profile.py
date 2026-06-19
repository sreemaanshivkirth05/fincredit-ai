from sqlalchemy import Column, Integer, String, Text, JSON

from app.db.database import Base


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, unique=True, index=True)
    company = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    risk = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False)
    sentiment = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    market_cap = Column(String, nullable=False)
    revenue = Column(String, nullable=False)
    debt_to_equity = Column(String, nullable=False)
    profit_margin = Column(String, nullable=False)
    grounding_score = Column(Integer, nullable=False)
    unsupported_claims = Column(Integer, nullable=False)

    risk_trend = Column(JSON, nullable=False)
    red_flags = Column(JSON, nullable=False)
    filing_signals = Column(JSON, nullable=False)
    peer_benchmark = Column(JSON, nullable=False)
    evidence = Column(JSON, nullable=False)