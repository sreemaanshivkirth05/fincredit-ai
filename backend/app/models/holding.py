from sqlalchemy import Column, Float, Integer, String

from app.db.database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)
    shares = Column(Float, nullable=False)
    avg_price = Column(Float, nullable=False)
    value = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    sector = Column(String, nullable=False)
    risk = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    sentiment = Column(String, nullable=False)