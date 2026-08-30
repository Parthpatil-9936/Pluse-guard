#!/usr/bin/env bash
# =====================================================================
# PulseGuard-AI - macOS & Linux Server & Port Cleaner
# =====================================================================

echo "Stopping PulseGuard servers on ports 8000 and 3000..."

# Free Port 8000
PIDS_8000=$(lsof -ti:8000 2>/dev/null || true)
if [ -n "$PIDS_8000" ]; then
    echo "Terminating PID(s) on port 8000: $PIDS_8000"
    kill -9 $PIDS_8000 2>/dev/null || true
fi

# Free Port 3000
PIDS_3000=$(lsof -ti:3000 2>/dev/null || true)
if [ -n "$PIDS_3000" ]; then
    echo "Terminating PID(s) on port 3000: $PIDS_3000"
    kill -9 $PIDS_3000 2>/dev/null || true
fi

echo "[SUCCESS] Ports 8000 and 3000 freed. All servers stopped."
