import asyncio
import time
import random
import numpy as np
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import httpx
from app.config import settings

class TelemetrySimulator:
    def __init__(self):
        self.is_running = False
        self.seq_counters: Dict[str, int] = {f"bed-{i:02d}": 1 for i in range(1, 11)}
        
        # Bed Baselines (Mean HR, SpO2, BP)
        self.bed_baselines: Dict[str, Dict[str, float]] = {
            f"bed-{i:02d}": {
                "hr": random.uniform(68, 78),
                "spo2": random.uniform(97.5, 99.0),
                "bp_sys": random.uniform(115, 125),
                "bp_dia": random.uniform(75, 82),
            } for i in range(1, 11)
        }

        # Active Injected Anomaly Events
        self.injected_overrides: Dict[str, Optional[Dict[str, Any]]] = {}

    def inject_event(self, bed_id: str, event_type: str, duration_ticks: int = 600):
        if event_type in ("normal", "clear", "reset"):
            self.injected_overrides[bed_id] = None
            print(f"[Simulator Inject] Cleared anomaly on {bed_id}")
            return
        self.injected_overrides[bed_id] = {
            "type": event_type,
            "duration_ticks": duration_ticks
        }
        print(f"[Simulator Inject] Injected '{event_type}' anomaly on {bed_id} (duration: {duration_ticks} ticks)")

    def generate_tick(self, bed_id: str) -> Dict[str, Any]:
        base = self.bed_baselines[bed_id]
        seq = self.seq_counters[bed_id]
        self.seq_counters[bed_id] += 1

        # Check for active injected override
        override = self.injected_overrides.get(bed_id)
        
        hr = int(base["hr"] + np.random.normal(0, 1.2))
        spo2 = int(base["spo2"] + np.random.normal(0, 0.4))
        bp_sys = int(base["bp_sys"] + np.random.normal(0, 2.0))
        bp_dia = int(base["bp_dia"] + np.random.normal(0, 1.5))
        ecg_ok = True

        if override and override["duration_ticks"] > 0:
            override["duration_ticks"] -= 1
            ev_type = override["type"]

            if ev_type == "tier1_spo2":
                spo2 = random.randint(72, 83) # Hard breach < 85%
                hr = int(hr * 1.25) # Reactive tachycardia
            elif ev_type == "tier1_asystole":
                hr = random.randint(0, 18) # Hard breach asystole < 20 bpm
                spo2 = random.randint(80, 88)
            elif ev_type == "tier3_spike":
                hr = int(hr + random.randint(25, 40)) # Brief transient spike
                spo2 = int(base["spo2"]) # SpO2 stays normal (single vital)
            elif ev_type == "drift":
                hr = int(hr + 35) # Multi-vital drift together
                spo2 = int(spo2 - 7)
                bp_sys = int(bp_sys + 25)
            elif ev_type == "tamper":
                ecg_ok = False
                hr = 280 # Impossible electrode jump

            if override["duration_ticks"] <= 0:
                self.injected_overrides[bed_id] = None

        # Clamp physiological bounds
        hr = max(0, min(300, hr))
        spo2 = max(0, min(100, spo2))
        bp_sys = max(40, min(260, bp_sys))
        bp_dia = max(20, min(160, bp_dia))

        now_iso = datetime.now(timezone.utc).isoformat()

        return {
            "bed_id": bed_id,
            "ts": now_iso,
            "hr": hr,
            "spo2": spo2,
            "bp_sys": bp_sys,
            "bp_dia": bp_dia,
            "ecg_lead_ok": ecg_ok,
            "seq": seq
        }

simulator = TelemetrySimulator()
