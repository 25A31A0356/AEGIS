# Aegis Alert App — Centralized Aegis Data Client Architecture

## Architectural Contract

The **Aegis Alert App** operates strictly as a client to **Aegis Software (Aegis API)**:

```
External Providers (IMD, NDMA, USGS, NASA, Open-Meteo, OSRM)
       ↓
Aegis Software (Backend Gateway)
       ↓
Aegis API (tRPC / REST)
       ↓
Aegis Alert Mobile App
```

The mobile application does **NOT** require, store, or communicate with third-party provider API keys. All provider aggregation, authorization, rate-limiting, and credentials reside entirely in **Aegis Software**.

---

## Centralized API Endpoints (Consumed by Mobile App)

All UI screens interact with `lib/services/aegis-api.ts` which connects to the following Aegis endpoints:

| Endpoint | Method / Type | Payload | Consumed Data Points |
| :--- | :--- | :--- | :--- |
| `aegis.getWeather` | `query` | `{ latitude: number, longitude: number }` | Current weather, 5-day forecast, temperature (°C), humidity (%), wind speed & direction (km/h), rainfall (mm), visibility (km), severe weather status, source, last updated, freshness. |
| `aegis.getHazardAlerts` | `query` | `{ latitude: number, longitude: number, radiusKm?: number }` | Cyclone, flood, earthquake, wildfire, severe weather, emergency broadcasts; hazard severity (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), affected location, description, instructions, issued timestamp, expiration timestamp, source, status. |
| `aegis.getShelters` | `query` | `{ latitude: number, longitude: number }` | Verified high-ground emergency shelters, capacities, amenities (water, power, medical, sanitation), elevation, contact persons. |
| `aegis.getHospitals` | `query` | `{ latitude: number, longitude: number }` | Disaster medical centers, trauma ICU availability, open bed counts, emergency triage readiness. |
| `aegis.registerDeviceToken` | `mutation` | `{ token: string }` | Registers device Expo push token against user session for critical alert dispatches. |
| `safePing.create` | `mutation` | `{ contact: string, message: string, latitude?: number, longitude?: number }` | Broadcasts "I Am Safe" check-in to family circles. |
| `sosBeacon.create` | `mutation` | `{ hazard: string, people: number, note?: string, latitude?: number, longitude?: number }` | Transmits SOS distress signal to emergency monitoring desks. |
| `communityReport.create` | `mutation` | `{ hazard: string, severity: "Low" \| "Medium" \| "High", details: string, image?: string }` | Records verified citizen hazard reports for triage. |

---

## 19 Consumed Data Points

1. **Current weather**: Condition codes, weather label ("Clear skies", "Rain showers", "Thunderstorm risk").
2. **Weather forecast**: 5-day structured forecast with daily high/low temperatures, weather codes, rain probabilities.
3. **Temperature**: Temperature in Celsius (°C) and apparent "feels like" temperature.
4. **Humidity**: Relative humidity percentage (%).
5. **Wind**: Wind speed (km/h), wind direction (degrees), and peak wind gusts (km/h).
6. **Rainfall**: Live precipitation accumulation in millimeters (mm) and rain probability percentage.
7. **Severe weather**: Flag (`isSevereWeather: boolean`) and advisory notes for squalls/thunderstorms.
8. **Cyclone / storm alerts**: Storm tracking, wind speed (knots), and coastal advisory bulletins.
9. **Flood alerts**: Inundation warnings, flood basin water depth (meters), and submerged underpass notices.
10. **Earthquake alerts**: Magnitude (Richter scale), depth, faultline proximity, and structural advisory notices.
11. **Wildfire alerts**: Perimeter proximity and smoke hazard notices where available.
12. **Emergency alerts**: High-voltage electrical hazards, utility disruptions, evacuation orders.
13. **Nearby hazards**: POI hazards with distance in kilometers, coordinates, and hazard type.
14. **Hazard severity**: Strictly standardized classifications: `LOW`, `MODERATE`, `HIGH`, `CRITICAL`.
15. **Hazard location**: Centroid coordinates, radius in km, affected sector name, and polygon coordinates.
16. **Alert timestamp**: ISO 8601 issued time (`issuedAt`).
17. **Alert expiration**: ISO 8601 expiration time (`expiresAt`).
18. **Source**: Official authority attribution (e.g., "APSDMA / Municipal Flood Cell", "IMD", "NDMA", "NCS").
19. **Data freshness**: Explicit indicator (`"LIVE"`, `"CACHED"`, `"STALE"`) accompanied by `LAST UPDATED: <timestamp>`.

---

## Location Handling & Privacy

- **Transparent Permissions**: Location permission is requested with a clear emergency-readiness explanation (`expo-location`).
- **Privacy Sanitization**: Pinpoint coordinates are sanitized/rounded to 3 decimal places (~110m resolution) before transmission to Aegis Software.
- **Graceful Fallback**: If location permission is denied or GPS times out, the app gracefully presents the last known sector or default regional sector (`Sector 04 • High Risk Basin Zone`) without crashing.
- **Battery Optimization**: Utilizes `Location.Accuracy.Balanced` on demand instead of aggressive background GPS polling.

---

## Notification Pipeline & Deduplication

- **Permission Management**: Configures Android high-priority notification channels (`aegis-emergency-alerts` and `aegis-weather-updates`).
- **Deduplication Engine**: Tracks notified alert IDs in local storage; skips repeated notifications for previously notified alerts unless severity has escalated.
- **Expiration Filtering**: Filters out alerts where `expiresAt < now` before triggering local or push notifications.
- **No Fabricated Data**: Notifications are exclusively triggered by verified alerts received from Aegis Software.

---

## Offline Resilience & Mutation Queue

- **Local Storage Cache**: Caches weather (15m TTL), alerts (5m TTL), shelters (1h TTL), and hospitals (1h TTL).
- **Explicit Age Indicators**: Whenever cached data is displayed due to network loss or timeout, the UI displays `LAST UPDATED: <timestamp>` and a `CACHED` badge.
- **Offline Action Queue**: Safe Pings, SOS Beacons, and Community Reports submitted offline are queued locally and automatically synchronized upon network reconnection.
