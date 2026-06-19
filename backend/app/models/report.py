from sqlalchemy import Column, Integer, String

from app.db.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, nullable=False, unique=True, index=True)
    company = Column(String, nullable=False)
    ticker = Column(String, nullable=False, index=True)
    report_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    grounding = Column(Integer, nullable=False)
    unsupported = Column(Integer, nullable=False)
    model = Column(String, nullable=False)
    created = Column(String, nullable=False)