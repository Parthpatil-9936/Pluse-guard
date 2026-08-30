@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   PULSEGUARD-AI - 1-Click Project and Server Launcher
echo ======================================================================
echo.

:: 1. Check Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python from https://www.python.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check Node / NPM
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js / NPM is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/2] Checking dependencies...
if not exist "frontend\node_modules" (
    echo [Setup] Installing frontend dependencies (one-time setup)...
    cd frontend
    call npm install
    cd ..
)

echo [2/2] Launching unified servers...
echo.
python run.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Info] Server stopped.
    pause
)
endlocal
