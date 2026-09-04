#!/usr/bin/env python3
"""
===================================================================
PulseGuard-AI - Unified Project Launcher
===================================================================
Cross-platform runner for starting both the FastAPI Backend & Vite Frontend.
Usage:
    python run.py
===================================================================
"""

import os
import sys
import time
import socket
import signal
import subprocess
import threading
import webbrowser
from pathlib import Path

# Configure utf-8 stdout/stderr on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

BACKEND_PORT = 8000
FRONTEND_PORT = 3000

# ANSI Colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"

processes = []

def get_lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def print_banner():
    local_ip = get_lan_ip()
    banner = f"""
{CYAN}{BOLD}======================================================================
  [+]  PULSEGUARD-AI  |  Edge Clinical Alarm Management Platform
======================================================================{RESET}
  {GREEN}● Local Dashboard:{RESET}   http://localhost:{FRONTEND_PORT}
  {GREEN}● Network Access:{RESET}    http://{local_ip}:{FRONTEND_PORT}  (For teammates on same WiFi)
  {GREEN}● Backend API:{RESET}       http://localhost:{BACKEND_PORT}
  {GREEN}● Interactive Docs:{RESET}  http://localhost:{BACKEND_PORT}/docs
{CYAN}======================================================================{RESET}
  {YELLOW}Press Ctrl+C at any time to cleanly stop all servers.{RESET}
"""
    try:
        print(banner, flush=True)
    except Exception:
        safe_banner = banner.encode("ascii", "replace").decode("ascii")
        print(safe_banner, flush=True)

def kill_port_process_windows(port: int):
    try:
        result = subprocess.run(
            f'netstat -ano | findstr :{port}',
            shell=True,
            capture_output=True,
            text=True
        )
        for line in result.stdout.strip().split("\n"):
            parts = line.strip().split()
            if len(parts) >= 5 and "LISTENING" in parts:
                pid = parts[-1]
                if pid.isdigit() and int(pid) > 0 and int(pid) != os.getpid():
                    print(f"{YELLOW}[Cleanup] Terminating stale process on port {port} (PID: {pid})...{RESET}", flush=True)
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
    except Exception:
        pass

def kill_port_process_unix(port: int):
    try:
        result = subprocess.run(
            f"lsof -ti:{port}",
            shell=True,
            capture_output=True,
            text=True
        )
        for pid in result.stdout.strip().split("\n"):
            if pid.isdigit() and int(pid) > 0:
                print(f"{YELLOW}[Cleanup] Terminating stale process on port {port} (PID: {pid})...{RESET}", flush=True)
                os.kill(int(pid), signal.SIGKILL)
    except Exception:
        pass

def free_ports():
    if os.name == 'nt':
        kill_port_process_windows(BACKEND_PORT)
        kill_port_process_windows(FRONTEND_PORT)
    else:
        kill_port_process_unix(BACKEND_PORT)
        kill_port_process_unix(FRONTEND_PORT)

def stream_output(process, prefix, color):
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"{color}{prefix}{RESET} {line.rstrip()}", flush=True)
    except Exception:
        pass

def check_dependencies():
    # 1. Check Python backend packages
    required_packages = ["fastapi", "uvicorn", "sqlalchemy", "pydantic", "pydantic_settings", "jwt", "aiosqlite"]
    missing = []
    for pkg in required_packages:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    
    if missing:
        print(f"{YELLOW}[Setup] Missing Python packages ({', '.join(missing)}). Installing backend dependencies...{RESET}", flush=True)
        req_file = BACKEND_DIR / "requirements.txt"
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], check=False)
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(req_file)], check=True)
            print(f"{GREEN}[Setup] Backend Python dependencies installed successfully!{RESET}", flush=True)
        except subprocess.CalledProcessError as e:
            print(f"{RED}[Error] Failed to install backend dependencies.{RESET}", flush=True)
            if sys.version_info >= (3, 13):
                print(f"{YELLOW}[Notice] Python {sys.version.split()[0]} detected. Some C-extensions require pre-built wheels from Python 3.11 or 3.12.{RESET}", flush=True)
                print(f"{YELLOW}[Solution] We recommend creating a Python 3.11/3.12 virtual environment:{RESET}", flush=True)
                print(f"  {CYAN}py -3.11 -m venv .venv{RESET}  (or py -3.12 -m venv .venv)")
                print(f"  {CYAN}.\\.venv\\Scripts\\activate{RESET}")
                print(f"  {CYAN}pip install -r backend/requirements.txt{RESET}\n")
            raise e

    # 2. Check Frontend node_modules
    node_modules = FRONTEND_DIR / "node_modules"
    if not node_modules.exists():
        print(f"{YELLOW}[Setup] node_modules not found in frontend. Running 'npm install'...{RESET}", flush=True)
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        subprocess.run([npm_cmd, "install"], cwd=FRONTEND_DIR, shell=(os.name == "nt"), check=True)
        print(f"{GREEN}[Setup] Frontend dependencies installed successfully!{RESET}", flush=True)

def wait_and_open_browser():
    time.sleep(1.5)
    # Check if frontend is up
    for _ in range(25):
        try:
            with socket.create_connection(("127.0.0.1", FRONTEND_PORT), timeout=0.5):
                print(f"{GREEN}[Launcher] Dashboard ready! Opening browser to http://localhost:{FRONTEND_PORT}...{RESET}", flush=True)
                webbrowser.open(f"http://localhost:{FRONTEND_PORT}")
                return
        except Exception:
            time.sleep(0.5)

def signal_handler(sig, frame):
    print(f"\n{YELLOW}[Shutdown] Stopping all PulseGuard services...{RESET}", flush=True)
    for p in processes:
        try:
            if os.name == 'nt':
                subprocess.run(f"taskkill /F /T /PID {p.pid}", shell=True, capture_output=True)
            else:
                p.terminate()
        except Exception:
            pass
    free_ports()
    print(f"{GREEN}[Shutdown] All services stopped cleanly. Goodbye!{RESET}", flush=True)
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print(f"{CYAN}[Launcher] Checking environment and freeing ports...{RESET}", flush=True)
    free_ports()
    check_dependencies()
    print_banner()

    # Start Backend
    print(f"{CYAN}[Launcher] Starting FastAPI Backend on http://0.0.0.0:{BACKEND_PORT}...{RESET}", flush=True)
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(BACKEND_PORT),
        "--reload"
    ]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=dict(os.environ, PYTHONUNBUFFERED="1")
    )
    processes.append(backend_proc)

    # Start Frontend
    print(f"{MAGENTA}[Launcher] Starting Vite Frontend on http://0.0.0.0:{FRONTEND_PORT}...{RESET}", flush=True)
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev", "--", "--host", "0.0.0.0", "--port", str(FRONTEND_PORT)]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=(os.name == "nt")
    )
    processes.append(frontend_proc)

    # Stream logs
    t_backend = threading.Thread(target=stream_output, args=(backend_proc, "[BACKEND] ", CYAN), daemon=True)
    t_frontend = threading.Thread(target=stream_output, args=(frontend_proc, "[FRONTEND]", MAGENTA), daemon=True)
    t_browser = threading.Thread(target=wait_and_open_browser, daemon=True)

    t_backend.start()
    t_frontend.start()
    t_browser.start()

    try:
        while True:
            time.sleep(1)
            # Check if any process died unexpectedly
            if backend_proc.poll() is not None:
                print(f"{RED}[Error] Backend process terminated unexpectedly (code: {backend_proc.returncode}).{RESET}", flush=True)
                break
            if frontend_proc.poll() is not None:
                print(f"{RED}[Error] Frontend process terminated unexpectedly (code: {frontend_proc.returncode}).{RESET}", flush=True)
                break
    except KeyboardInterrupt:
        pass
    finally:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
