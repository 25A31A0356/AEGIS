# AEGIS Web — Autonomous Emergency Geospatial Intelligence Dashboard

[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-1.9-green.svg)](https://leafletjs.com/)

**AEGIS Web** is the flagship web application for the AEGIS Alert disaster intelligence and multi-hazard response ecosystem. It provides an intuitive, high-performance geospatial command center featuring 7 specialized meteorological research maps, real-time Cyclone ARNAB telemetry, dedicated SOS distress beacon dispatch, and NDMA SACHET verified safety SOPs.

---

## 🗺️ Geospatial Architecture & Simple Map System

AEGIS Web replaces confusing, bloated map names with 7 strictly focused, dedicated environmental layers:

1. **`cyclone maps`**: Real-time tracking of active cyclonic systems (**Very Severe Cyclonic Storm ARNAB** in Bay of Bengal) with cone of uncertainty, gale radii ($210\text{ km}$), inner eye core ($90\text{ km}$), and 2-hour synoptic track splines.
2. **`wind maps`**: Full-India atmospheric streamline vector fields, warning corridors, and live station anemometers.
3. **`weather maps`**: State-by-state dropdown selector and district meteorological telemetry nodes.
4. **`doppler maps`**: IMD Doppler Weather Radar (DWR) precipitation reflectivity ($dBZ$) composite overlays.
5. **`satellite maps`**: Multispectral daily satellite imagery channels.
6. **`thermal anomaly maps`**: Continuous synoptic temperature departure contour polygons (NOAA CPC / IMD NCC style) with interactive thermal radiance overlays.
7. **`street maps`**: High-contrast, clean geographical navigation base layer.

---

## 🚨 Dedicated SOS Maps & Rescue Triage

The **`SOS Maps`** tab (`/maps`) is 100% isolated from scientific research maps to prevent clutter during active emergency operations:
- **Live Citizen Distress Beacons**: Real-time GPS coordinates with animated radar pulse indicators.
- **Triage Filter System**: Filter by severity (`Critical`, `Warning`, `Moderate`) and State (`Andhra Pradesh`, `Odisha`, `Tamil Nadu`, `Kerala`, etc.).
- **Victim Profile Inspection Modal**: Displays battery status, signal strength, medical priority, occupant count, and direct telephone dispatch buttons.
- **Emergency Speed-Dial Desk**: Direct 1-tap connection to `112`, `1078`, `1070`, `108`, and `1554`.

---

## 🛡️ NDMA SACHET Disaster Safety Hub

The **Safety Hub** (`/safety`) delivers authoritative, life-saving disaster action protocols for 7 core hazard domains with real disaster imagery:
- **Flood Disaster Safety** (7 DO's, 7 DON'Ts, NDMA SACHET Video Link)
- **Cyclone & Gale Storm Safety** (7 DO's, 6 DON'Ts, NDMA SACHET Video Link)
- **Earthquake & Seismic Hazard** (6 DO's, 6 DON'Ts, NDMA SACHET Video Link)
- **Landslide & Debris Flow Safety** (6 DO's, 6 DON'Ts, NDMA SACHET Video Link)
- **Road Safety & Highway Hazards** (6 DO's, 6 DON'Ts, MoRTH Video Link)
- **Lightning & Severe Thunderstorm** (6 DO's, 6 DON'Ts, NDMA SACHET Video Link)
- **Ocean & Coastal Maritime Hazards** (6 DO's, 6 DON'Ts, NDMA SACHET Video Link)

---

## ⚡ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4 + Lucide Icons + Material Symbols
- **Mapping Engine**: Leaflet + React-Leaflet + NASA GIBS + OpenStreetMap
- **State Management**: React Context (LocationContext, SOSContext, NotificationContext)
- **Internationalization**: English, Hindi, Telugu, Tamil, Bengali, Marathi, Gujarati, Malayalam, Kannada, Odia

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/25A31A0356/Aegis-web.git
cd Aegis-web

# Install dependencies
npm install

# Run the development server
npm run dev
# App is available at http://localhost:5173

# Build for production
npm run build
```

---

## 📄 License
Licensed under the [MIT License](LICENSE).
