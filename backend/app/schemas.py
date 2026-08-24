from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
from datetime import datetime

class TelemetryTick(BaseModel):
    bed_id: str = Field(..., pattern=r"^bed-(0[1-9]|10)$")
    ts: str
    hr: int = Field(..., ge=0, le=300)
    spo2: int = Field(..., ge=0, le=100)
    bp_sys: int = Field(..., ge=0, le=300)
    bp_dia: int = Field(..., ge=0, le=200)
    ecg_lead_ok: bool
    seq: int = Field(..., ge=0)

class AlertEvent(BaseModel):
    alert_id: str
    bed_id: str
    tier: Literal[1, 2, 3]
    confidence: float = Field(..., ge=0.0, le=1.0)
    reason: str
    drift_flag: Literal["none", "drift", "tamper"]
    schema_version: str = "1.0"
    ts: str
    vitals_snapshot: Optional[dict] = None

class AcknowledgeRequest(BaseModel):
    clinician_id: Optional[str] = None
    ts: Optional[str] = None

class OverrideRequest(BaseModel):
    clinician_id: Optional[str] = None
    ts: Optional[str] = None
    new_tier: Literal[1, 2, 3]
    justification: str

class MuteRequest(BaseModel):
    clinician_id: Optional[str] = None
    ts: Optional[str] = None
    duration_s: int = Field(300, ge=1)

class CloudOutageToggle(BaseModel):
    simulate_outage: bool

class SyntheticInjection(BaseModel):
    bed_id: str
    event_type: Literal["tier1_spo2", "tier1_asystole", "tier3_spike", "drift", "tamper", "normal", "clear"]
    duration_ticks: Optional[int] = 600
