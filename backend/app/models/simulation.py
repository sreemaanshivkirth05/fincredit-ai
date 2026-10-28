"""Persistent, user-owned simulation configuration and execution records."""
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, CheckConstraint, Column, DateTime, ForeignKey, Index, Integer,
    JSON, String, Text, UniqueConstraint, text,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.db.database import Base
from app.models.user import User  # Register the foreign-key target.


class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    status = Column(String(20), nullable=False, default="configured", server_default="configured", index=True)
    version = Column(String(30), nullable=False, default="simulation-v2")
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    cancel_requested = Column(Boolean, nullable=False, default=False, server_default="false")
    model_calls = Column(Integer, nullable=False, default=0, server_default="0")
    result = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False,
                    default=dict, server_default="{}")
    __table_args__ = (
        CheckConstraint(
            "status IN ('configured','queued','running','completed','cancelled','failed')",
            name="ck_simulation_status",
        ),
        CheckConstraint("model_calls >= 0", name="ck_simulation_model_calls"),
        Index("uq_simulation_active_user", "user_id", unique=True,
              postgresql_where=text("status IN ('queued', 'running')"),
              sqlite_where=text("status IN ('queued', 'running')")),
    )


class SimulationSnapshot(Base):
    __tablename__ = "simulation_snapshots"
    run_id = Column(String(36), ForeignKey("simulation_runs.id"), primary_key=True)
    captured_at = Column(DateTime(timezone=True), nullable=False)
    sha256 = Column(String(64), nullable=False)
    inputs = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)


class SimulationAgent(Base):
    __tablename__ = "simulation_agents"
    id = Column(String(36), primary_key=True)
    run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"),
                    nullable=False, index=True)
    agent_type = Column(String(40), nullable=False)
    ordinal = Column(Integer, nullable=False)
    prompt_version = Column(String(30), nullable=False, default="simulation-agent-v1")
    status = Column(String(20), nullable=False, default="pending")
    model_calls = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
    __table_args__ = (
        UniqueConstraint("run_id", "agent_type", name="uq_simulation_agent_type"),
        UniqueConstraint("run_id", "ordinal", name="uq_simulation_agent_ordinal"),
        CheckConstraint("status IN ('pending','running','completed','failed','cancelled')",
                        name="ck_simulation_agent_status"),
        CheckConstraint("model_calls >= 0", name="ck_simulation_agent_calls"),
    )


class SimulationRound(Base):
    __tablename__ = "simulation_rounds"
    id = Column(String(36), primary_key=True)
    run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"),
                    nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="running")
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    checkpoint = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False,
                        default=dict, server_default="{}")
    __table_args__ = (
        UniqueConstraint("run_id", "round_number", name="uq_simulation_round_number"),
        CheckConstraint("round_number > 0", name="ck_simulation_round_number"),
        CheckConstraint("status IN ('running','completed','failed','cancelled')",
                        name="ck_simulation_round_status"),
    )


class SimulationAction(Base):
    __tablename__ = "simulation_actions"
    id = Column(String(36), primary_key=True)
    run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"),
                    nullable=False, index=True)
    round_id = Column(String(36), ForeignKey("simulation_rounds.id", ondelete="CASCADE"),
                      nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("simulation_agents.id", ondelete="CASCADE"),
                      nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    action = Column(String(10), nullable=False)
    ticker = Column(String(20), nullable=True)
    allocation_intent_pct = Column(Integer, nullable=False, default=0)
    confidence = Column(Integer, nullable=False)
    rationale = Column(Text, nullable=False)
    evidence_ids = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    uncertainties = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    provider = Column(String(20), nullable=False)
    model = Column(String(200), nullable=False)
    truncation_notice = Column(String(250), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
    __table_args__ = (
        UniqueConstraint("round_id", "agent_id", name="uq_simulation_round_agent"),
        CheckConstraint("action IN ('BUY','SELL','HOLD','ABSTAIN')",
                        name="ck_simulation_action"),
        CheckConstraint("allocation_intent_pct BETWEEN -100 AND 100",
                        name="ck_simulation_allocation"),
        CheckConstraint("confidence BETWEEN 0 AND 100", name="ck_simulation_confidence"),
    )


class SimulationMemory(Base):
    __tablename__ = "simulation_memories"
    id = Column(String(36), primary_key=True)
    run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"),
                    nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("simulation_agents.id", ondelete="CASCADE"),
                      nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
    __table_args__ = (
        UniqueConstraint("agent_id", "round_number", name="uq_simulation_memory_round"),
    )


class SimulationAuditEvent(Base):
    __tablename__ = "simulation_audit_events"
    id = Column(String(36), primary_key=True)
    run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"),
                    nullable=False, index=True)
    sequence = Column(Integer, nullable=False)
    event_type = Column(String(50), nullable=False)
    payload = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False,
                     default=dict, server_default="{}")
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
    __table_args__ = (
        UniqueConstraint("run_id", "sequence", name="uq_simulation_event_sequence"),
        CheckConstraint("sequence > 0", name="ck_simulation_event_sequence"),
    )
