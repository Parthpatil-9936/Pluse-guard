import pytest
import asyncio
import time
from app.schemas import TelemetryTick, AlertEvent, MuteRequest
from app.services.alarm_cascade import alarm_evaluator
from app.services.resilience import resilience
from app.ml.engine import ml_engine

def test_telemetry_schema_validation():
    # Valid tick
    valid_data = {
        "bed_id": "bed-01",
        "ts": "2026-08-24T15:00:00.000Z",
        "hr": 75,
        "spo2": 98,
        "bp_sys": 120,
        "bp_dia": 80,
        "ecg_lead_ok": True,
        "seq": 101
    }
    tick = TelemetryTick(**valid_data)
    assert tick.bed_id == "bed-01"
    assert tick.spo2 == 98

    # Invalid bed_id format
    with pytest.raises(Exception):
        TelemetryTick(**{**valid_data, "bed_id": "invalid-bed-999"})

    # Out of range SpO2
    with pytest.raises(Exception):
        TelemetryTick(**{**valid_data, "spo2": 150})

def test_hard_threshold_safety_rule():
    # SpO2 forced < 85% must trigger Tier 1 catastrophic alert regardless of ML score
    low_spo2_tick = {
        "bed_id": "bed-02",
        "ts": "2026-08-24T15:00:00.000Z",
        "hr": 72,
        "spo2": 82, # Critical breach < 85
        "bp_sys": 120,
        "bp_dia": 80,
        "ecg_lead_ok": True,
        "seq": 102
    }
    sliding_window = [low_spo2_tick] * 5

    alert_event, should_alert = alarm_evaluator.evaluate_telemetry(low_spo2_tick, sliding_window)

    # SAFETY INVARIANT CHECK: Hard threshold breach MUST yield Tier 1
    assert alert_event.tier == 1
    assert should_alert is True
    assert alert_event.confidence == 1.0
    assert "HYPOXIA" in alert_event.reason

def test_mute_duration_server_clamp():
    # Client requests 1000s mute, server MUST clamp to 300s max
    requested_duration = 1000
    clamped = resilience.set_mute("bed-03", requested_duration)
    assert clamped == 300
    assert resilience.is_bed_muted("bed-03") is True

def test_tier3_transient_spike_suppression():
    # Transient single-vital spike should yield Tier 3 and NOT raise visual alarm
    spike_tick = {
        "bed_id": "bed-04",
        "ts": "2026-08-24T15:00:00.000Z",
        "hr": 88, # Transient slight bump
        "spo2": 97,
        "bp_sys": 122,
        "bp_dia": 81,
        "ecg_lead_ok": True,
        "seq": 104
    }
    sliding_window = [spike_tick] * 5

    alert_event, should_alert = alarm_evaluator.evaluate_telemetry(spike_tick, sliding_window)
    assert alert_event.tier == 3
    assert should_alert is False # Suppressed from 10-bed visual alarm grid

def test_redis_fallback_ring_buffer():
    resilience.redis_available = False # Simulate Redis outage
    tick_data = {
        "bed_id": "bed-05",
        "ts": "2026-08-24T15:00:00.000Z",
        "hr": 70,
        "spo2": 99,
        "bp_sys": 118,
        "bp_dia": 78,
        "ecg_lead_ok": True,
        "seq": 105
    }
    asyncio.run(resilience.add_telemetry_tick(tick_data))
    window = asyncio.run(resilience.get_sliding_window("bed-05"))
    assert len(window) > 0
    assert window[-1]["bed_id"] == "bed-05"
