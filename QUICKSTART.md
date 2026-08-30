# 🫀 PulseGuard-AI — Team Quickstart & Server Guide

Welcome to the **PulseGuard-AI** Clinical Alarm Management Platform. This guide is designed so you and your teammates can start, access, and demo the project with **1 click** on any machine.

---

## ⚡ 1-Click Quickstart

### 🪟 Windows (Recommended)
Simply **double-click** [`start.bat`](file:///d:/Pluse%20Guard/start.bat) in the project folder, or run:
```cmd
.\start.bat
```
*(Or in PowerShell: `.\start.ps1`)*

### 🐍 Any OS (Cross-Platform Python)
```bash
python run.py
```

### 🍎 macOS / 🐧 Linux
```bash
chmod +x start.sh
./start.sh
```

---

## 🌐 URLs & Access Points

Once started, the launcher outputs the local and network URLs:

| Service | URL | Purpose |
| :--- | :--- | :--- |
| **🖥️ ICU Dashboard** | [`http://localhost:3000`](http://localhost:3000) | Main React + 3D Three.js Clinical Dashboard |
| **📱 Teammate / Mobile LAN** | `http://<YOUR_IP>:3000` | Open from any phone, laptop, or tablet on the same WiFi |
| **⚡ FastAPI Gateway** | [`http://localhost:8000`](http://localhost:8000) | REST API & Ingestion Endpoint |
| **📖 Interactive API Docs** | [`http://localhost:8000/docs`](http://localhost:8000/docs) | Swagger UI for testing API endpoints |
| **🔌 WebSocket Stream** | `ws://localhost:8000/ws/alerts` | Live 500ms multi-bed telemetry & alert stream |

> [!TIP]
> **Connecting from another device on the same WiFi:**
> The terminal banner will automatically show your local IP (e.g. `http://192.168.1.10:3000`). Share this link with your teammates so they can view and interact with the live ICU ward from their own screens!

---

## 🛑 How to Stop or Free Ports

If you want to stop the servers:
- Press `Ctrl + C` in the terminal window where the server is running.
- **Or on Windows:** Double-click [`stop.bat`](file:///d:/Pluse%20Guard/stop.bat) to instantly terminate all servers and release ports `8000` and `3000`.
- **Or on Mac/Linux:** Run `./stop.sh`.

---

## 🛠️ Manual Start (Optional)

If you prefer to run the backend and frontend in separate terminal windows:

### Terminal 1: Backend (FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Frontend (Vite + React)
```bash
cd frontend
npm install   # (one-time)
npm run dev
```

---

## 🔧 Prerequisites

- **Python 3.10+** (Includes SQLite async engine fallback)
- **Node.js 18+** & **npm**

*(Docker & Postgres/Redis are optional; the app automatically runs in self-contained SQLite + in-process ring buffer mode when external services are not active).*
