# =====================================================================
# PulseGuard-AI - PowerShell Launcher
# =====================================================================
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🫀  PULSEGUARD-AI  |  PowerShell 1-Click Server Launcher" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 2. Check Node/NPM
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js / NPM is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 3. Check Frontend node_modules
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "[Setup] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

# 4. Launch unified python runner
python run.py
