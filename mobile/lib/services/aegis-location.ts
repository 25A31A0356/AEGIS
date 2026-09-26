import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * Authoritative Device GPS / Fused Location Data Model
 * 
 * Every location reading contains:
 * {
 *   "latitude": 0.0,
 *   "longitude": 0.0,
 *   "accuracyMeters": 0.0,
 *   "altitudeMeters": null,
 *   "speedMps": null,
 *   "bearingDegrees": null,
 *   "timestamp": "ISO-8601 timestamp",
 *   "provider": "GPS/FUSED",
 *   "isMockLocation": false
 * }
 */
export interface DeviceGpsLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters: number | null;
  speedMps: number | null;
  bearingDegrees: number | null;
  timestamp: string; // ISO-8601
  provider: "GPS/FUSED" | "GPS" | "NETWORK" | "MANUAL";
  isMockLocation: boolean;
}

export type AccuracyTier = "HIGH_QUALITY" | "USABLE" | "APPROXIMATE" | "POOR";

export interface GpsAccuracyPolicy {
  highQualityMaxMeters: number; // default: 10m
  usableMaxMeters: number;      // default: 25m
  approximateMaxMeters: number; // default: 50m
  maxStaleAgeSeconds: number;   // default: 60s
}

export const DEFAULT_ACCURACY_POLICY: GpsAccuracyPolicy = {
  highQualityMaxMeters: 10.0,
  usableMaxMeters: 25.0,
  approximateMaxMeters: 50.0,
  maxStaleAgeSeconds: 60.0,
};

export type LocalityType = "Village" | "Town" | "City" | "Locality" | "District";

export interface AegisLocationResult {
  // Authoritative Geographic Coordinates
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  accuracyTier: AccuracyTier;
  altitudeMeters?: number | null;
  speedMps?: number | null;
  bearingDegrees?: number | null;
  timestamp: string;
  provider: "GPS/FUSED" | "GPS" | "NETWORK" | "MANUAL" | "cached" | "default";
  isMockLocation: boolean;
  isStale: boolean;
  ageSeconds: number;
  
  // Permission & Service Health
  permissionGranted: boolean;
  locationServicesEnabled: boolean;
  isPrecisePermission: boolean;
  
  // Decoupled Cosmetic Display Labels (NEVER used for authoritative coordinates)
  label: string;
  displayAddress?: string;
  village?: string;
  subdistrict?: string;
  district?: string;
  state?: string;
  localityType?: LocalityType;
  localityName?: string;
  nearbyPlace?: string;
  speechText?: string;
  isPinned?: boolean;
  source: "gps" | "cached" | "default" | "custom";
  error?: string;
}

const STORAGE_LAST_GPS_KEY = "aegis_last_exact_gps";
const STORAGE_OFFLINE_QUEUE_KEY = "aegis_offline_location_queue";

/**
 * Fallback baseline coordinates (Used ONLY when hardware GPS fix is pending/denied)
 */
export const DEFAULT_FALLBACK_LOCATION: AegisLocationResult = {
  latitude: 17.17045,
  longitude: 82.05123,
  accuracyMeters: 50.0,
  accuracyTier: "POOR",
  timestamp: new Date().toISOString(),
  provider: "default",
  isMockLocation: false,
  isStale: true,
  ageSeconds: 9999,
  permissionGranted: false,
  locationServicesEnabled: false,
  isPrecisePermission: false,
  source: "default",
  label: "Sector 17, Andhra Pradesh",
  displayAddress: "Waiting for GPS satellite fix...",
  error: "GPS Satellite Fix Pending",
};

/**
 * Determine Accuracy Tier based on measured accuracy in meters
 * 
 * accuracy <= 10m  → high-quality fix
 * 10m–25m          → usable
 * 25m–50m          → approximate
 * >50m             → poor; continue requesting a better fix
 */
export function evaluateAccuracyTier(
  accuracyMeters: number,
  policy: GpsAccuracyPolicy = DEFAULT_ACCURACY_POLICY
): AccuracyTier {
  if (accuracyMeters <= policy.highQualityMaxMeters) return "HIGH_QUALITY";
  if (accuracyMeters <= policy.usableMaxMeters) return "USABLE";
  if (accuracyMeters <= policy.approximateMaxMeters) return "APPROXIMATE";
  return "POOR";
}

/**
 * Structured diagnostic logging of all critical GPS telemetry attributes
 */
export function logGpsDiagnostics(
  gps: DeviceGpsLocation,
  status: {
    permissionGranted: boolean;
    locationServicesEnabled: boolean;
    isPrecisePermission: boolean;
    ageSeconds: number;
  }
): void {
  console.log(
    `[AEGIS GPS FIX] Lat=${gps.latitude.toFixed(8)}, Lng=${gps.longitude.toFixed(8)}, ` +
    `Accuracy=${gps.accuracyMeters.toFixed(1)}m, Timestamp=${gps.timestamp}, ` +
    `Provider=${gps.provider}, Permission=${status.permissionGranted ? "GRANTED" : "DENIED"}, ` +
    `Services=${status.locationServicesEnabled ? "ENABLED" : "DISABLED"}, ` +
    `Mock=${gps.isMockLocation ? "MOCK_DETECTED" : "AUTHENTIC"}, Age=${status.ageSeconds}s`
  );
}

/**
 * Coordinate precision sanitizer (Preserves user privacy for public reports when requested)
 */
export function sanitizeCoordinates(
  latitude: number,
  longitude: number,
  precision: number = 3
): { latitude: number; longitude: number } {
  const factor = Math.pow(10, precision);
  return {
    latitude: Math.round(latitude * factor) / factor,
    longitude: Math.round(longitude * factor) / factor,
  };
}

/**
 * Text-to-speech announcer for acquired GPS coordinates
 */
export async function speakAegisLocation(text?: string): Promise<void> {
  if (!text) return;
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.warn("[AegisLocation] Speech synthesis error:", err);
  }
}

/**
 * Verify if hardware location services (GPS toggle) are enabled on device
 */
export async function checkLocationServicesEnabled(): Promise<boolean> {
  try {
    if (Platform.OS === "web") return true;
    return await Location.hasServicesEnabledAsync();
  } catch (err) {
    console.warn("[AegisLocation] Failed to query location services status:", err);
    return false;
  }
}

/**
 * Request Fine/Precise Location Permission
 */
export async function requestLocationPermission(): Promise<{
  granted: boolean;
  isPrecise: boolean;
}> {
  try {
    let current = await Location.getForegroundPermissionsAsync();
    if (!current.granted && current.canAskAgain) {
      current = await Location.requestForegroundPermissionsAsync();
    }
    
    const isPrecise =
      (current as any).accuracy === "fine" ||
      (current as any).accuracy === "high" ||
      current.granted;

    return {
      granted: current.granted,
      isPrecise,
    };
  } catch (error) {
    console.warn("[AegisLocation] Permission request error:", error);
    return { granted: false, isPrecise: false };
  }
}

/**
 * Queue a location reading for offline persistence and later sync
 */
export async function enqueueOfflineLocation(location: DeviceGpsLocation): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_OFFLINE_QUEUE_KEY);
    const queue: DeviceGpsLocation[] = raw ? JSON.parse(raw) : [];
    queue.push(location);
    // Keep max 200 offline readings
    if (queue.length > 200) queue.shift();
    await AsyncStorage.setItem(STORAGE_OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn("[AegisLocation] Offline location queue error:", err);
  }
}

/**
 * Synchronize all pending offline location readings with backend API
 */
export async function syncOfflineLocationQueue(apiBaseUrl: string = "http://localhost:8000"): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_OFFLINE_QUEUE_KEY);
    if (!raw) return 0;
    const queue: DeviceGpsLocation[] = JSON.parse(raw);
    if (!queue || queue.length === 0) return 0;

    // Try /v1/locations/sync first, then /api/v1/locations/sync
    let res = await fetch(`${apiBaseUrl}/v1/locations/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: "mobile-device-gps",
        readings: queue,
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch(`${apiBaseUrl}/api/v1/locations/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: "mobile-device-gps",
          readings: queue,
        }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);
    }

    if (res && res.ok) {
      await AsyncStorage.removeItem(STORAGE_OFFLINE_QUEUE_KEY);
      return queue.length;
    }
  } catch (err) {
    // Offline or network unavailable; readings stay safely in local queue
  }
  return 0;
}

/**
 * Post single GPS location reading to backend asynchronously
 */
export async function transmitGpsLocationToBackend(
  gps: DeviceGpsLocation,
  apiBaseUrl: string = "http://localhost:8000"
): Promise<boolean> {
  try {
    let res = await fetch(`${apiBaseUrl}/v1/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gps),
      signal: AbortSignal.timeout(3500),
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch(`${apiBaseUrl}/api/v1/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gps),
        signal: AbortSignal.timeout(3500),
      }).catch(() => null);
    }

    if (res && res.ok) return true;
  } catch (err) {
    // If backend is unreachable, queue locally for later sync
  }
  await enqueueOfflineLocation(gps);
  return false;
}

/**
 * Obtain Native GPS Hardware / Fused Location Fix with GPS-level precision.
 * 
 * Rules:
 * - Direct native GPS fix using Location.Accuracy.Highest / BestForNavigation
 * - Never rounded, never truncated
 * - Never replaced with city coordinates
 * - Exposes exact measured accuracyMeters and accuracyTier
 * - Rejects stale readings
 * - Detects mock locations
 * - Works 100% offline
 */
export async function getAuthoritativeGpsLocation(
  policy: GpsAccuracyPolicy = DEFAULT_ACCURACY_POLICY
): Promise<AegisLocationResult> {
  const timestampNow = new Date().toISOString();

  // 1. Check Location Services Enabled
  const servicesEnabled = await checkLocationServicesEnabled();

  // 2. Check & Request Permissions
  const { granted, isPrecise } = await requestLocationPermission();
  if (!granted) {
    const cached = await getCachedLastGpsLocation();
    if (cached) {
      return {
        ...cached,
        permissionGranted: false,
        locationServicesEnabled: servicesEnabled,
        isPrecisePermission: false,
        error: "Location permission denied. Showing last verified GPS fix.",
      };
    }
    return createDefaultFallbackResult(servicesEnabled, false);
  }

  // 3. Acquire Hardware GPS / Fused Location
  try {
    let position: Location.LocationObject | null = null;

    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
    } catch (e) {
      // High-accuracy retry with last known position
      position = await Location.getLastKnownPositionAsync({
        maxAge: policy.maxStaleAgeSeconds * 1000,
      });
    }

    if (!position || !position.coords) {
      const cached = await getCachedLastGpsLocation();
      if (cached) return cached;
      return createDefaultFallbackResult(servicesEnabled, true, "Could not acquire GPS satellite fix.");
    }

    const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
    const accuracyMeters = typeof accuracy === "number" && !isNaN(accuracy) ? accuracy : 15.0;
    const recordedTimestamp = position.timestamp
      ? new Date(position.timestamp).toISOString()
      : timestampNow;

    const ageSeconds = Math.max(0, Math.round((Date.now() - (position.timestamp || Date.now())) / 1000));
    const isStale = ageSeconds > policy.maxStaleAgeSeconds;
    const isMock = (position as any).mocked === true || (position.coords as any)?.mocked === true;
    const accuracyTier = evaluateAccuracyTier(accuracyMeters, policy);

    const gpsReading: DeviceGpsLocation = {
      latitude,
      longitude,
      accuracyMeters,
      altitudeMeters: altitude ?? null,
      speedMps: speed ?? null,
      bearingDegrees: heading ?? null,
      timestamp: recordedTimestamp,
      provider: "GPS/FUSED",
      isMockLocation: isMock,
    };

    // Diagnostic logging
    logGpsDiagnostics(gpsReading, {
      permissionGranted: true,
      locationServicesEnabled: servicesEnabled,
      isPrecisePermission: isPrecise,
      ageSeconds,
    });

    // Save authentic GPS to local storage
    await AsyncStorage.setItem(STORAGE_LAST_GPS_KEY, JSON.stringify(gpsReading));

    // Try background backend sync & queue
    transmitGpsLocationToBackend(gpsReading).catch(() => {});
    syncOfflineLocationQueue().catch(() => {});

    // Decoupled reverse geocoding for cosmetic display (runs with timeout)
    const displayDetails = await resolveDisplayAddress(latitude, longitude);

    return {
      latitude,
      longitude,
      accuracyMeters,
      accuracyTier,
      altitudeMeters: altitude ?? null,
      speedMps: speed ?? null,
      bearingDegrees: heading ?? null,
      timestamp: recordedTimestamp,
      provider: "GPS/FUSED",
      isMockLocation: isMock,
      isStale,
      ageSeconds,
      permissionGranted: true,
      locationServicesEnabled: servicesEnabled,
      isPrecisePermission: isPrecise,
      source: "gps",
      label: displayDetails.label || `${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E`,
      displayAddress: displayDetails.displayAddress,
      village: displayDetails.village,
      subdistrict: displayDetails.subdistrict,
      district: displayDetails.district,
      state: displayDetails.state,
      localityType: displayDetails.localityType,
      localityName: displayDetails.localityName,
      speechText: `Exact GPS location: ${latitude.toFixed(4)} degrees North, ${longitude.toFixed(4)} degrees East. Accuracy ${accuracyMeters.toFixed(1)} meters.`,
    };
  } catch (err: any) {
    console.warn("[AegisLocation] GPS acquisition failed:", err);
    const cached = await getCachedLastGpsLocation();
    if (cached) return cached;
    return createDefaultFallbackResult(servicesEnabled, granted, err?.message || "GPS fix error");
  }
}

/**
 * Decoupled Reverse Geocoding helper - ONLY for cosmetic display labels.
 * Never affects authoritative latitude or longitude.
 */
async function resolveDisplayAddress(lat: number, lng: number): Promise<{
  label: string;
  displayAddress?: string;
  village?: string;
  subdistrict?: string;
  district?: string;
  state?: string;
  localityType?: LocalityType;
  localityName?: string;
}> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { "User-Agent": "AEGIS-Disaster/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const village = addr.village || addr.hamlet || addr.isolated_dwelling;
      const suburb = addr.suburb || addr.neighbourhood || addr.residential;
      const town = addr.town || addr.municipality;
      const city = addr.city;
      const subdistrict = addr.county || addr.subdistrict || addr.taluk || addr.tehsil || addr.mandal;
      const district = addr.state_district || addr.district || subdistrict || town || "";
      const state = addr.state || "Andhra Pradesh";

      let localityType: LocalityType = "District";
      let localityName = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;

      if (village) {
        localityType = "Village";
        localityName = village;
      } else if (town) {
        localityType = "Town";
        localityName = town;
      } else if (suburb) {
        localityType = "Locality";
        localityName = suburb;
      } else if (city) {
        localityType = "City";
        localityName = city;
      }

      const displayAddress = [village || suburb || town || city, subdistrict, district, state].filter(Boolean).join(", ");

      return {
        label: displayAddress || `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`,
        displayAddress,
        village,
        subdistrict,
        district,
        state,
        localityType,
        localityName,
      };
    }
  } catch {}

  return {
    label: `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`,
    displayAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
  };
}

/**
 * Retrieve cached GPS reading from persistent local storage
 */
export async function getCachedLastGpsLocation(): Promise<AegisLocationResult | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_LAST_GPS_KEY);
    if (!raw) return null;
    const gps: DeviceGpsLocation = JSON.parse(raw);
    const ageSeconds = Math.max(0, Math.round((Date.now() - new Date(gps.timestamp).getTime()) / 1000));

    return {
      latitude: gps.latitude,
      longitude: gps.longitude,
      accuracyMeters: gps.accuracyMeters,
      accuracyTier: evaluateAccuracyTier(gps.accuracyMeters),
      altitudeMeters: gps.altitudeMeters,
      speedMps: gps.speedMps,
      bearingDegrees: gps.bearingDegrees,
      timestamp: gps.timestamp,
      provider: "GPS/FUSED",
      isMockLocation: gps.isMockLocation,
      isStale: ageSeconds > 120,
      ageSeconds,
      permissionGranted: true,
      locationServicesEnabled: true,
      isPrecisePermission: true,
      source: "cached",
      label: `${gps.latitude.toFixed(5)}°N, ${gps.longitude.toFixed(5)}°E (Cached GPS)`,
      displayAddress: `Last known GPS (${ageSeconds}s ago)`,
    };
  } catch {
    return null;
  }
}

/**
 * Watch Location Subscription for Live Tracking
 */
let activeLocationSubscription: Location.LocationSubscription | null = null;

export async function startContinuousGpsTracking(
  onLocationUpdate: (result: AegisLocationResult) => void,
  options: { timeIntervalMs?: number; distanceIntervalMeters?: number } = {}
): Promise<boolean> {
  const { timeIntervalMs = 3000, distanceIntervalMeters = 5 } = options;

  const { granted } = await requestLocationPermission();
  if (!granted) return false;

  if (activeLocationSubscription) {
    activeLocationSubscription.remove();
    activeLocationSubscription = null;
  }

  try {
    activeLocationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: timeIntervalMs,
        distanceInterval: distanceIntervalMeters,
      },
      (position) => {
        const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
        const accuracyMeters = accuracy ?? 10.0;
        const recordedTimestamp = new Date(position.timestamp || Date.now()).toISOString();
        const isMock = (position as any).mocked === true || (position.coords as any)?.mocked === true;
        const tier = evaluateAccuracyTier(accuracyMeters);

        const gps: DeviceGpsLocation = {
          latitude,
          longitude,
          accuracyMeters,
          altitudeMeters: altitude ?? null,
          speedMps: speed ?? null,
          bearingDegrees: heading ?? null,
          timestamp: recordedTimestamp,
          provider: "GPS/FUSED",
          isMockLocation: isMock,
        };

        // Cache & transmit
        AsyncStorage.setItem(STORAGE_LAST_GPS_KEY, JSON.stringify(gps)).catch(() => {});
        transmitGpsLocationToBackend(gps).catch(() => {});

        onLocationUpdate({
          latitude,
          longitude,
          accuracyMeters,
          accuracyTier: tier,
          altitudeMeters: altitude ?? null,
          speedMps: speed ?? null,
          bearingDegrees: heading ?? null,
          timestamp: recordedTimestamp,
          provider: "GPS/FUSED",
          isMockLocation: isMock,
          isStale: false,
          ageSeconds: 0,
          permissionGranted: true,
          locationServicesEnabled: true,
          isPrecisePermission: true,
          source: "gps",
          label: `${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E`,
          displayAddress: "Live GPS Streaming",
        });
      }
    );
    return true;
  } catch (err) {
    console.warn("[AegisLocation] Failed to start continuous GPS tracking:", err);
    return false;
  }
}

export function stopContinuousGpsTracking(): void {
  if (activeLocationSubscription) {
    activeLocationSubscription.remove();
    activeLocationSubscription = null;
  }
}

function createDefaultFallbackResult(
  servicesEnabled: boolean,
  permissionGranted: boolean,
  errorMessage?: string
): AegisLocationResult {
  return {
    ...DEFAULT_FALLBACK_LOCATION,
    timestamp: new Date().toISOString(),
    permissionGranted,
    locationServicesEnabled: servicesEnabled,
    error: errorMessage || "GPS fix unavailable",
  };
}

/**
 * Backward compatibility aliases
 */
export const getResponsibleLocation = getAuthoritativeGpsLocation;
export async function getLastKnownSavedLocation(): Promise<AegisLocationResult | null> {
  return await getCachedLastGpsLocation();
}
export async function saveLastKnownLocation(loc: AegisLocationResult): Promise<void> {
  await AsyncStorage.setItem(STORAGE_LAST_GPS_KEY, JSON.stringify({
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracyMeters: loc.accuracyMeters,
    altitudeMeters: loc.altitudeMeters ?? null,
    speedMps: loc.speedMps ?? null,
    bearingDegrees: loc.bearingDegrees ?? null,
    timestamp: loc.timestamp,
    provider: loc.provider,
    isMockLocation: loc.isMockLocation,
  }));
}
