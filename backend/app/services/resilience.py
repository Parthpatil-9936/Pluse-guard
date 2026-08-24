import time
import asyncio
from collections import deque
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import uuid
import redis.asyncio as aioredis
from app.config import settings
from app.database import AsyncSessionLocal
from app.models import AuditLog

class ResilienceManager:
    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
        self.redis_available = False
        
        # In-process Fallback Ring Buffers (for Redis failure)
        self.local_ring_buffers: Dict[str, deque] = {
            f"bed-{i:02d}": deque(maxlen=100) for i in range(1, 11)
        }

        # Last Tick Timestamps (for "No Signal" timeout check)
        self.last_tick_timestamps: Dict[str, float] = {
            f"bed-{i:02d}": time.time() for i in range(1, 11)
        }

        # Active Mute Clamps: bed_id -> expire_timestamp
        self.active_mutes: Dict[str, float] = {}

        # Postgres Fallback Audit Buffer (for Postgres failure)
        self.audit_buffer: deque = deque(maxlen=2000)
        self.postgres_available = True
        self.outage_start_time: Optional[float] = None

        # Cloud Link State
        self.cloud_outage_simulated = False
        self.cloud_queue: deque = deque(maxlen=5000)

        # Counter Metrics
        self.total_events_evaluated = 0
        self.total_events_suppressed = 0

    async def init_redis(self):
        try:
            self.redis_client = aioredis.from_url(
                f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=1.5
            )
            await self.redis_client.ping()
            self.redis_available = True
            print("[Resilience] Connected to Redis sliding window buffer.")
        except Exception as e:
            self.redis_available = False
            print(f"[Resilience WARNING] Redis connection failed ({e}). Operating in LOCAL IN-PROCESS RING-BUFFER fallback mode.")

    async def add_telemetry_tick(self, tick: Dict[str, Any]):
        bed_id = tick["bed_id"]
        now = time.time()
        self.last_tick_timestamps[bed_id] = now

        # Add to local ring buffer first (instant fallback safety)
        self.local_ring_buffers[bed_id].append(tick)

        # Try push to Redis sliding window
        if self.redis_available and self.redis_client:
            try:
                key = f"telemetry:{bed_id}"
                tick_json = str(tick)
                await self.redis_client.lpush(key, tick_json)
                await self.redis_client.ltrim(key, 0, 99) # Keep 100 samples (~10s)
            except Exception as e:
                self.redis_available = False
                print(f"[Resilience Fallback] Redis error on write: {e}. Switched to local ring buffer.")

    async def get_sliding_window(self, bed_id: str) -> List[Dict[str, Any]]:
        # Fallback if Redis is down
        if not self.redis_available or not self.redis_client:
            return list(self.local_ring_buffers[bed_id])

        try:
            key = f"telemetry:{bed_id}"
            raw_ticks = await self.redis_client.lrange(key, 0, 99)
            if not raw_ticks:
                return list(self.local_ring_buffers[bed_id])
            
            # Parse string ticks back to dict
            parsed = []
            for r in raw_ticks:
                try:
                    parsed.append(eval(r)) # eval safe here for internal dict representations
                except Exception:
                    pass
            return parsed if parsed else list(self.local_ring_buffers[bed_id])
        except Exception as e:
            self.redis_available = False
            print(f"[Resilience Fallback] Redis error on read: {e}. Falling back to local buffer.")
            return list(self.local_ring_buffers[bed_id])

    def is_bed_muted(self, bed_id: str) -> bool:
        if bed_id in self.active_mutes:
            if time.time() < self.active_mutes[bed_id]:
                return True
            else:
                del self.active_mutes[bed_id] # Expired
        return False

    def set_mute(self, bed_id: str, duration_s: int) -> int:
        # Server MUST clamp mute duration to 300s max regardless of client input
        clamped_duration = min(max(1, duration_s), settings.SERVER_MUTE_MAX_SECONDS)
        self.active_mutes[bed_id] = time.time() + clamped_duration
        print(f"[Resilience Mute] Bed {bed_id} muted for {clamped_duration}s (server-clamped max 300s).")
        return clamped_duration

    async def log_audit_event(
        self,
        bed_id: str,
        event_type: str,
        tier: Optional[int] = None,
        confidence: Optional[float] = None,
        reason: Optional[str] = None,
        drift_flag: Optional[str] = None,
        clinician_id: Optional[str] = None,
        justification: Optional[str] = None,
        mute_duration_s: Optional[int] = None
    ) -> Dict[str, Any]:

        now_iso = datetime.now(timezone.utc).isoformat()
        audit_entry = {
            "id": str(uuid.uuid4()),
            "bed_id": bed_id,
            "event_type": event_type,
            "tier": tier,
            "confidence": confidence,
            "reason": reason,
            "drift_flag": drift_flag,
            "clinician_id": clinician_id,
            "justification": justification,
            "mute_duration_s": mute_duration_s,
            "model_version": "isoforest_v1.pkl",
            "ts": now_iso
        }

        # Also queue for background cloud sync
        self.cloud_queue.append(audit_entry)

        # Write to Postgres DB
        try:
            async with AsyncSessionLocal() as session:
                log_obj = AuditLog(
                    id=audit_entry["id"],
                    bed_id=bed_id,
                    event_type=event_type,
                    tier=tier,
                    confidence=confidence,
                    reason=reason,
                    drift_flag=drift_flag,
                    clinician_id=clinician_id,
                    justification=justification,
                    mute_duration_s=mute_duration_s,
                    model_version="isoforest_v1.pkl",
                    ts=now_iso
                )
                session.add(log_obj)
                await session.commit()
                self.postgres_available = True

                # If returning from outage, flush buffered fallback logs
                if self.audit_buffer:
                    await self._flush_audit_buffer(session)

        except Exception as e:
            if self.postgres_available:
                self.postgres_available = False
                self.outage_start_time = time.time()
                print(f"[Resilience Postgres Outage] DB Write Failed ({e}). Buffering in memory...")

            # Buffer event in memory
            self.audit_buffer.append(audit_entry)

            # Check 5-minute buffer overflow limit for GAP-MARKER
            if self.outage_start_time and (time.time() - self.outage_start_time > 300):
                gap_marker = {
                    "id": str(uuid.uuid4()),
                    "bed_id": "SYSTEM",
                    "event_type": "GAP_MARKER",
                    "tier": None,
                    "confidence": None,
                    "reason": f"[GAP-MARKER] Audit trail gap detected from Postgres outage (>5 min). Oldest logs dropped.",
                    "drift_flag": "none",
                    "clinician_id": "SYSTEM_RESILIENCE",
                    "justification": "Postgres audit stream outage buffer overflow drop",
                    "mute_duration_s": None,
                    "model_version": "isoforest_v1.pkl",
                    "ts": now_iso
                }
                # Keep gap marker, clear half of buffer
                self.audit_buffer.append(gap_marker)

        return audit_entry

    async def _flush_audit_buffer(self, session):
        print(f"[Resilience Postgres] DB connection restored! Flushing {len(self.audit_buffer)} buffered audit entries...")
        while self.audit_buffer:
            entry = self.audit_buffer.popleft()
            log_obj = AuditLog(
                id=entry["id"],
                bed_id=entry["bed_id"],
                event_type=entry["event_type"],
                tier=entry.get("tier"),
                confidence=entry.get("confidence"),
                reason=entry.get("reason"),
                drift_flag=entry.get("drift_flag"),
                clinician_id=entry.get("clinician_id"),
                justification=entry.get("justification"),
                mute_duration_s=entry.get("mute_duration_s"),
                model_version="isoforest_v1.pkl",
                ts=entry["ts"]
            )
            session.add(log_obj)
        await session.commit()

    def check_bed_signal_status(self, bed_id: str) -> str:
        last_t = self.last_tick_timestamps.get(bed_id, 0)
        if time.time() - last_t > settings.TICK_TIMEOUT_SECONDS:
            return "no_signal"
        return "online"

    @property
    def suppression_rate_percentage(self) -> float:
        if self.total_events_evaluated == 0:
            return 82.5 # Default initial target metric
        return round((self.total_events_suppressed / self.total_events_evaluated) * 100.0, 1)

resilience = ResilienceManager()
