"""Configuration records, deliberately separate from executable committee jobs."""
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.dialects.postgresql import JSONB

from app.db.database import Base
from app.models.user import User  # Register the foreign-key target.


class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    status = Column(String(20), nullable=False, default="configured", server_default="configured")
    version = Column(String(30), nullable=False, default="simulation-v1")
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
    __table_args__ = (CheckConstraint("status = 'configured'", name="ck_simulation_configured"),)


class SimulationSnapshot(Base):
    __tablename__ = "simulation_snapshots"
    run_id = Column(String(36), ForeignKey("simulation_runs.id"), primary_key=True)
    captured_at = Column(DateTime(timezone=True), nullable=False)
    sha256 = Column(String(64), nullable=False)
    inputs = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
