# 🛡️ AEGIS ALERT — Master Emergency & Disaster Intelligence Platform

```
c:\Users\tst20\...\AEGIS\
│
├── 📱 mobile/                 # PURE APP FRONTEND (React Native / Expo)
│   ├── app/(tabs)/            # Mobile screens (Home, Map, SOS, Alerts, Profile)
│   ├── components/            # UI components (WeatherHero, SensorBar, SOSButton)
│   ├── hooks/                 # Native hooks (useLocation, useSOS, useOfflineSync)
│   ├── lib/                   # Client API & local SQLite offline queue
│   ├── assets/                # App icons, splash screens, audio alerts
│   ├── tests/                 # 13 pure client test suites (100% PASSING)
│   └── app.config.ts          # Expo configuration
│   └── [PURGED]               # Removed: server/, drizzle/, aegis-web/, template.json
│
├── 💻 web/                    # PURE WEB FRONTEND (React 19 + Vite 6 + Tailwind)
│   ├── src/pages/             # Web views (Dashboard, LiveMap, SOS, Hazards, Reports)
│   ├── src/components/map/    # Interactive Leaflet GIS (IndiaSafetyMap, Radar, SOS)
│   ├── src/context/           # LocationContext, SOSContext, ThemeContext
│   ├── index.html             # Web entrypoint
│   ├── vite.config.ts         # Pure Vite build + API proxy (http://localhost:8000)
│   └── [PURGED]               # Removed: server/, database/, stitch_reference/
│
├── ⚙️ backend/                # PURE SERVER & BACKEND ENGINE (FastAPI + PostGIS)
│   ├── app/api/v1/            # Endpoints (/weather, /sos, /hazards, /decoupled-risk)
│   ├── app/ingestion/         # Telemetry adapters (IMD, CWC, CPCB, NASA FIRMS, Open-Meteo)
│   ├── app/ml/                # Numerical feature correlation & uncertainty bands
│   ├── app/realtime/          # Redis Streams & WebSocket distress event bus
│   ├── app/dispatch/          # Rapido-style 10km/20km PostGIS responder matching
│   ├── migrations/            # PostGIS schema migrations
│   └── requirements.txt       # Python dependencies
│
├── 🚀 deployment/             # MASTER VERSIONING & CLOUD TOPOLOGIES
│   ├── versions.yaml          # Canonical semantic version registry for all components
│   ├── production.yaml        # AWS ap-south-1 (Mumbai) production topology
│   ├── staging.yaml           # Staging environment topology
│   └── workflows/             # CI/CD deployment automation
│
├── 🏛️ infrastructure/         # CLOUD INFRASTRUCTURE AS CODE
│   └── terraform/             # Terraform (VPC, ALB, ECS Fargate, RDS PostgreSQL, Redis)
│
├── 🐳 docker/                 # PRODUCTION MULTI-STAGE CONTAINERS
│   ├── Dockerfile.api         # Hardened FastAPI unprivileged container
│   ├── Dockerfile.web         # Hardened unprivileged Nginx container with CSP/HSTS
│   └── nginx.conf             # Production reverse proxy & caching rules
│
├── 📜 docs/                   # 14 MASTER SPECIFICATION RUNBOOKS
│   ├── ARCHITECTURE.md        # End-to-end system blueprint
│   ├── SOS.md                 # Emergency lifecycle & dispatching
│   ├── MAPS.md                # Dual map GIS specification
│   ├── SECURITY.md            # 54-point OWASP ASVS/MASVS audit
│   └── DEPLOYMENT.md          # Step-by-step production operations manual
│
└── 🛠️ scripts/                # PLATFORM MANAGEMENT CLIs
    ├── release_manager.py     # Version bumper & manifest updater
    ├── health_gate.py         # Zero-downtime health verification probe
    └── start_all.py           # Unified local development daemon launcher
```

## 🚀 Repositories
- **AEGIS (Master Monorepo)**: https://github.com/25A31A0356/AEGIS
- **aegis-software (Backend Engine)**: https://github.com/25A31A0356/aegis-software
- **Aegis-web (Web Frontend)**: https://github.com/25A31A0356/Aegis-web
- **aegis-alert (App Frontend)**: https://github.com/25A31A0356/aegis-alert
