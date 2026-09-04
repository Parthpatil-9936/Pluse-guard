#!/usr/bin/env bash
# =====================================================================
# PulseGuard-AI - macOS & Linux Launcher
# =====================================================================

set -e

# Change to script directory
cd "$(dirname "$0")"

echo "======================================================================"
echo "  🫀  PULSEGUARD-AI  |  1-Click Project & Server Launcher"
echo "======================================================================"
echo ""

# 1. Auto-activate Virtual Environment if present
if [ -d ".venv" ]; then
    echo "[Environment] Activating virtual environment (.venv)..."
    source .venv/bin/activate
elif [ -d "venv" ]; then
    echo "[Environment] Activating virtual environment (venv)..."
    source venv/bin/activate
fi

# 2. Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "[ERROR] Python could not be found. Please install Python 3.11 or 3.12."
    exit 1
fi

PY_BIN="python3"
if ! command -v python3 &> /dev/null; then
    PY_BIN="python"
fi

# 3. Check Node & NPM
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm could not be found. Please install Node.js."
    exit 1
fi

# 3. Check dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "[Setup] Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# 4. Start Unified Runner
python3 run.py
