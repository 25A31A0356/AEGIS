import subprocess
import sys
import time
import socket
import os
import signal

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def kill_port(port):
    if sys.platform == "win32":
        try:
            output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode('utf-8', errors='ignore')
            for line in output.strip().split('\n'):
                parts = line.strip().split()
                if len(parts) >= 5 and f":{port}" in parts[1] and parts[3] == "LISTENING":
                    pid = parts[4]
                    print(f"[*] Port {port} occupied by PID {pid}. Terminating...")
                    subprocess.run(f'taskkill /F /PID {pid}', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

print("=" * 65)
print("🛡️  AEGIS UNIFIED MONOREPO SERVICE ORCHESTRATOR")
print("=" * 65)

# Free up ports if occupied
for p in [8000, 5173, 8081, 3000]:
    if check_port(p):
        kill_port(p)

processes = []

try:
    # 1. Start Backend Gateway
    print("[1/3] Starting Central Backend Gateway (FastAPI @ http://localhost:8000)...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=ROOT_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    )
    processes.append(("Central Backend", backend_proc, 8000))

    # 2. Start Web Portal
    print("[2/3] Starting Web Portal (Vite React @ http://localhost:5173)...")
    web_dir = os.path.join(ROOT_DIR, "web")
    web_cmd = "npm run dev"
    web_proc = subprocess.Popen(
        web_cmd,
        cwd=web_dir,
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    )
    processes.append(("Web Portal", web_proc, 5173))

    # 3. Start Mobile App
    print("[3/3] Starting Mobile App (Expo Metro @ http://localhost:8081)...")
    mobile_dir = os.path.join(ROOT_DIR, "mobile")
    mobile_cmd = "npm run dev"
    mobile_proc = subprocess.Popen(
        mobile_cmd,
        cwd=mobile_dir,
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    )
    processes.append(("Mobile App", mobile_proc, 8081))

    print("\n[*] Waiting for services to initialize...")
    time.sleep(4)

    # Health Check Loop
    print("\n" + "=" * 65)
    print("STATUS SUMMARY:")
    for name, proc, port in processes:
        alive = check_port(port)
        status_text = f"ACTIVE (Listening on http://localhost:{port})" if alive else "INITIALIZING / STANDBY"
        print(f"  • {name:<20}: {status_text}")
    print("=" * 65)
    print("\n[+] All services launched in background.")
    print("[+] To verify synchronization, run: npm run verify")
    print("[+] Press Ctrl+C in this terminal to stop all services.")

    # Keep alive loop
    while True:
        time.sleep(2)

except KeyboardInterrupt:
    print("\n[*] Shutting down AEGIS services...")
    for name, proc, port in processes:
        try:
            if sys.platform == "win32":
                subprocess.run(f"taskkill /F /T /PID {proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                proc.terminate()
        except Exception:
            pass
    print("[+] All services stopped.")
