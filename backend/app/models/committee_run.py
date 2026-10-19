"""Versioned research snapshots. No committee operation can place trades."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, JSON, String, Text, Index, text
from app.db.database import Base


class CommitteeRun(Base):
    __tablename__ = "committee_runs"
    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    question = Column(Text, nullable=False)
    ticker = Column(String(20), nullable=True)
    status = Column(String(20), nullable=False, default="queued", index=True)
    version = Column(String(30), nullable=False, default="committee-v1")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    events = Column(JSON, nullable=False, default=list)
    snapshot = Column(JSON, nullable=False, default=dict)
    result = Column(JSON, nullable=False, default=dict)
    __table_args__ = (Index("uq_committee_active_user", "user_id", unique=True,
                           postgresql_where=text("status IN ('queued', 'running')")),)
