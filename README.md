# PulseGuard-AI

**Autonomous Edge-AI Zero-Trust Triage & Resilience Gateway for Critical Care IoT**

A 10-bed ICU monitoring prototype that filters out non-actionable alarm noise using multi-vital anomaly scoring, and keeps triaging safely even with **zero cloud connectivity**.

> ⚠️ **Hackathon Prototype Notice**
> Built in 36 hours as a ~10% proof-of-concept slice of the full PulseGuard-AI vision, per hackathon scope rules. Not a diagnostic device, not clinically validated, not for real patient use.

---

## The Problem

- **72–99%** of ICU alarms are non-actionable false alarms (NIH/AACN).
- Alarm fatigue is on ECRI's **Top 10 Health Technology Hazards** list.
- Cloud-first monitoring platforms go dark during network outages or cyber incidents — exactly when reliability matters most.

## What It Does

- Ingests simulated ECG, SpO₂, and BP telemetry for 10 ICU beds.
- Filters noise and scores anomalies locally (Redis sliding window + Isolation Forest, `<5ms`).
- Routes every event through a **3-tier alarm cascade** so only real events reach a nurse.
- Live React dashboard with a false-alarm suppression counter.
- Immutable PostgreSQL audit trail for every alert, override, and mute.
- **100% of the alarm path runs on local edge hardware** — cloud is used only for async reporting.

## Scope

**In scope:** real-time triage for 10 simulated beds, hard-threshold + ML alarm cascade, fully local alarm path, dashboard, audit trail.

**Out of scope:** FDA/IEC 62304 clearance, real patient data (all telemetry is synthetic), production auth/SSO, multi-ward scaling, a clinically-validated model. The edge gateway is a known single point of failure — acknowledged, not solved (Phase 2).

## Architecture

```
ICU Monitors (sim) --MQTT/JSON--> Edge Gateway (FastAPI) --WebSocket--> React Dashboard
                                        |-- Redis (sliding window)
                                        |-- PostgreSQL (audit log)
                                        \-- Cloud sync (async, non-blocking)
```

**Stack:** FastAPI · Redis 7.x · scikit-learn (Isolation Forest) · React + Chart.js · PostgreSQL · Docker Compose

## Alarm Cascade

| Tier | Trigger | Action |
|---|---|---|
| 1 — Critical | Hard threshold (SpO₂ < 85%) **OR** ML > 0.9 | Unsuppressable siren |
| 2 — Warning | 2+ vitals drifting, ML 0.5–0.9 | Nurse escalation |
| 3 — Transient | Single brief spike, ML < 0.5 | Suppressed, logged only |

Hard thresholds and ML run in parallel and are **OR'd** — the model can never suppress a hard-threshold breach.

## Demo Preview

> 📸 *Screenshots / demo GIF go here*

![Quiet dashboard](docs/screenshots/dashboard-quiet.png)
![Tier-1 alert firing](docs/screenshots/tier1-alert.png)
![Cloud outage mode](docs/screenshots/cloud-outage.png)

## Run Locally

```bash
git clone https://github.com/<your-org>/pulseguard-ai.git
cd pulseguard-ai
cp .env.example .env
docker-compose up --build
```

Then check all containers are healthy:

```bash
docker-compose ps
```

Open the dashboard at **http://localhost:3000**, inject a test event from the simulator, and try the **"Simulate Cloud Outage"** button.

```bash
docker-compose down
```

> Ports/commands may need adjusting to match the final repo scripts.

## Acceptance Checklist

- [ ] All 4 containers healthy with no manual intervention
- [ ] Tier-1 event alarms within 5s, unsuppressable
- [ ] Tier-3 event stays silent but logs to audit feed
- [ ] Suppression counter reads >75% after a 5-min run
- [ ] Cloud outage simulation → zero change in alarm behavior
- [ ] Killing Redis/Postgres mid-run doesn't break the alarm path

## Team

**F_society** — Parth, Sarvesh, Wasim, Mayuresh, Nishant

## License

Hackathon evaluation build. License TBD.
