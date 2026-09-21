# 🛡️ AEGIS ALERT — Unified Disaster Management Monorepo

> **Universal Emergency Response & Critical Infrastructure Protection Platform**  
> Unifying Mobile (Expo/React Native), Web (React 19/Vite), and Central Backend Gateway (FastAPI + PostGIS/SQLite) into a single, high-performance monorepo.

---

## 🏛️ Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │          📱 Mobile App (Expo)           │
                      │        (React Native + NativeWind)      │
                      │         http://localhost:8081           │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼ (POST /reports, POST /sos, GET /activity)
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │                   🛡️ Central AEGIS Backend API Gateway                           │
  │                   FastAPI • http://localhost:8000/api/v1                         │
  └────────────────────────┬───────────────────────────────────┬─────────────────────┘
                           │                                   │
                           ▼                                   ▼
        ┌──────────────────────────────────────┐  ┌─────────────────────────────────┐
        │  🗄️ PostgreSQL 16 + PostGIS          │  │   ⚡ Realtime Event SSE Hub     │
        │  (or SQLite `aegis_local.db` Fallback)│  │   (Live Incident Push)          │
        └──────────────────▲───────────────────┘  └────────────────┬────────────────┘
                           │                                       │
                           │ (GET /activity, GET /reports, POST /reports)
                           │                                       │
                      ┌────┴───────────────────────────────────────▼────┐
                      │             💻 Web Portal (React 19)            │
                      │           (Vite + TypeScript + Tailwind)        │
                      │               http://localhost:5173             │
                      └─────────────────────────────────────────────────┘
```

---

## 📂 Monorepo Project Structure

```
AEGIS/
├── backend/                  # Central FastAPI Gateway & Database Models
│   ├── app/                  # FastAPI Routers, Models, Schemas, Services
│   ├── tests/                # Backend unit and integration tests
│   └── aegis_local.db        # SQLite development database fallback
├── web/                      # React 19 + Vite Web Portal
│   ├── src/                  # Components, Pages, Context, Services
│   └── .env                  # VITE_AEGIS_API_URL=http://localhost:8000/api/v1
├── mobile/                   # Expo / React Native Cross-Platform Mobile App
│   ├── app/                  # Expo file-based routes & screens
│   ├── lib/                  # Services, API clients, cache & offline sync
│   └── .env                  # EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
├── scripts/                  # E2E verification & status check scripts
│   ├── verify_e2e_mobile_web_sync.ts   # Master 19-test bidirectional sync suite
│   └── check_status.py                 # Service port and health checker
├── package.json              # Monorepo root workspace configuration
├── start_all.py              # Automated cross-platform service orchestrator
├── start_all.bat             # Double-click Windows startup script
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start

### 1. Start All Services Simultaneously
From the monorepo root directory:

```bash
# Using Python Orchestrator:
python start_all.py

# OR using npm:
npm run start:all

# OR double-click:
start_all.bat
```

### 2. Service Endpoints

| Component | URL | Purpose |
| :--- | :--- | :--- |
| **Central Backend Gateway** | `http://localhost:8000/api/v1` | Authoritative REST API & Database Gateway |
| **Interactive API Docs** | `http://localhost:8000/docs` | Swagger UI documentation |
| **Web Portal** | `http://localhost:5173` | Command & Citizen Web Dashboard |
| **Mobile App (Web Mode)** | `http://localhost:8081` | Mobile App preview in browser |

---

## 🧪 Master E2E Verification & Health Check

### Run Health Check
```bash
npm run status
# or: python scripts/check_status.py
```

### Run Master Bidirectional Sync Suite (19 Tests)
```bash
npm run verify
# or: npx tsx scripts/verify_e2e_mobile_web_sync.ts
```

This tests:
1. Mobile Report -> Central PostGIS -> Web Portal Feed (Immediate sync without username filter)
2. Web Report -> Central PostGIS -> Mobile App Feed
3. Emergency SOS Beacon Lifecycle & Live Dispatch
4. Real-time Weather, SASGrid Radar, and Shwas AQI telemetry
5. Offline Idempotency Replay & Deduplication
