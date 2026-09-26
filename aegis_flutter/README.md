# 🛡️ AEGIS ALERT — High-Performance Flutter Client (120 FPS)

A mission-critical, zero-jank mobile application engineered in **Flutter** for real-time disaster response, offline peer-to-peer distress beacons, and 120Hz hardware-accelerated GIS evacuation maps.

## 🚀 Key Modules
- **Overview Dashboard**: Live IMD/CPCB telemetry, decoupled risk index & sensor gauges.
- **Instant SOS**: 0ms hardware touch response, eager pointer-down dispatch, PostGIS 10km/20km responder matching.
- **120Hz GIS Radar Map**: Multi-layered vector canvas with isolated RepaintBoundaries and real-time sweep.
- **Safety Circle Check-in**: One-tap family & disaster center status broadcasts.
- **Offline Protocol Guides**: Offline survival action steps for Floods, Cyclones, Earthquakes, and Heatwaves.
- **Citizen Hazard Reports**: Crowdsourced incident feed with O(1) sliver recycling.

## ⚡ 120 FPS Architecture Features
1. **Dart Background Isolates**: Offloads heavy JSON serialization and distance calculation off the UI main thread.
2. **Sub-Tree Rebuild Isolation**: Uses fine-grained `ValueNotifier` and `Selector` leaf bindings.
3. **Impeller Direct Rendering**: Direct GPU execution with zero JavaScript runtime bridge overhead.
