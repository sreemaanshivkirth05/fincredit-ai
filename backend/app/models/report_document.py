from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, JSON, String, Text

from app.db.database import Base


class ReportDocument(Base):
    __tablename__ = "report_documents"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(String, nullable=False, index=True)
    agent_run_id = Column(Integer, nullable=False, index=True)

    ticker = Column(String, nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    risk_drivers = Column(JSON, nullable=False)
    evidence = Column(JSON, nullable=False)
    suggested_actions = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)