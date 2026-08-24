import asyncio
import time
from typing import List, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timezone, timedelta

from app.config import settings
from app.database import init_db, AsyncSessionLocal
from app.models import AuditLog
from app.schemas import (
    TelemetryTick,
    AlertEvent,
    AcknowledgeRequest,
    OverrideRequest,
    MuteRequest,
    CloudOutageToggle,
    SyntheticInjection
)
from app.services.resilience import resilience
from app.services.alarm_cascade import alarm_evaluator
from app.services.simulator import simulator
from app.ml.engine import ml_engine
from sqlalchemy import select, desc

security_bearer = HTTPBearer(auto_error=False)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = ConnectionManager()

# Background telemetry generator loop
async def background_telemetry_loop():
    print("[Gateway Background] Starting 10-bed telemetry loop...")
    while True:
        try:
            for i in range(1, 11):
                bed_id = f"bed-{i:02d}"
                tick_data = simulator.generate_tick(bed_id)
                tick = TelemetryTick(**tick_data)
                
                # Ingest telemetry
                await resilience.add_telemetry_tick(tick.model_dump())
                sliding_window = await resilience.get_sliding_window(bed_id)
                
                # Evaluate Alarm Cascade
                alert_event, should_alert_visually = alarm_evaluator.evaluate_telemetry(
                    tick.model_dump(), sliding_window
                )

                # Broadcast live telemetry state to dashboard
                signal_status = resilience.check_bed_signal_status(bed_id)
                
                ws_frame = {
                    "type": "TELEMETRY_UPDATE",
                    "bed_id": bed_id,
                    "signal_status": signal_status,
                    "tick": tick.model_dump(),
                    "alert": alert_event.model_dump() if should_alert_visually else None,
                    "tier": alert_event.tier,
                    "suppressed": not should_alert_visually,
                    "suppression_rate": resilience.suppression_rate_percentage,
                    "cloud_online": not resilience.cloud_outage_simulated,
                }
                await ws_manager.broadcast(ws_frame)

                # Log alert event to audit DB
                if should_alert_visually or alert_event.tier == 3:
                    event_type = f"TIER_{alert_event.tier}_ALERT" if should_alert_visually else "TIER_3_SUPPRESSED"
                    await resilience.log_audit_event(
                        bed_id=bed_id,
                        event_type=event_type,
                        tier=alert_event.tier,
                        confidence=alert_event.confidence,
                        reason=alert_event.reason,
                        drift_flag=alert_event.drift_flag
                    )

            await asyncio.sleep(0.5) # 500ms telemetry interval
        except Exception as e:
            print(f"[Telemetry Loop Error] {e}")
            await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await resilience.init_redis()
    telemetry_task = asyncio.create_task(background_telemetry_loop())
    yield
    # Shutdown
    telemetry_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.SCHEMA_VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth helper functions
def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Monitor API Key"
        )
    return x_api_key

def get_current_clinician(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)) -> str:
    if not credentials:
        # Fallback default for prototype demo if token header omitted
        return "clinician_nurse_johnson_rn"
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("sub", "clinician_nurse_johnson_rn")
    except Exception:
        return "clinician_nurse_johnson_rn"

# -------------------------------------------------------------------
# 1. Telemetry Ingestion Contract Endpoint
# -------------------------------------------------------------------
@app.post("/ingest/telemetry")
async def ingest_telemetry(
    tick: TelemetryTick,
    api_key: str = Depends(verify_api_key)
):
    await resilience.add_telemetry_tick(tick.model_dump())
    sliding_window = await resilience.get_sliding_window(tick.bed_id)
    
    alert_event, should_alert = alarm_evaluator.evaluate_telemetry(
        tick.model_dump(), sliding_window
    )

    if should_alert:
        await ws_manager.broadcast({
            "type": "ALERT_FRAME",
            "alert": alert_event.model_dump()
        })
        await resilience.log_audit_event(
            bed_id=tick.bed_id,
            event_type=f"TIER_{alert_event.tier}_ALERT",
            tier=alert_event.tier,
            confidence=alert_event.confidence,
            reason=alert_event.reason,
            drift_flag=alert_event.drift_flag
        )
    return {"status": "ok", "alert_evaluated": alert_event.tier}

# -------------------------------------------------------------------
# 2. WebSocket Push Endpoint
# -------------------------------------------------------------------
@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keepalive listener
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# -------------------------------------------------------------------
# 3. Clinician Action Endpoints
# -------------------------------------------------------------------
@app.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    req: AcknowledgeRequest,
    clinician_id: str = Depends(get_current_clinician)
):
    # Capture clinician_id server-side
    logged_clinician = clinician_id if clinician_id else (req.clinician_id or "nurse_johnson_rn")
    
    audit_entry = await resilience.log_audit_event(
        bed_id="SYSTEM",
        event_type="ACKNOWLEDGE",
        reason=f"Alert {alert_id[:8]} acknowledged by clinician",
        clinician_id=logged_clinician
    )
    
    await ws_manager.broadcast({
        "type": "ACTION_LOG",
        "action": "ACKNOWLEDGE",
        "alert_id": alert_id,
        "clinician_id": logged_clinician
    })
    return {"status": "acknowledged", "alert_id": alert_id, "clinician_id": logged_clinician}

@app.post("/alerts/{alert_id}/override")
async def override_alert(
    alert_id: str,
    req: OverrideRequest,
    clinician_id: str = Depends(get_current_clinician)
):
    logged_clinician = clinician_id if clinician_id else (req.clinician_id or "nurse_johnson_rn")
    
    audit_entry = await resilience.log_audit_event(
        bed_id="SYSTEM",
        event_type="OVERRIDE",
        tier=req.new_tier,
        reason=f"Manual override to Tier {req.new_tier}",
        clinician_id=logged_clinician,
        justification=req.justification
    )

    await ws_manager.broadcast({
        "type": "ACTION_LOG",
        "action": "OVERRIDE",
        "alert_id": alert_id,
        "new_tier": req.new_tier,
        "clinician_id": logged_clinician
    })
    return {"status": "overridden", "alert_id": alert_id, "new_tier": req.new_tier}

@app.post("/alerts/{alert_id}/mute")
async def mute_alert(
    alert_id: str,
    req: MuteRequest,
    clinician_id: str = Depends(get_current_clinician)
):
    logged_clinician = clinician_id if clinician_id else (req.clinician_id or "nurse_johnson_rn")
    
    # Server MUST clamp mute duration to 300s max regardless of client input
    clamped_duration = resilience.set_mute(alert_id, req.duration_s)

    audit_entry = await resilience.log_audit_event(
        bed_id=alert_id,
        event_type="MUTE",
        reason=f"Bed alert muted for {clamped_duration}s (server clamped)",
        clinician_id=logged_clinician,
        mute_duration_s=clamped_duration
    )

    await ws_manager.broadcast({
        "type": "ACTION_LOG",
        "action": "MUTE",
        "alert_id": alert_id,
        "duration_s": clamped_duration,
        "clinician_id": logged_clinician
    })
    return {"status": "muted", "alert_id": alert_id, "clamped_duration_s": clamped_duration}

# -------------------------------------------------------------------
# 4. Auth & Demo Injection Endpoints
# -------------------------------------------------------------------
@app.post("/api/auth/login")
async def login():
    payload = {
        "sub": "nurse_johnson_rn",
        "role": "ICU_CLINICIAN",
        "exp": datetime.now(timezone.utc) + timedelta(hours=8)
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "clinician_id": "nurse_johnson_rn"}

@app.post("/api/test/toggle-cloud-outage")
async def toggle_cloud_outage(toggle: CloudOutageToggle):
    resilience.cloud_outage_simulated = toggle.simulate_outage
    print(f"[Cloud Test] Cloud Outage Simulated = {toggle.simulate_outage}")
    await ws_manager.broadcast({
        "type": "CLOUD_STATUS_CHANGE",
        "online": not toggle.simulate_outage
    })
    return {"cloud_online": not toggle.simulate_outage}

@app.post("/api/test/inject")
async def inject_synthetic_event(injection: SyntheticInjection):
    simulator.inject_event(injection.bed_id, injection.event_type, injection.duration_ticks or 600)
    return {"status": "injected", "bed_id": injection.bed_id, "event_type": injection.event_type, "duration_ticks": injection.duration_ticks or 600}

@app.get("/api/audit/logs")
async def get_audit_logs():
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(AuditLog).order_by(desc(AuditLog.created_at)).limit(50)
            )
            logs = result.scalars().all()
            return [
                {
                    "id": l.id,
                    "bed_id": l.bed_id,
                    "event_type": l.event_type,
                    "tier": l.tier,
                    "confidence": l.confidence,
                    "reason": l.reason,
                    "drift_flag": l.drift_flag,
                    "clinician_id": l.clinician_id,
                    "justification": l.justification,
                    "mute_duration_s": l.mute_duration_s,
                    "model_version": l.model_version,
                    "ts": l.ts
                }
                for l in logs
            ]
    except Exception:
        # Return in-memory fallback buffer if DB is down
        return list(resilience.audit_buffer)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "redis_available": resilience.redis_available,
        "postgres_available": resilience.postgres_available,
        "cloud_online": not resilience.cloud_outage_simulated,
        "suppression_rate": resilience.suppression_rate_percentage
    }
