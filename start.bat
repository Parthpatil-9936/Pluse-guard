@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   PULSEGUARD-AI - 1-Click Project and Server Launcher
echo ======================================================================
echo.

:: 1. Auto-activate Virtual Environment if present
if exist ".venv\Scripts\activate.bat" (
    echo [Environment] Activating virtual environment (.venv)...
    call .venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    echo [Environment] Activating virtual environment (venv)...
    call venv\Scripts\activate.bat
)

:: 2. Check Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python 3.11 or 3.12 from https://www.python.org/
    echo.
    pause
    exit /b 1
)

:: 3. Check Node / NPM
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js / NPM is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking Python dependencies...
python -c "import fastapi, uvicorn, sqlalchemy, pydantic, aiosqlite" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [Setup] Installing missing Python backend dependencies...
    python -m pip install --upgrade pip
    python -m pip install -r backend\requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install backend dependencies.
        echo If you are using Python 3.13+, use Python 3.11 or 3.12 in a venv:
        echo   py -3.11 -m venv .venv
        echo   .\.venv\Scripts\activate
        echo   pip install -r backend\requirements.txt
        echo.
        pause
        exit /b 1
    )
)

echo [2/3] Checking Frontend dependencies...
if not exist "frontend\node_modules" (
    echo [Setup] Installing frontend dependencies (one-time setup)...
    cd frontend
    call npm install
    cd ..
)

echo [3/3] Launching unified servers...
echo.
python run.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Info] Server stopped with exit code %ERRORLEVEL%.
    pause
)
endlocal
