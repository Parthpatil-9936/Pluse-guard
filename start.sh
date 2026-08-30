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

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.10+."
    exit 1
fi

# 2. Check Node & NPM
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
