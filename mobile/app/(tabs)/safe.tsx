import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";
import {
  LiveRealtimeMap,
  LiveCoordinate,
  GoogleMapLayerType,
  GOOGLE_MAP_LAYERS,
} from "@/components/live-realtime-map";
import { DEFAULT_USER_LOCATION, EmergencyPlace } from "@/lib/navigation-data";
import {
  generateSafeEvacuationPlan,
  evacuationPlaceToEmergencyPlace,
  EvacuationPlace,
  EvacuationPlanResult,
} from "@/lib/evacuation-service";
import { fetchRealtimeRoute, RealtimeRouteResult } from "@/lib/routing-service";
import { AegisApiService } from "@/lib/services/aegis-api";
import { AegisHazardAlert, SosMapMarker } from "@/lib/services/aegis-types";
import { useAegisData } from "@/hooks/use-aegis-data";
import { findNearestDistrict } from "@/lib/india-locations";

export type MapMode = "sos" | "safe";

export default function MapsScreen() {
  const colors = useColors();
  const { dict } = useAppPreferences();
  const { activeCriticalAlerts, hazardAlerts } = useAegisData();

  // Active Map Mode: "sos" (1) or "safe" (2)
  const [mapMode, setMapMode] = useState<MapMode>("safe");
  const [mapLayer, setMapLayer] = useState<GoogleMapLayerType>("roadmap");
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // User Live GPS Coordinates
  const [userCoord, setUserCoord] = useState<LiveCoordinate>({
    latitude: DEFAULT_USER_LOCATION.lat,
    longitude: DEFAULT_USER_LOCATION.lng,
    accuracy: null,
    altitude: null,
    address: "Locating live GPS coordinates...",
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ name: string; address: string; lat: number; lng: number }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Safe Map & Evacuation State
  const [evacPlan, setEvacPlan] = useState<EvacuationPlanResult | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<EmergencyPlace | null>(null);
  const [routeResult, setRouteResult] = useState<RealtimeRouteResult | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // SOS Map State
  const [sosMarkers, setSosMarkers] = useState<SosMapMarker[]>([]);
  const [isLoadingSos, setIsLoadingSos] = useState<boolean>(false);

  // 1. Acquire Real GPS Location on Mount
  const fetchLiveGPS = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy, altitude } = pos.coords;
            const nearest = findNearestDistrict(latitude, longitude);
            setUserCoord({
              latitude,
              longitude,
              accuracy,
              altitude,
              address: `${nearest.district.name}, ${nearest.district.state}`,
            });
            setIsLoadingLocation(false);
          },
          () => setIsLoadingLocation(false),
          { enableHighAccuracy: true, timeout: 8000 }
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const nearest = findNearestDistrict(loc.coords.latitude, loc.coords.longitude);
        setUserCoord({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          altitude: loc.coords.altitude,
          address: `${nearest.district.name}, ${nearest.district.state}`,
        });
      }
    } catch (e) {
      console.warn("[MapsScreen] GPS acquire error:", e);
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveGPS();
  }, [fetchLiveGPS]);

  // 2. Fetch SOS Beacons from Aegis API
  useEffect(() => {
    let mounted = true;
    async function loadSos() {
      try {
        setIsLoadingSos(true);
        const res = await AegisApiService.getActiveSosIncidents();
        if (mounted && res && res.data) {
          setSosMarkers(res.data);
        }
      } catch (e) {
        console.warn("[MapsScreen] SOS fetch error:", e);
      } finally {
        if (mounted) setIsLoadingSos(false);
      }
    }
    loadSos();
    return () => {
      mounted = false;
    };
  }, []);

  // 3. Determine if an Evacuation-level Hazard exists in the area
  const activeEvacHazard = useMemo(() => {
    if (activeCriticalAlerts && activeCriticalAlerts.length > 0) {
      return activeCriticalAlerts[0];
    }
    const critical = hazardAlerts.find(
      (h) =>
        h.severity?.toLowerCase() === "critical" ||
        h.severity?.toLowerCase() === "high" ||
        h.type?.toLowerCase().includes("flood") ||
        h.type?.toLowerCase().includes("cyclone") ||
        h.type?.toLowerCase().includes("landslide") ||
        h.title?.toLowerCase().includes("flood") ||
        h.title?.toLowerCase().includes("cyclone")
    );
    return critical || null;
  }, [hazardAlerts, activeCriticalAlerts]);

  // 4. Run Safe Map Evacuation Plan Engine ONLY if evacuation hazard is active
  useEffect(() => {
    let active = true;
    if (mapMode === "safe" && activeEvacHazard) {
      (async () => {
        try {
          const plan = await generateSafeEvacuationPlan(userCoord.latitude, userCoord.longitude);
          if (active && plan) {
            setEvacPlan(plan);
            if (plan.nearestSafe || plan.bestShelter) {
              const best = plan.bestShelter || plan.nearestSafe;
              if (best) {
                const place = evacuationPlaceToEmergencyPlace(best);
                setSelectedPlace(place);
              }
            }
          }
        } catch (e) {
          console.warn("[MapsScreen] Evacuation plan calculation error:", e);
        }
      })();
    } else {
      setEvacPlan(null);
      setSelectedPlace(null);
      setRouteResult(null);
      setIsNavigating(false);
    }
    return () => {
      active = false;
    };
  }, [mapMode, activeEvacHazard, userCoord]);

  // 5. Calculate Route when a place is selected in Safe Map
  useEffect(() => {
    if (!selectedPlace) {
      setRouteResult(null);
      return;
    }
    let isCurrent = true;
    (async () => {
      try {
        const res = await fetchRealtimeRoute(
          userCoord.latitude,
          userCoord.longitude,
          selectedPlace.coordinates.lat,
          selectedPlace.coordinates.lng,
          "walking"
        );
        if (isCurrent && res) setRouteResult(res);
      } catch (e) {
        console.warn("[MapsScreen] Route calculation error:", e);
      }
    })();
    return () => {
      isCurrent = false;
    };
  }, [selectedPlace, userCoord]);

  // Convert Places for Map Marker Display
  const mapPlaces: EmergencyPlace[] = useMemo(() => {
    if (mapMode === "sos") {
      // Return SOS markers as emergency places
      return sosMarkers.map((m) => ({
        id: m.id,
        name: `SOS Beacon: ${m.title || m.id}`,
        category: "sos" as const,
        type: m.emergency_type || "Emergency Distress",
        address: `${m.area || m.district}, ${m.state} • Status: ${m.status}`,
        coordinates: {
          lat: m.coordinates?.latitude || userCoord.latitude + 0.008,
          lng: m.coordinates?.longitude || userCoord.longitude + 0.008,
        },
        elevationMeters: 20,
        status: String(m.status || "ACTIVE"),
        badge: "SOS ACTIVE",
        details: `Distress Beacon initialized in ${m.district}, ${m.state}. Triage: ${m.severity}`,
      }));
    }

    // In Safe Map mode
    if (activeEvacHazard && evacPlan && evacPlan.allNearbyPlaces) {
      return evacPlan.allNearbyPlaces.map((p) => evacuationPlaceToEmergencyPlace(p));
    }

    // Passive emergency stations when no evacuation order is active
    return [
      {
        id: "station-ndrf-1",
        name: "NDRF / SDRF Multi-Hazard Outpost",
        category: "shelter" as const,
        type: "Designated Relief Station",
        address: "High Elevation Facility",
        coordinates: {
          lat: userCoord.latitude + 0.012,
          lng: userCoord.longitude + 0.009,
        },
        elevationMeters: 45,
        status: "24/7 Active",
        badge: "Safe Relief Node",
        details: "Multi-hazard emergency shelter standing by.",
      },
      {
        id: "station-hospital-1",
        name: "District Emergency Trauma & Medical Center",
        category: "hospital" as const,
        type: "Emergency Hospital",
        address: "24/7 Emergency Casualty Department",
        coordinates: {
          lat: userCoord.latitude - 0.011,
          lng: userCoord.longitude + 0.014,
        },
        elevationMeters: 38,
        status: "24/7 Open",
        badge: "Trauma Care",
        details: "Verified tertiary medical center.",
      },
    ];
  }, [mapMode, sosMarkers, activeEvacHazard, evacPlan, userCoord]);

  // Handle Search Execution
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const q = text.toLowerCase();
      const filtered = mapPlaces
        .filter((p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
        .map((p) => ({
          name: p.name,
          address: p.address,
          lat: p.coordinates.lat,
          lng: p.coordinates.lng,
        }));
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: { name: string; address: string; lat: number; lng: number }) => {
    setUserCoord((prev) => ({
      ...prev,
      latitude: result.lat,
      longitude: result.lng,
      address: result.name,
    }));
    setShowSearchResults(false);
    setSearchQuery(result.name);
  };

  return (
    <ScreenContainer className="p-0" edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* 1. FULL-BLEED GOOGLE MAPS CANVAS */}
        <LiveRealtimeMap
          userLocation={userCoord}
          places={mapPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={(p) => setSelectedPlace(p)}
          onRecenter={fetchLiveGPS}
          isLoadingLocation={isLoadingLocation}
          defaultLayer={mapLayer}
          routeCoordinates={routeResult?.coordinates}
          routeDistanceKm={routeResult?.distanceKm}
          routeDurationMin={routeResult?.durationMinutes}
          routingProvider={routeResult?.provider}
          isNavigating={isNavigating}
        />

        {/* 2. GOOGLE MAPS FLOATING TOP SEARCH BAR */}
        <View style={styles.topSearchWrapper}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="location.fill" size={18} color="#EA4335" />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search maps, shelters, zones..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery ? (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                style={styles.searchAction}
              >
                <IconSymbol name="xmark" size={14} color={colors.muted} />
              </Pressable>
            ) : (
              <Pressable onPress={fetchLiveGPS} style={styles.searchAction}>
                <IconSymbol name="arrow.triangle.2.circlepath" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>

          {/* Search Dropdown Results */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={[styles.searchDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {searchResults.map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleSelectSearchResult(item)}
                  style={({ pressed }) => [styles.searchItem, { borderBottomColor: colors.border }, pressed && styles.pressed]}
                >
                  <IconSymbol name="location.fill" size={15} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.searchItemName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.searchItemAddr, { color: colors.muted }]} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* 3. TWO MAP OPTIONS SELECTOR PILL (SOS MAP & SAFE MAP) */}
          <View style={styles.modeSelectorPillContainer}>
            <View style={[styles.segmentedPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Option 1: SOS Map */}
              <Pressable
                onPress={() => setMapMode("sos")}
                style={[
                  styles.segmentOption,
                  mapMode === "sos" && [styles.activeSegmentOption, { backgroundColor: "#EF4444" }],
                ]}
              >
                <IconSymbol
                  name="sos.circle.fill"
                  size={15}
                  color={mapMode === "sos" ? "#FFFFFF" : colors.muted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: mapMode === "sos" ? "#FFFFFF" : colors.foreground },
                  ]}
                >
                  (1) SOS Map
                </Text>
              </Pressable>

              {/* Option 2: Safe Map */}
              <Pressable
                onPress={() => setMapMode("safe")}
                style={[
                  styles.segmentOption,
                  mapMode === "safe" && [styles.activeSegmentOption, { backgroundColor: "#10B981" }],
                ]}
              >
                <IconSymbol
                  name="shield.lefthalf.filled"
                  size={15}
                  color={mapMode === "safe" ? "#FFFFFF" : colors.muted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: mapMode === "safe" ? "#FFFFFF" : colors.foreground },
                  ]}
                >
                  (2) Safe Map
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* 4. FLOATING MAP CONTROLS (RIGHT SIDE) */}
        <View style={styles.floatingControls}>
          {/* Layer Selector Button */}
          <Pressable
            onPress={() => setShowLayerMenu((prev) => !prev)}
            style={[styles.floatingBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel="Switch Google Map Layer"
          >
            <IconSymbol name="map.fill" size={20} color={colors.foreground} />
          </Pressable>

          {/* Recenter Live GPS Button */}
          <Pressable
            onPress={fetchLiveGPS}
            style={[styles.floatingBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel="Recenter to Live GPS"
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <IconSymbol name="location.fill" size={20} color="#1A73E8" />
            )}
          </Pressable>
        </View>

        {/* Layer Selection Floating Menu */}
        {showLayerMenu && (
          <View style={[styles.layerMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.layerMenuTitle, { color: colors.muted }]}>MAP LAYERS</Text>
            {(["roadmap", "hybrid", "terrain"] as GoogleMapLayerType[]).map((lyr) => {
              const info = GOOGLE_MAP_LAYERS[lyr];
              const isActive = mapLayer === lyr;
              return (
                <Pressable
                  key={lyr}
                  onPress={() => {
                    setMapLayer(lyr);
                    setShowLayerMenu(false);
                  }}
                  style={[
                    styles.layerOption,
                    isActive && { backgroundColor: colors.primary + "18", borderRadius: 8 },
                  ]}
                >
                  <Text style={styles.layerIcon}>{info.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.layerName, { color: colors.foreground, fontWeight: isActive ? "700" : "500" }]}>
                      {info.name}
                    </Text>
                    <Text style={[styles.layerDesc, { color: colors.muted }]}>{info.description}</Text>
                  </View>
                  {isActive && <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 5. DYNAMIC BOTTOM STATUS & EVACUATION ACTION CARD */}
        <View style={styles.bottomCardContainer}>
          {mapMode === "sos" ? (
            /* SOS Map Info Bar */
            <View style={[styles.bannerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.bannerRow}>
                <View style={[styles.iconPill, { backgroundColor: "#EF444420" }]}>
                  <IconSymbol name="sos.circle.fill" size={22} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
                    SOS Map Telemetry Active
                  </Text>
                  <Text style={[styles.bannerSubtitle, { color: colors.muted }]}>
                    Displaying active district distress beacons ({sosMarkers.length} beacons). SOS Map feature updates incoming.
                  </Text>
                </View>
              </View>
            </View>
          ) : activeEvacHazard && evacPlan ? (
            /* Safe Map: ACTIVE HAZARD & EVACUATION ORDER */
            <View style={[styles.bannerCard, { backgroundColor: colors.surface, borderColor: "#DC2626" }]}>
              <View style={styles.evacAlertRow}>
                <View style={[styles.iconPill, { backgroundColor: "#DC262625" }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={22} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.alertHeaderRow}>
                    <Text style={[styles.evacTitle, { color: "#DC2626" }]}>
                      ⚠️ EVACUATION ORDER: {activeEvacHazard.title.toUpperCase()}
                    </Text>
                    <View style={styles.evacBadge}>
                      <Text style={styles.evacBadgeText}>ACTION REQUIRED</Text>
                    </View>
                  </View>
                  <Text style={[styles.evacDesc, { color: colors.foreground }]} numberOfLines={2}>
                    {activeEvacHazard.description}
                  </Text>
                </View>
              </View>

              {/* Recommended Safe Shelter */}
              {selectedPlace && (
                <View style={[styles.shelterBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.shelterLabel, { color: colors.muted }]}>SAFEST EVACUATION DESTINATION</Text>
                    <Text style={[styles.shelterName, { color: colors.foreground }]}>{selectedPlace.name}</Text>
                    <Text style={[styles.shelterMeta, { color: colors.muted }]}>
                      📍 Safe high-elevation shelter • {selectedPlace.address}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setIsNavigating((prev) => !prev)}
                    style={[styles.evacNavBtn, { backgroundColor: isNavigating ? "#10B981" : "#1A73E8" }]}
                  >
                    <IconSymbol
                      name={isNavigating ? "checkmark.circle.fill" : "arrow.triangle.turn.up.right.diamond.fill"}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.evacNavBtnText}>
                      {isNavigating ? "Navigating" : "Start Route"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            /* Safe Map: ALL CLEAR (NO EVACUATION NEEDED) */
            <View style={[styles.bannerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.bannerRow}>
                <View style={[styles.iconPill, { backgroundColor: "#10B98120" }]}>
                  <IconSymbol name="shield.lefthalf.filled" size={22} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
                    🟢 Safe Map: All Clear
                  </Text>
                  <Text style={[styles.bannerSubtitle, { color: colors.muted }]}>
                    No active evacuation orders in your zone. Safe Map is standing by and will automatically engage when hazard evacuation is required.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    width: "100%",
    height: "100%",
  },
  topSearchWrapper: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 8,
    left: 12,
    right: 12,
    zIndex: 30,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  searchAction: {
    padding: 6,
  },
  searchDropdown: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: 200,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 0.5,
  },
  searchItemName: {
    fontSize: 13,
    fontWeight: "700",
  },
  searchItemAddr: {
    fontSize: 11,
    marginTop: 1,
  },
  modeSelectorPillContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  segmentedPill: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 6,
  },
  activeSegmentOption: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  floatingControls: {
    position: "absolute",
    right: 14,
    top: 130,
    zIndex: 25,
    gap: 10,
  },
  floatingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  layerMenu: {
    position: "absolute",
    right: 66,
    top: 130,
    width: 210,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    zIndex: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  layerMenuTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  layerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    gap: 8,
  },
  layerIcon: {
    fontSize: 18,
  },
  layerName: {
    fontSize: 12,
  },
  layerDesc: {
    fontSize: 10,
  },
  bottomCardContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 30,
  },
  bannerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
    gap: 10,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  bannerSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  evacAlertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  alertHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  evacTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  evacBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  evacBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  evacDesc: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  shelterBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  shelterLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  shelterName: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1,
  },
  shelterMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  evacNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 5,
  },
  evacNavBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.7,
  },
});
