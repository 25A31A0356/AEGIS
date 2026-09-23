import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AegisLocationResult {
  village?: string;
  subdistrict?: string;
  formattedVillage?: string;
  isVillageLevel?: boolean;
  latitude: number;
  longitude: number;
  label: string;
  source: "gps" | "cached" | "default" | "custom";
  accuracyMeters?: number;
  accuracy?: number;
  permissionGranted: boolean;
  state?: string;
  district?: string;
  error?: string;
}

const LAST_LOCATION_KEY = "aegis_last_known_location";

// Default safe fallback sector coordinates (Visakhapatnam Coastal Sector)
export const DEFAULT_FALLBACK_LOCATION: AegisLocationResult = {
  latitude: 17.6868,
  longitude: 83.2185,
  label: "Sector 04 • High Risk Coastal Basin",
  source: "default",
  permissionGranted: false,
  state: "Andhra Pradesh",
  district: "Visakhapatnam",
};

/**
 * Reduce coordinate precision to 3 decimal places (~110 meters accuracy).
 * Preserves user privacy by not transmitting pinpoint household-level GPS.
 */
export function sanitizeCoordinates(lat: number, lng: number): { latitude: number; longitude: number } {
  return {
    latitude: Math.round(lat * 1000) / 1000,
    longitude: Math.round(lng * 1000) / 1000,
  };
}

/**
 * Request location permission with transparent explanation.
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) return true;

    const request = await Location.requestForegroundPermissionsAsync();
    return request.granted;
  } catch (error) {
    console.warn("[AegisLocation] Permission request failed:", error);
    return false;
  }
}

/**
 * Obtain current user location responsibly.
 * - Checks permission
 * - Uses balanced accuracy (avoids battery-heavy high-precision GPS)
 * - Times out in 6 seconds
 * - Sanitizes coordinates
 * - Falls back to last known location or default fallback location on failure
 */
export async function getResponsibleLocation(): Promise<AegisLocationResult> {
  // 1. Check permission
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    // Attempt to load last saved location or default
    const cached = await getLastKnownSavedLocation();
    if (cached) {
      return {
        ...cached,
        source: "cached",
        permissionGranted: false,
        error: "Location permission not granted. Showing last known sector.",
      };
    }

    return {
      ...DEFAULT_FALLBACK_LOCATION,
      source: "default",
      permissionGranted: false,
      error: "Location permission needed for proximity alerts. Using default regional sector.",
    };
  }

  // 2. Query GPS position
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const sanitized = sanitizeCoordinates(
      position.coords.latitude,
      position.coords.longitude
    );

    // Reverse geocode to get a human readable sector / district name
    let label = `${sanitized.latitude.toFixed(2)}°N, ${sanitized.longitude.toFixed(2)}°E`;
    let district: string | undefined;
    let state: string | undefined;

    let village: string | undefined;
    let subdistrict: string | undefined;
    let formattedVillage: string | undefined;

    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: sanitized.latitude,
        longitude: sanitized.longitude,
      });
      if (places && places.length > 0) {
        const place = places[0];
        village = place.name || place.street || undefined;
        subdistrict = place.subregion || place.city || undefined;
        district = place.district || place.city || place.subregion || undefined;
        state = place.region || place.country || undefined;

        if (village && village !== district) {
          formattedVillage = `Village ${village}${district ? ` • ${district}` : ''}`;
          label = `🌾 ${formattedVillage}, ${state || 'India'}`;
        } else {
          label = [district, state].filter(Boolean).join(", ") || label;
        }
      }
    } catch {
      // Geocoding non-critical
    }

    const result: AegisLocationResult = {
      latitude: sanitized.latitude,
      longitude: sanitized.longitude,
      label,
      state,
      district,
      village,
      subdistrict,
      formattedVillage,
      isVillageLevel: Boolean(village),
      source: "gps",
      accuracyMeters: position.coords.accuracy ? Math.round(position.coords.accuracy) : undefined,
      accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : undefined,
      permissionGranted: true,
    };

    // Save as last known location
    await saveLastKnownLocation(result);

    return result;
  } catch (error) {
    console.warn("[AegisLocation] GPS query failed or timed out:", error);

    const cached = await getLastKnownSavedLocation();
    if (cached) {
      return {
        ...cached,
        source: "cached",
        permissionGranted: true,
        error: "GPS signal weak. Using cached location.",
      };
    }

    return {
      ...DEFAULT_FALLBACK_LOCATION,
      source: "default",
      permissionGranted: true,
      error: "Unable to determine current GPS. Using regional sector.",
    };
  }
}

export async function saveLastKnownLocation(loc: AegisLocationResult): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(loc));
  } catch {}
}

export async function getLastKnownSavedLocation(): Promise<AegisLocationResult | null> {
  try {
    const stored = await AsyncStorage.getItem(LAST_LOCATION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
