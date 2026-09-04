# PulseGuard-AI

**Autonomous Edge-AI Zero-Trust Triage & Resilience Gateway for Critical Care IoT**

A 10-bed ICU monitoring prototype that filters out non-actionable alarm noise using multi-vital anomaly scoring, and keeps triaging safely even with **zero cloud connectivity**.

> ⚠️ **This is a Hackathon Prototype — Not a Final Product**  
> Built in 36 hours as a ~10% proof-of-concept slice of the full PulseGuard-AI vision, per hackathon scope rules. It exists to demonstrate the core architecture and alarm-tiering logic, not to ship as-is. Not a diagnostic device, not clinically validated, not tested with real patients, and not production-hardened.

---

## The Problem

- **72–99%** of ICU alarms are non-actionable false alarms (NIH/AACN).
- Alarm fatigue is on ECRI's **Top 10 Health Technology Hazards** list.
- Cloud-first monitoring platforms go dark during network outages or cyber incidents — exactly when reliability matters most.

## What This Prototype Demonstrates

- Ingests simulated ECG, SpO₂, and BP telemetry for 10 ICU beds.
- Routes every event through a **3-tier alarm cascade** so only real events reach a nurse.
- Live React dashboard with a false-alarm suppression counter.
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

<p align="center">
  <img src="Assets/Quiet-Dashboard.jpeg" alt="Quiet dashboard" width="70%">
  <img src="Assets/Tier-1.png" alt="Tier-1 alert firing" width="70%">
  <img src="Assets/Cloud.png" alt="Cloud outage mode" width="70%">
</p>

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Git**: To clone the repository.
- **Python 3.10 – 3.12 (Recommended: Python 3.11 or 3.12)**: Required for the FastAPI backend and scikit-learn ML models.
  > 💡 **Why Python 3.11/3.12?** Pre-compiled binary wheels are readily available on PyPI for all C-extensions (`asyncpg`, `scikit-learn`, `numpy`). Newer versions like Python 3.13 may attempt source compilation and require C++ build tools or PostgreSQL headers.
- **Node.js 18+ & npm**: Required to build and run the React/Vite frontend.
- **Docker & Docker Compose (Optional)**: If you plan to spin up the containerized stack with external PostgreSQL and Redis.

---

## Getting Started & Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Parthpatil-9936/Pulse-guard.git
cd Pulse-guard
```

### Step 2: Set Up Python Virtual Environment (Recommended)

Using a virtual environment with **Python 3.11 or 3.12** prevents version conflicts and avoids C-wheel build errors:

#### 🪟 Windows (Command Prompt or PowerShell)
```powershell
# Create venv using Python 3.11 or 3.12 (if multiple Python versions installed):
py -3.11 -m venv .venv
# (Or if 3.11 isn't specifically registered, use default python):
python -m venv .venv

# Activate the virtual environment:
.\.venv\Scripts\activate

# Install backend dependencies:
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

#### 🍎 macOS / 🐧 Linux
```bash
# Create venv using Python 3.11 or 3.12:
python3.11 -m venv .venv   # or python3.12 -m venv .venv

# Activate the virtual environment:
source .venv/bin/activate

# Install backend dependencies:
pip install --upgrade pip
pip install -r backend/requirements.txt
```

---

## Run Locally

### ⚡ 1-Click Unified Launch (Easiest & Recommended)

The automated launchers detect your virtual environment (`.venv`), check dependencies, free ports `8000` and `3000`, launch both backend and frontend, and open your browser automatically.

#### 🪟 Windows
Simply **double-click** `start.bat` or run:
```cmd
.\start.bat
```
*(Or in PowerShell: `.\start.ps1`)*

#### 🐍 Cross-Platform (Any OS)
```bash
python run.py
```

#### 🍎 macOS / 🐧 Linux
```bash
chmod +x start.sh
./start.sh
```

> **What the launcher handles automatically:**
> - Auto-detects and activates `.venv` or `venv` if present.
> - Checks Python and Node.js dependencies.
> - Automatically runs `npm install` on first launch.
> - Auto-cleans ports `8000` (FastAPI) and `3000` (Vite) to prevent port conflicts.
> - Discovers and displays your local WiFi/LAN IP for mobile & teammate testing.
> - Simultaneously starts both backend and frontend servers with unified color-coded logs.
> - Automatically opens **http://localhost:3000** in your default browser.

---

### 🛑 How to Stop Servers & Free Ports

- In terminal: Press `Ctrl + C`.
- On Windows: Double-click `stop.bat` to instantly terminate all servers and release ports `8000` and `3000`.
- On macOS/Linux: Run `./stop.sh`.

---

### 🛠️ Manual Terminal Run (Optional)

If you prefer running backend and frontend in separate terminal windows:

**Terminal 1: Backend (FastAPI)**
```bash
# Activate your virtual environment first (if created):
# Windows: .\.venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate

cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2: Frontend (Vite + React)**
```bash
cd frontend
npm install
npm run dev
```

---

### 🐳 Docker Compose (Optional)

To spin up the containerized stack (PostgreSQL, Redis, Gateway, Frontend):

```bash
docker-compose up --build -d
docker-compose ps
```

To stop all containers:
```bash
docker-compose down
```

---

## ❓ Troubleshooting & FAQs

### Q1: `Error: pg_config executable not found` or `Failed to build wheel for psycopg2-binary / asyncpg`
- **Cause**: This happens when running **Python 3.13+** on Windows without pre-compiled binary wheels on PyPI, or if an older commit still contains `psycopg2-binary` in `requirements.txt`.
- **Solution**:
  1. Make sure you ran `git pull` to fetch the updated `backend/requirements.txt` (PulseGuard uses `asyncpg` + `aiosqlite`; `psycopg2` is not required).
  2. Create a virtual environment using **Python 3.11** or **Python 3.12**:
     ```powershell
     py -3.11 -m venv .venv
     .\.venv\Scripts\activate
     python -m pip install --upgrade pip
     python -m pip install -r backend/requirements.txt
     ```

### Q2: Port 8000 or 3000 is already in use
- **Solution**: Run `stop.bat` (on Windows) or `./stop.sh` (on macOS/Linux). The scripts will search for and terminate any lingering processes bound to ports `8000` or `3000`.

### Q3: Do I need Docker, PostgreSQL, or Redis running?
- **Answer**: **No!** PulseGuard includes an automatic fallback to an in-process SQLite database (`aiosqlite`) and in-memory buffer. The backend will start and function completely standalone without external containers.

---

## Disclaimer

This repo is a **hackathon proof-of-concept**, not a finished or deployable product. It's meant to prove the edge-triage architecture works end-to-end — the full vision (see [Scope](#scope)) is intentionally out of reach for a 36-hour build.

## Team

**F_society** — Parth, Sarvesh, Wasim, Mayuresh, Nishant

## License

Hackathon evaluation build. License TBD.
