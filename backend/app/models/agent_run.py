from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, JSON, String, Text

from app.db.database import Base


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, index=True)

    question = Column(Text, nullable=False)
    ticker = Column(String, nullable=True)
    answer = Column(Text, nullable=False)

    workflow = Column(String, nullable=False)
    agents_used = Column(JSON, nullable=False)

    grounding_score = Column(Integer, nullable=False)
    unsupported_claims = Column(Integer, nullable=False)
    status = Column(Text, nullable=False)

    risk_drivers = Column(JSON, nullable=False)
    evidence = Column(JSON, nullable=False)
    suggested_actions = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)