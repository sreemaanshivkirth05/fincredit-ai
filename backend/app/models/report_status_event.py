from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.db.database import Base


class ReportStatusEvent(Base):
    __tablename__ = "report_status_events"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(String, nullable=False, index=True)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    comment = Column(Text, nullable=True)

    changed_by = Column(String, nullable=False, default="analyst")
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)