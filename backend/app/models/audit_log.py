from sqlalchemy import Column, Integer, String, Text

from app.db.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    time = Column(String, nullable=False)
    event = Column(String, nullable=False)
    detail = Column(Text, nullable=False)
    severity = Column(String, nullable=False)