from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from datetime import datetime, timezone
import uuid
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bed_id = Column(String, index=True, nullable=False)
    event_type = Column(String, index=True, nullable=False) # ALERT, ACKNOWLEDGE, OVERRIDE, MUTE, GAP_MARKER
    tier = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=True)
    reason = Column(String, nullable=True)
    drift_flag = Column(String, nullable=True)
    clinician_id = Column(String, nullable=True)
    justification = Column(Text, nullable=True)
    mute_duration_s = Column(Integer, nullable=True)
    model_version = Column(String, default="isoforest_v1.pkl")
    ts = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
