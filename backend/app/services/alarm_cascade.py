import uuid
from typing import Dict, Any, Tuple
from datetime import datetime, timezone
from app.config import settings
from app.ml.engine import ml_engine
from app.services.resilience import resilience
from app.schemas import AlertEvent

class AlarmCascadeEvaluator:
    def evaluate_telemetry(self, tick: Dict[str, Any], sliding_window: list) -> Tuple[AlertEvent, bool]:
        bed_id = tick["bed_id"]
        resilience.total_events_evaluated += 1

        # 1. Evaluate Rule-based Hard Safety Net Thresholds (INDEPENDENT PARALLEL PATH)
        is_hard_breach = False
        hard_reason = ""

        spo2 = tick["spo2"]
        hr = tick["hr"]
        ecg_ok = tick.get("ecg_lead_ok", True)

        if spo2 < settings.SPO2_CRITICAL_MIN:
            is_hard_breach = True
            hard_reason = f"CRITICAL HYPOXIA: SpO2 {spo2}% < {settings.SPO2_CRITICAL_MIN}%"
        elif hr < settings.HR_CRITICAL_MIN:
            is_hard_breach = True
            hard_reason = f"ASYSTOLE / SEVERE BRADYCARDIAC ARREST: HR {hr} bpm"
        elif hr > settings.HR_CRITICAL_MAX:
            is_hard_breach = True
            hard_reason = f"VENTRICULAR TACHYCARDIA: HR {hr} bpm"

        # 2. Evaluate ML Isolation Forest Scoring
        ml_confidence, ml_reason, drift_flag, summary = ml_engine.score(bed_id, sliding_window)

        # 3. Apply OR'd 3-Tier Cascade Classification
        # Hard threshold breach ALWAYS forces Tier 1 regardless of ML score!
        if is_hard_breach or ml_confidence >= 0.90:
            tier = 1
            reason = hard_reason if is_hard_breach else ml_reason
            confidence = 1.0 if is_hard_breach else ml_confidence
        elif ml_confidence >= 0.50:
            tier = 2
            reason = ml_reason
            confidence = ml_confidence
        else:
            tier = 3
            reason = ml_reason
            confidence = ml_confidence

        # Check if bed is currently muted (Tier 1 can NEVER be muted, Tier 2/3 respect mute)
        is_muted = resilience.is_bed_muted(bed_id)
        if is_muted and tier > 1:
            # Treat muted Tier 2/3 as suppressed
            resilience.total_events_suppressed += 1
            should_alert_visually = False
        elif tier == 3:
            # Tier 3 transient spikes are logged to Postgres but generate NO visual alarm
            resilience.total_events_suppressed += 1
            should_alert_visually = False
        else:
            # Tier 1 & Tier 2 generate visual alerts
            should_alert_visually = True

        now_iso = datetime.now(timezone.utc).isoformat()
        alert_id = str(uuid.uuid4())

        alert_event = AlertEvent(
            alert_id=alert_id,
            bed_id=bed_id,
            tier=tier, # 1, 2, or 3
            confidence=round(confidence, 2),
            reason=reason,
            drift_flag=drift_flag,
            schema_version=settings.SCHEMA_VERSION,
            ts=now_iso,
            vitals_snapshot={
                "hr": hr,
                "spo2": spo2,
                "bp_sys": tick["bp_sys"],
                "bp_dia": tick["bp_dia"],
                "ecg_lead_ok": ecg_ok,
                "seq": tick["seq"]
            }
        )

        return alert_event, should_alert_visually

alarm_evaluator = AlarmCascadeEvaluator()
