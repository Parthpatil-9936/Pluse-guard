@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   PULSEGUARD-AI - Stopping Servers and Freeing Ports
echo ======================================================================
echo.

echo Freeing Port 8000 (FastAPI Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Terminating PID %%a on port 8000...
    taskkill /F /PID %%a >nul 2>&1
)

echo Freeing Port 3000 (Vite Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Terminating PID %%a on port 3000...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [SUCCESS] Ports 8000 and 3000 have been freed.
echo All PulseGuard servers are stopped.
echo.
endlocal
