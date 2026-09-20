# 👨‍🎓 AEGIS ALERT — Student & Team Onboarding Guide
### Master Technical Explanation, Codebase Navigation & Viva Preparation

---

## 1. What is AEGIS ALERT? (In Simple Terms)

Imagine a massive cyclone or cloudburst is about to strike a coastal or hilly district in India:
- Today, people might get a delayed SMS alert after floodwaters have already entered their homes.
- If the storm cuts power and knocks down cell towers, their mobile phones show "No Service", and normal emergency apps stop working.
- When trapped citizens try to call 112 or disaster control rooms, phone lines are continuously busy, and rescue boats cannot locate them in the dark.

**AEGIS ALERT fixes all of this.**

AEGIS is an all-in-one disaster management platform that:
1. **Listens to official government data**: Weather radars (IMD), dam water levels (CWC), earthquake sensors (USGS), and air quality (CPCB).
2. **Predicts disasters before they happen**: Computes rainfall accumulation and river surge hours before embankments overflow.
3. **Alerts people even without internet**: Sends audio siren alerts to phones offline, and triggers solar-powered village siren masts over long-range radio airwaves (LoRa 868 MHz).
4. **Rescues trapped citizens like Rapido**: When a citizen presses SOS, AEGIS finds trained volunteers and NDRF rescue teams within 10 km, sends them a dispatch offer, and gives them turn-by-turn navigation around flooded roads to rescue the victim.

---

## 2. What Happens When a User Clicks "SOS"?

Here is the exact step-by-step journey:

```
[Citizen Phone]
      │ 1. Citizen presses SOS (or speaks in Hindi/Telugu: "3 people trapped on roof")
      │ 2. Phone extracts GPS location and creates distress payload
      ▼
[FastAPI Backend Gateway]
      │ 3. Validates payload and stores incident in PostgreSQL database
      │ 4. Calculates Priority Score (e.g. 95/100 for children/flooding)
      │ 5. Triggers Spatial Matching Engine
      ▼
[Spatial Matching Engine]
      │ 6. Searches for available responders within 10 km radius
      │ 7. Finds 3 nearby volunteers / NDRF units
      │ 8. Sends a 45-second dispatch offer to their phones
      ▼
[Volunteer Responder Phone]
      │ 9. Phone rings with loud alert + shows "Accept SOS (4.2 km away)"
      │ 10. Volunteer taps "ACCEPT"
      ▼
[Real-Time WebSocket Sync]
      │ 11. Backend assigns the volunteer to the victim
      │ 12. Victim's screen updates: "Volunteer Mohan is En Route (ETA: 6 mins)"
      │ 13. Volunteer's map shows the safest evacuation route to the victim
      │ 14. Command Center map shows live moving GPS marker of the responder
```

---

## 3. The 3-Workspace Breakdown: Who Builds What?

### Workspace 1: `aegis-software` (Backend Core & AI Engine)
- **Folder**: `C:\Users\tst20\Aegis software`
- **GitHub**: `https://github.com/25A31A0356/aegis-software`
- **Tech Stack**: Python 3.13, FastAPI, SQLAlchemy 2.0, PostgreSQL, Redis, PostGIS.
- **What this team builds**:
  - The API endpoints (26 routers).
  - The Ingestion pipeline that pulls data from IMD, CWC, CPCB, NASA FIRMS, USGS.
  - The Multi-Hazard Correlation Engine that calculates risk scores (0–100).
  - The Rapido-style SOS Matching Engine.
  - Security, rate-limiting, and SSRF protection.

### Workspace 2: `Aegis-web` (Web Command Center)
- **Folder**: `C:\Users\tst20\aegis web`
- **GitHub**: `https://github.com/25A31A0356/Aegis-web`
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet GIS, Recharts.
- **What this team builds**:
  - The National Command Room for Incident Commanders and NDMA officers.
  - The Interactive Tactical Map with live Doppler radar, satellite, and hazard markers.
  - The SOS Dispatch Triage Console to monitor incoming beacons and assign NDRF units.
  - The Citizen Intelligence Reports page and Real-Time Activity Feed.

### Workspace 3: `aegis-alert` (Mobile App & Hardware Mast)
- **Folder**: `C:\Users\tst20\gaegisalert` (App) & `C:\Users\tst20\aegis-alert` (Hardware)
- **GitHub**: `https://github.com/25A31A0356/aegis-alert`
- **Tech Stack**: React Native, Expo SDK 54, NativeWind, ESP32, Semtech SX1262 LoRa.
- **What this team builds**:
  - The Citizen Mobile App with 1-Tap Emergency SOS and 8-language Voice SOS.
  - The Volunteer Responder Mode with incoming dispatch request modals.
  - The "I Am Safe" family check-in registry.
  - The physical ₹3,775 solar-powered LoRa siren mast firmware.

---

## 4. How to Run & Test Everything Locally

### Step 1: Start the Backend (FastAPI)
```bash
cd "C:\Users\tst20\Aegis software\backend"
$env:PYTHONPATH="C:\Users\tst20\Aegis software"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Open Swagger API docs: `http://localhost:8000/docs`

### Step 2: Start the Web Command Center
```bash
cd "C:\Users\tst20\aegis web"
npm run dev
```
- Open in browser: `http://localhost:5173`

### Step 3: Start the Mobile App (Expo)
```bash
cd "C:\Users\tst20\gaegisalert"
npx expo start --web --port 8081
```
- Open in browser: `http://localhost:8081`

### Running the Automated Test Suites
- **Backend Tests (69 tests)**:
  ```bash
  cd "C:\Users\tst20\Aegis software\backend"
  $env:PYTHONPATH="C:\Users\tst20\Aegis software"; python -m pytest tests
  ```
- **Web Verification Suites (161 assertions)**:
  ```bash
  cd "C:\Users\tst20\aegis web"
  cmd.exe /c npm test
  ```
- **Mobile Vitest Suite (57 tests)**:
  ```bash
  cd "C:\Users\tst20\gaegisalert"
  cmd.exe /c npm test
  ```

---

## 5. Top 10 Viva & Interview Questions for Team Members

1. **Q: Why FastAPI over Django/Flask?**  
   *A: FastAPI is fully asynchronous (AsyncIO), enabling high-concurrency handling of thousands of incoming GPS beacons and WebSocket connections with minimal latency, while automatically generating OpenAPI documentation.*

2. **Q: How does the SOS matching algorithm work?**  
   *A: It uses a two-tier spatial discovery algorithm (10 km initial, 20 km expanded) calculating spherical great-circle distances via the Haversine formula, filtering for available, opted-in responders who are not busy.*

3. **Q: How do you protect citizen privacy?**  
   *A: Public endpoints mask phone numbers (`+91 98**** 3210`). Full unmasked phone numbers are strictly restricted to authenticated incident dispatchers under role-based access control.*

4. **Q: What happens if an API provider (like IMD or USGS) goes down?**  
   *A: Our Ingestion Pipeline implements exponential backoff retries, provider failure isolation, and falls back seamlessly to cached telemetry in Redis/PostgreSQL without crashing the platform.*

5. **Q: Why React 19 and Leaflet over Google Maps?**  
   *A: Leaflet is lightweight, open-source, and supports custom offline tile caching, eliminating expensive commercial per-tile API costs during mass public disaster usage.*

6. **Q: How does the voice SOS parser work?**  
   *A: It captures citizen speech via Web Speech APIs across 8 Indian languages and parses keywords to extract victim counts, medical needs, and emergency types.*

7. **Q: What is the power consumption of the LoRa mast?**  
   *A: In standby mode it consumes only 12mA @ 3.3V (~0.04W). Our 72Wh LiFePO4 battery lasts up to 75 days in standby without any sunlight.*

8. **Q: What is the CAP protocol?**  
   *A: ITU-T CAP X.1303 (Common Alerting Protocol) is the international XML/JSON standard for emergency alerts used by government agencies like NDMA and C-DOT SACHET.*

9. **Q: How do you prevent SSRF attacks?**  
   *A: External provider URLs are validated against private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`) to prevent malicious actors from scanning internal infrastructure.*

10. **Q: How does offline data sync prevent duplicate records?**  
    *A: Every offline report and SOS beacon is tagged with a client-generated UUIDv4 `idempotency_key`. When reconnected, the backend uses this key for atomic deduplication.*
