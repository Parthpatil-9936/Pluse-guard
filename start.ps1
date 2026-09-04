# =====================================================================
# PulseGuard-AI - PowerShell Launcher
# =====================================================================
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🫀  PULSEGUARD-AI  |  PowerShell 1-Click Server Launcher" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Auto-activate Virtual Environment if present
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "[Environment] Activating virtual environment (.venv)..." -ForegroundColor Cyan
    & ".venv\Scripts\Activate.ps1"
} elseif (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "[Environment] Activating virtual environment (venv)..." -ForegroundColor Cyan
    & "venv\Scripts\Activate.ps1"
}

# 2. Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Python 3.11 or 3.12 from https://www.python.org/" -ForegroundColor Yellow
    exit 1
}

# 3. Check Node/NPM
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js / NPM is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 4. Check Python backend dependencies
try {
    python -c "import fastapi, uvicorn, sqlalchemy, pydantic, aiosqlite" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[Setup] Installing missing Python backend dependencies..." -ForegroundColor Yellow
        python -m pip install --upgrade pip
        python -m pip install -r backend/requirements.txt
    }
} catch {
    Write-Host "[Setup] Installing backend dependencies..." -ForegroundColor Yellow
    python -m pip install --upgrade pip
    python -m pip install -r backend/requirements.txt
}

# 4. Check Frontend node_modules
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "[Setup] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

# 5. Launch unified python runner
python run.py
