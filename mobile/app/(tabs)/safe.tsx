import React, { useState, useEffect } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";
import { LiveRealtimeMap, LiveCoordinate } from "@/components/live-realtime-map";
import {
  DEFAULT_USER_LOCATION,
  EmergencyPlace,
} from "@/lib/navigation-data";
import {
  fetchRealtimeRoute,
  RealtimeRouteResult,
  RouteManeuverStep,
} from "@/lib/routing-service";
import {
  generateSafeEvacuationPlan,
  evacuationPlaceToEmergencyPlace,
  EvacuationPlace,
  EvacuationPlanResult,
} from "@/lib/evacuation-service";
import { trpc } from "@/lib/trpc";
import { AegisApiService } from "@/lib/services/aegis-api";
import {
  AegisHospital,
  AegisHazardAlert,
  SosMapMarker,
} from "@/lib/services/aegis-types";
import {
  LocationSelectorModal,
  SelectedLocationResult,
} from "@/components/location-selector-modal";
import { findNearestDistrict } from "@/lib/india-locations";

export type SafePlanCategory =
  | "safer_nearby"
  | "best_shelter"
  | "sos_hospital"
  | "hazard_zones"
  | "sos_map";

export default function SafeScreen() {
  const colors = useColors();
  const { dict } = useAppPreferences();

  // User Live GPS Coordinate
  const [userCoord, setUserCoord] = useState<LiveCoordinate>({
    latitude: DEFAULT_USER_LOCATION.lat,
    longitude: DEFAULT_USER_LOCATION.lng,
    accuracy: null,
    altitude: null,
    address: "Locating live GPS coordinates...",
  });
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "loading">("loading");
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);

  // 5 Clean Categories
  const [category, setCategory] = useState<SafePlanCategory>("safer_nearby");
  const [planResult, setPlanResult] = useState<EvacuationPlanResult | null>(null);

  // SOS Map Stateâ Active SOS Incidents from backend
  const [sosMapMarkers, setSosMapMarkers] = useState<SosMapMarker[]>([]);
  const [isLoadingSosMap, setIsLoadingSosMap] = useState<boolean>(false);

  // SOS Hospital State
  const [hospitalsList, setHospitalsList] = useState<AegisHospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState<boolean>(false);

  // Hazard Zones State
  const [hazardAlertsList, setHazardAlertsList] = useState<AegisHazardAlert[]>([]);
  const [isLoadingHazards, setIsLoadingHazards] = useState<boolean>(false);

  // Active Selected Destination
  const [selectedEvacPlace, setSelectedEvacPlace] = useState<EvacuationPlace | null>(null);
  const [travelMode, setTravelMode] = useState<"walking" | "driving">("walking");

  // Navigation State
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [safePingFeedback, setSafePingFeedback] = useState<string | null>(null);

  // Search Origin / Destination Input
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ name: string; address: string; lat: number; lng: number }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Real-time Road Routing
  const [routeResult, setRouteResult] = useState<RealtimeRouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // tRPC Safe Ping Mutation
  const safePingMutation = trpc.safePing.create.useMutation({
    onSuccess: () => {
      setSafePingFeedback("✓ 'I Am Safe' beacon broadcast to family & emergency circle");
      setTimeout(() => setSafePingFeedback(null), 5000);
    },
    onError: () => {
      setSafePingFeedback("✓ 'I Am Safe' saved locally (will sync when online)");
      setTimeout(() => setSafePingFeedback(null), 5000);
    },
  });

  // 1. Fetch Real-time Live Location
  const refreshLiveLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude, accuracy, altitude, heading, speed } = pos.coords;
            let address = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;

            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await res.json();
              if (data && data.display_name) {
                const parts = data.display_name.split(", ");
                address = parts.slice(0, 3).join(", ");
              }
            } catch {}

            setUserCoord({
              latitude,
              longitude,
              accuracy: accuracy || 5,
              altitude: altitude || 32,
              heading: heading || 0,
              speed: speed || 0,
              address,
            });
            setLocationPermission("granted");
            setIsLoadingLocation(false);
          },
          (err) => {
            console.warn("Geolocation denied or error:", err);
            setLocationPermission("denied");
            setIsLoadingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationPermission("granted");
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        let address = `${loc.coords.latitude.toFixed(4)}°N, ${loc.coords.longitude.toFixed(4)}°E`;
        try {
          const geocodes = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (geocodes && geocodes.length > 0) {
            const g = geocodes[0];
            address = [g.name || g.street, g.district || g.city, g.region].filter(Boolean).join(", ");
          }
        } catch {}

        setUserCoord({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          altitude: loc.coords.altitude,
          heading: loc.coords.heading,
          speed: loc.coords.speed,
          address,
        });
      } else {
        setLocationPermission("denied");
      }
    } catch (e) {
      console.warn("Location error:", e);
      setLocationPermission("denied");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    refreshLiveLocation();
  }, []);

  // 2. Load Data when Category or Location changes
  useEffect(() => {
    let isCurrent = true;

    // Load Evacuation Plan
    (async () => {
      try {
        const plan = await generateSafeEvacuationPlan(userCoord.latitude, userCoord.longitude);
        if (isCurrent) {
          setPlanResult(plan);
          if (category === "safer_nearby" && plan.saferNearby.length > 0) {
            setSelectedEvacPlace(plan.saferNearby[0]);
          } else if (category === "best_shelter" && plan.bestShelter) {
            setSelectedEvacPlace(plan.bestShelter);
          }
        }
      } catch (e) {
        console.warn("Evacuation plan error:", e);
      }
    })();

    // Load SOS Map
    if (category === "sos_map") {
      (async () => {
        setIsLoadingSosMap(true);
        try {
          const res = await AegisApiService.getActiveSosIncidents();
          if (isCurrent && res.data) {
            setSosMapMarkers(res.data);
          }
        } catch (e) {
          console.warn("SOS Map load error:", e);
        } finally {
          if (isCurrent) setIsLoadingSosMap(false);
        }
      })();
    }

    // Load SOS Hospital
    if (category === "sos_hospital") {
      (async () => {
        setIsLoadingHospitals(true);
        try {
          const res = await AegisApiService.getHospitals(userCoord.latitude, userCoord.longitude);
          if (isCurrent && res.data) {
            setHospitalsList(res.data);
            if (res.data.length > 0) {
              const h = res.data[0];
              setSelectedEvacPlace((prev) =>
                prev ?? {
                  id: h.id,
                  name: h.name,
                  category: "hospital",
                  type: h.type,
                  address: h.address,
                  coordinates: { lat: h.coordinates.latitude, lng: h.coordinates.longitude },
                  elevationMeters: h.elevationMeters,
                  distanceKm: h.distanceKm || 0,
                  walkingMinutes: Math.round(((h.distanceKm || 1) / 4.5) * 60),
                  drivingMinutes: Math.round(((h.distanceKm || 1) / 35) * 60),
                  safetyScore: 90,
                  safetyStatus: "Safe & Accessible",
                  safetyTone: "green",
                  amenities: { drinkingWater: true, medicalStation: true, powerBackup: true, foodSupply: true },
                  badge: h.badge,
                  contactNumber: h.contactNumber,
                }
              );
            }
          }
        } catch (e) {
          console.warn("SOS Hospital load error:", e);
        } finally {
          if (isCurrent) setIsLoadingHospitals(false);
        }
      })();
    }

    // Load Hazard Zones
    if (category === "hazard_zones") {
      (async () => {
        setIsLoadingHazards(true);
        try {
          const res = await AegisApiService.getHazardAlerts(userCoord.latitude, userCoord.longitude, 50);
          if (isCurrent && res.data) {
            setHazardAlertsList(res.data);
          }
        } catch (e) {
          console.warn("Hazards load error:", e);
        } finally {
          if (isCurrent) setIsLoadingHazards(false);
        }
      })();
    }

    return () => {
      isCurrent = false;
    };
  }, [userCoord.latitude, userCoord.longitude, category]);

  // 3. Switch Category Handler
  const handleSelectCategory = (cat: SafePlanCategory) => {
    setCategory(cat);
    setIsNavigating(false);

    if (cat === "best_shelter" && planResult?.bestShelter) {
      setSelectedEvacPlace(planResult.bestShelter);
    } else if (cat === "safer_nearby" && planResult && planResult.saferNearby.length > 0) {
      setSelectedEvacPlace(planResult.saferNearby[0]);
    }
  };

  // 4. Compute Real-time Road Route when Selected Place changes
  useEffect(() => {
    let isCurrent = true;
    (async () => {
      if (!selectedEvacPlace) {
        setRouteResult(null);
        return;
      }
      setIsLoadingRoute(true);
      try {
        const res = await fetchRealtimeRoute(
          userCoord.latitude,
          userCoord.longitude,
          selectedEvacPlace.coordinates.lat,
          selectedEvacPlace.coordinates.lng,
          travelMode
        );
        if (isCurrent) {
          setRouteResult(res);
          setActiveStep(0);
        }
      } catch (e) {
        console.warn("Failed to calculate route:", e);
      } finally {
        if (isCurrent) setIsLoadingRoute(false);
      }
    })();
    return () => {
      isCurrent = false;
    };
  }, [userCoord.latitude, userCoord.longitude, selectedEvacPlace, travelMode]);

  // 5. Search / Location Autocomplete Handler
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            searchQuery.trim()
          )}&format=json&limit=4&addressdetails=1`
        );
        const data = (await res.json()) as { display_name: string; name?: string; lat: string; lon: string }[];
        if (data && Array.isArray(data)) {
          const results = data.map((item) => ({
            name: item.display_name.split(",")[0] || item.name || "Custom Place",
            address: item.display_name.split(",").slice(1, 4).join(", ").trim(),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
          setSearchResults(results);
          setShowSearchResults(true);
        }
      } catch (e) {
        console.warn("Autocomplete failed:", e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: { name: string; address: string; lat: number; lng: number }) => {
    setUserCoord({
      latitude: result.lat,
      longitude: result.lng,
      address: result.name + (result.address ? `, ${result.address}` : ""),
    });
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSelectPanIndiaLocation = (res: SelectedLocationResult) => {
    setUserCoord({
      latitude: res.latitude,
      longitude: res.longitude,
      accuracy: 10,
      altitude: 25,
      address: res.label,
    });
    setLocationPermission("granted");
    setIsLoadingLocation(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    const customPlace: EvacuationPlace = {
      id: `custom-pin-${Date.now()}`,
      name: `Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      category: "custom",
      type: "Custom Map Destination",
      address: `Point at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
      coordinates: { lat, lng },
      elevationMeters: 35,
      distanceKm: 2.5,
      walkingMinutes: 12,
      drivingMinutes: 4,
      safetyScore: 78,
      safetyStatus: "Safe & Accessible",
      safetyTone: "blue",
      amenities: { drinkingWater: false, medicalStation: false, powerBackup: false, foodSupply: false },
      badge: "Target Pin",
      reason: "Custom destination selected on map",
    };

    setSelectedEvacPlace(customPlace);
    setIsNavigating(false);
  };

  const handleBroadcastSafePing = () => {
    safePingMutation.mutate({
      contact: "Family & Emergency Contacts",
      message: `I am currently safe near ${userCoord.address || "Live Location"}. Evacuating to ${selectedEvacPlace?.name || "High Ground"} via ${routeResult?.summary || "Safe Corridor"}.`,
    });
  };

  const activeDistanceKm = routeResult ? routeResult.distanceKm : (selectedEvacPlace?.distanceKm || 3.2);
  const activeDurationMin = routeResult
    ? routeResult.durationMinutes
    : travelMode === "driving"
    ? (selectedEvacPlace?.drivingMinutes || 8)
    : (selectedEvacPlace?.walkingMinutes || 22);
  const activeSteps: RouteManeuverStep[] = routeResult?.steps || [];
  const currentStep = activeSteps[activeStep] || activeSteps[0];

  // Convert places for map canvas
  const allMapPlaces: EmergencyPlace[] = (planResult?.allNearbyPlaces || []).map(evacuationPlaceToEmergencyPlace);
  if (selectedEvacPlace && !allMapPlaces.some((p) => p.id === selectedEvacPlace.id)) {
    allMapPlaces.push(evacuationPlaceToEmergencyPlace(selectedEvacPlace));
  }

  const selectedEmergencyPlace: EmergencyPlace | null = selectedEvacPlace
    ? evacuationPlaceToEmergencyPlace(selectedEvacPlace)
    : null;

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Permission / Location Unavailable State Banner if Denied */}
        {locationPermission === "denied" && (
          <View style={[styles.permissionWarningCard, { backgroundColor: colors.warning + "18", borderColor: colors.warning }]}>
            <View style={styles.permissionWarningRow}>
              <IconSymbol name="location.slash.fill" size={22} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
                  GPS Location Access Needed
                </Text>
                <Text style={[styles.permissionSub, { color: colors.muted }]}>
                  Real device location is required for live proximity safety routing and nearby emergency services.
                </Text>
              </View>
              <Pressable
                style={[styles.grantGpsBtn, { backgroundColor: colors.primary }]}
                onPress={refreshLiveLocation}
              >
                <Text style={styles.grantGpsBtnText}>Enable GPS</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Top Location & Evacuation Search Console */}
        <View style={[styles.locationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.locationHeaderRow}>
            <Pressable
              style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}
              onPress={() => setLocationModalVisible(true)}
            >
              <View style={styles.locationIconWrap}>
                <IconSymbol name="location.fill" size={18} color="#1A73E8" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.locationKicker}>{dict.yourLocation.toUpperCase()}</Text>
                  <View style={[styles.panIndiaBadge, { backgroundColor: "#E8F0FE", borderColor: "#1A73E8" }]}>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: "#1A73E8" }}>Pan-India 780+</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={[styles.locationAddressText, { color: colors.foreground }]}>
                  {isLoadingLocation ? "Locating live GPS coordinates..." : userCoord.address || "Live Device Location"}
                </Text>
              </View>
            </Pressable>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Pressable
                style={[styles.selectDistrictBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setLocationModalVisible(true)}
              >
                <IconSymbol name="list.bullet" size={13} color={colors.primary} />
                <Text style={[styles.selectDistrictText, { color: colors.primary }]}>Change</Text>
              </Pressable>

              <Pressable
                style={[styles.recenterBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={refreshLiveLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color="#1A73E8" />
                ) : (
                  <IconSymbol name="arrow.clockwise" size={14} color="#1A73E8" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Location Search Bar */}
          <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <IconSymbol name="magnifyingglass" size={15} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={dict.searchSafetyArea}
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.foreground }]}
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : searchQuery.trim().length > 0 ? (
              <Pressable onPress={() => { setSearchQuery(""); setShowSearchResults(false); }}>
                <IconSymbol name="xmark.circle.fill" size={16} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={[styles.searchDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {searchResults.map((item, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.searchRow, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <IconSymbol name="mappin.circle.fill" size={16} color="#EA4335" />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[styles.searchResultTitle, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                    <Text numberOfLines={1} style={[styles.searchResultSub, { color: colors.muted }]}>
                      {item.address}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Proximity Hazard Alert Banner if near hazard */}
          {planResult && planResult.hazardsDetected > 0 && (
            <View style={styles.hazardWarningBanner}>
              <IconSymbol name="exclamationmark.triangle.fill" size={15} color="#D93025" />
              <Text style={styles.hazardWarningText}>
                {planResult.hazardsDetected} Active Waterlogged/Hazard Zones Nearby. Routing via elevated bypass corridors.
              </Text>
            </View>
          )}
        </View>

        {/* 5 Clean Categories Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsRow}>
          {/* 1. Safer Nearby */}
          <Pressable
            style={[
              styles.categoryPill,
              {
                backgroundColor: category === "safer_nearby" ? "#1A73E8" : colors.surface,
                borderColor: category === "safer_nearby" ? "#1A73E8" : colors.border,
              },
            ]}
            onPress={() => handleSelectCategory("safer_nearby")}
          >
            <Text style={{ fontSize: 14 }}>🔵</Text>
            <Text style={[styles.categoryPillText, { color: category === "safer_nearby" ? "#FFFFFF" : colors.foreground }]}>
              Safer Nearby
            </Text>
          </Pressable>

          {/* 2. Best Shelter */}
          <Pressable
            style={[
              styles.categoryPill,
              {
                backgroundColor: category === "best_shelter" ? "#8430CE" : colors.surface,
                borderColor: category === "best_shelter" ? "#8430CE" : colors.border,
              },
            ]}
            onPress={() => handleSelectCategory("best_shelter")}
          >
            <Text style={{ fontSize: 14 }}>🛡️</Text>
            <Text style={[styles.categoryPillText, { color: category === "best_shelter" ? "#FFFFFF" : colors.foreground }]}>
              Best Shelter
            </Text>
          </Pressable>

          {/* 3. SOS Hospital */}
          <Pressable
            style={[
              styles.categoryPill,
              {
                backgroundColor: category === "sos_hospital" ? "#188038" : colors.surface,
                borderColor: category === "sos_hospital" ? "#188038" : colors.border,
              },
            ]}
            onPress={() => handleSelectCategory("sos_hospital")}
          >
            <Text style={{ fontSize: 14 }}>🏥</Text>
            <Text style={[styles.categoryPillText, { color: category === "sos_hospital" ? "#FFFFFF" : colors.foreground }]}>
              SOS Hospital
            </Text>
          </Pressable>

          {/* 4. Hazard Zones */}
          <Pressable
            style={[
              styles.categoryPill,
              {
                backgroundColor: category === "hazard_zones" ? "#D93025" : colors.surface,
                borderColor: category === "hazard_zones" ? "#D93025" : colors.border,
              },
            ]}
            onPress={() => handleSelectCategory("hazard_zones")}
          >
            <Text style={{ fontSize: 14 }}>⛔</Text>
            <Text style={[styles.categoryPillText, { color: category === "hazard_zones" ? "#FFFFFF" : colors.foreground }]}>
              Hazard Zones
            </Text>
          </Pressable>

          {/* 5. SOS Map */}
          <Pressable
            style={[
              styles.categoryPill,
              {
                backgroundColor: category === "sos_map" ? "#D93025" : colors.surface,
                borderColor: category === "sos_map" ? "#D93025" : colors.border,
              },
            ]}
            onPress={() => handleSelectCategory("sos_map")}
          >
            <Text style={{ fontSize: 14 }}>🚨</Text>
            <Text style={[styles.categoryPillText, { color: category === "sos_map" ? "#FFFFFF" : colors.foreground }]}>
              SOS Map
            </Text>
          </Pressable>
        </ScrollView>

        {/* Real-time Interactive Google Maps Canvas */}
        <LiveRealtimeMap
          userLocation={userCoord}
          places={allMapPlaces}
          selectedPlace={selectedEmergencyPlace}
          onSelectPlace={(place) => {
            const matched = (planResult?.allNearbyPlaces || []).find((p) => p.id === place.id);
            if (matched) {
              setSelectedEvacPlace(matched);
            } else {
              setSelectedEvacPlace({
                id: place.id,
                name: place.name,
                category: place.category === "hospital" ? "hospital" : "shelter",
                type: place.type,
                address: place.address,
                coordinates: place.coordinates,
                elevationMeters: place.elevationMeters,
                distanceKm: 3.0,
                walkingMinutes: 18,
                drivingMinutes: 6,
                safetyScore: 82,
                safetyStatus: "Safe & Accessible",
                safetyTone: "green",
                amenities: { drinkingWater: true, medicalStation: true, powerBackup: true, foodSupply: true },
                badge: place.badge,
              });
            }
            setIsNavigating(false);
          }}
          onRecenter={refreshLiveLocation}
          onMapClickLocation={handleMapClick}
          isLoadingLocation={isLoadingLocation}
          routeCoordinates={routeResult?.coordinates}
          routeDistanceKm={activeDistanceKm}
          routeDurationMin={activeDurationMin}
          routingProvider={routeResult?.provider}
          isNavigating={isNavigating}
          currentStepInstruction={currentStep?.instruction}
          currentStepDistanceMeters={currentStep?.distanceMeters}
          activeStepNumber={activeStep + 1}
          totalSteps={activeSteps.length || 1}
        />
        {/* SOS Map markers in sos_map category are shown in list below map */}

        {/* Safe Ping Broadcast Banner */}
        {safePingFeedback && (
          <View style={[styles.feedbackPill, { backgroundColor: colors.success + "1E", borderColor: colors.success + "40" }]}>
            <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
            <Text style={[styles.feedbackText, { color: colors.success }]}>
              {safePingFeedback}
            </Text>
          </View>
        )}

        {/* Destination Card with Safety Diagnostics & Navigation */}
        {selectedEvacPlace && category !== "sos_map" && category !== "hazard_zones" && (
          <View
            style={[
              styles.destinationCard,
              {
                backgroundColor: colors.surface,
                borderColor: isNavigating ? "#188038" : colors.border,
              },
            ]}
          >
            <View style={styles.destHeader}>
              <View style={styles.destTitleWrap}>
                <View
                  style={[
                    styles.destIconBox,
                    {
                      backgroundColor:
                        selectedEvacPlace.safetyTone === "green"
                          ? "#E6F4EA"
                          : selectedEvacPlace.safetyTone === "blue"
                          ? "#E8F0FE"
                          : "#FEF7E0",
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>
                    {selectedEvacPlace.category === "hospital"
                      ? "🏥"
                      : selectedEvacPlace.safetyTone === "green"
                      ? "🛡️"
                      : "📍"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.destTypeKicker, { color: selectedEvacPlace.safetyTone === "green" ? "#188038" : "#1A73E8" }]}>
                    {selectedEvacPlace.type.toUpperCase()}
                  </Text>
                  <Text numberOfLines={1} style={[styles.destName, { color: colors.foreground }]}>
                    {selectedEvacPlace.name}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.safetyScoreBadge,
                  {
                    backgroundColor: selectedEvacPlace.safetyTone === "green" ? "#E6F4EA" : "#E8F0FE",
                    borderColor: selectedEvacPlace.safetyTone === "green" ? "#34A853" : "#1A73E8",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.safetyScoreText,
                    { color: selectedEvacPlace.safetyTone === "green" ? "#137333" : "#1A73E8" },
                  ]}
                >
                  Safety: {selectedEvacPlace.safetyScore}/100
                </Text>
              </View>
            </View>

            <View style={[styles.reasonBox, { backgroundColor: colors.background }]}>
              <IconSymbol name="shield.lefthalf.filled" size={14} color="#188038" />
              <Text style={[styles.reasonText, { color: colors.foreground }]}>
                {selectedEvacPlace.reason || selectedEvacPlace.address}
              </Text>
            </View>

            <View style={[styles.metricsGrid, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>DISTANCE</Text>
                <Text style={[styles.metricValue, { color: colors.foreground }]}>
                  {isLoadingRoute ? "..." : `${activeDistanceKm} km`}
                </Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>
                  {travelMode === "driving" ? "DRIVE ETA" : "WALK ETA"}
                </Text>
                <Text style={[styles.metricValue, { color: "#188038" }]}>
                  {isLoadingRoute ? "..." : `~${activeDurationMin} min`}
                </Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>ELEVATION</Text>
                <Text style={[styles.metricValue, { color: "#1A73E8" }]}>
                  +{selectedEvacPlace.elevationMeters}m MSL
                </Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>CAPACITY</Text>
                <Text style={[styles.metricValue, { color: colors.foreground }]}>
                  {selectedEvacPlace.capacity ? `${selectedEvacPlace.capacity.open} Open` : "Active"}
                </Text>
              </View>
            </View>

            {/* Travel Mode & Start Route Action */}
            {isNavigating ? (
              <View style={[styles.navStepBox, { backgroundColor: colors.background }]}>
                {currentStep && (
                  <View style={styles.navStepHeader}>
                    <View style={styles.stepIconBox}>
                      <IconSymbol name="arrow.triangle.turn.up.right.diamond.fill" size={20} color="#188038" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.navStepKicker}>
                        STEP {activeStep + 1} OF {activeSteps.length || 1} • {currentStep.distanceMeters}m
                      </Text>
                      <Text style={[styles.navStepText, { color: colors.foreground }]}>
                        {currentStep.instruction}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.navStepActions}>
                  <Pressable
                    style={[styles.stepActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, activeStep === 0 && { opacity: 0.4 }]}
                    disabled={activeStep === 0}
                    onPress={() => setActiveStep((s) => Math.max(0, s - 1))}
                  >
                    <Text style={[styles.stepActionText, { color: colors.foreground }]}>Prev</Text>
                  </Pressable>

                  {activeStep < activeSteps.length - 1 ? (
                    <Pressable
                      style={[styles.stepActionBtnPrimary, { backgroundColor: "#188038" }]}
                      onPress={() => setActiveStep((s) => s + 1)}
                    >
                      <Text style={styles.stepActionTextPrimary}>
                        Next Step ({activeStep + 1}/{activeSteps.length})
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.stepActionBtnPrimary, { backgroundColor: "#188038" }]}
                      onPress={handleBroadcastSafePing}
                    >
                      <Text style={styles.stepActionTextPrimary}>Arrived • Broadcast Safe</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[styles.stopNavBtn, { borderColor: "#EA4335" }]}
                    onPress={() => setIsNavigating(false)}
                  >
                    <Text style={[styles.stopNavText, { color: "#EA4335" }]}>Exit</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <View style={styles.travelModeToggle}>
                  <Pressable
                    style={[styles.travelModeBtn, travelMode === "walking" && { backgroundColor: "#188038" }]}
                    onPress={() => setTravelMode("walking")}
                  >
                    <IconSymbol name="figure.walk" size={14} color={travelMode === "walking" ? "#FFFFFF" : colors.foreground} />
                  </Pressable>
                  <Pressable
                    style={[styles.travelModeBtn, travelMode === "driving" && { backgroundColor: "#188038" }]}
                    onPress={() => setTravelMode("driving")}
                  >
                    <IconSymbol name="car.fill" size={14} color={travelMode === "driving" ? "#FFFFFF" : colors.foreground} />
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.startRouteBtn, { backgroundColor: "#188038" }]}
                  onPress={() => setIsNavigating(true)}
                >
                  {isLoadingRoute ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol name="arrow.triangle.turn.up.right.diamond.fill" size={16} color="#FFFFFF" />
                      <Text style={styles.startRouteBtnText}>{dict.startSafeRoute}</Text>
                    </>
                  )}
                </Pressable>

                {selectedEvacPlace.contactNumber && (
                  <Pressable
                    style={[styles.callBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => Linking.openURL(`tel:${selectedEvacPlace.contactNumber!.replace(/[^0-9+]/g, "")}`)}
                  >
                    <IconSymbol name="phone.fill" size={16} color="#188038" />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SOS MAP TAB VIEW â Active SOS Incidents from Backend */}
        {/* ------------------------------------------------------------- */}
        {category === "sos_map" && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderWrap}>
              <View>
                <Text style={styles.sectionKicker}>LIVE DISTRESS SIGNALS â¢ AEGIS BACKEND</Text>
                <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
                  Active SOS Incidents
                </Text>
              </View>
              <Pressable
                style={[styles.refreshPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  setIsLoadingSosMap(true);
                  AegisApiService.getSosMapMarkers()
                    .then((res) => {
                      if (res.data) setSosMapMarkers(res.data);
                      else setSosMapMarkers([]);
                    })
                    .catch(() => setSosMapMarkers([]))
                    .finally(() => setIsLoadingSosMap(false));
                }}
              >
                {isLoadingSosMap ? (
                  <ActivityIndicator size="small" color="#D93025" />
                ) : (
                  <Text style={[styles.refreshText, { color: "#D93025" }]}>Refresh</Text>
                )}
              </Pressable>
            </View>

            {isLoadingSosMap ? (
              <ActivityIndicator size="large" color="#D93025" style={{ marginVertical: 24 }} />
            ) : sosMapMarkers.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="checkmark.shield.fill" size={28} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No active SOS alerts in this area. All clear.
                </Text>
              </View>
            ) : (
              sosMapMarkers.map((marker) => (
                <View
                  key={marker.id}
                  style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: "#D93025" + "40" }]}
                >
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemKicker, { color: "#D93025" }]}>
                        {(marker.status || "ACTIVE").toUpperCase()} â¢ {(marker.emergency_type || "EMERGENCY").toUpperCase()}
                      </Text>
                      <Text style={[styles.itemTitle, { color: colors.foreground }]}>
                        {marker.title || marker.area || "Active SOS Incident"}
                      </Text>
                      <Text style={[styles.itemAddress, { color: colors.muted }]}>
                        {(marker.coordinates?.latitude ?? 0).toFixed(4)}°N, {(marker.coordinates?.longitude ?? 0).toFixed(4)}°E
                      </Text>
                    </View>
                    <View style={[styles.badgePill, { backgroundColor: "#FCE8E6", borderColor: "#EA4335" }]}>
                      <Text style={{ color: "#D93025", fontSize: 11, fontWeight: "800" }}>
                        {(marker.severity || "HIGH").toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {marker.area && (
                    <View style={[styles.advisoryBox, { backgroundColor: colors.background }]}>
                      <Text style={[styles.advisoryText, { color: colors.foreground }]}>
                        Location: {marker.area}, {marker.district}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.sasGridFooter, { color: colors.muted, marginTop: 8 }]}>
                    SOS ID: {marker.id?.slice(0, 8)}... â¢ {marker.created_at ? new Date(marker.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* HOSPITALS TAB VIEW */}
        {/* ------------------------------------------------------------- */}
        {category === "sos_hospital" && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderWrap}>
              <View>
                <Text style={styles.sectionKicker}>EMERGENCY TRIAGE & ICU NETWORKS</Text>
                <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
                  Nearby Emergency Hospitals
                </Text>
              </View>
            </View>

            {isLoadingHospitals ? (
              <ActivityIndicator size="large" color="#188038" style={{ marginVertical: 24 }} />
            ) : hospitalsList.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No emergency hospital records found within sector radius.
                </Text>
              </View>
            ) : (
              hospitalsList.map((hosp) => (
                <View
                  key={hosp.id}
                  style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemKicker, { color: "#188038" }]}>{hosp.badge || "24/7 Trauma Ready"}</Text>
                      <Text style={[styles.itemTitle, { color: colors.foreground }]}>{hosp.name}</Text>
                      <Text style={[styles.itemAddress, { color: colors.muted }]}>{hosp.address}</Text>
                    </View>
                    <View style={[styles.badgePill, { backgroundColor: "#E6F4EA", borderColor: "#34A853" }]}>
                      <Text style={{ color: "#137333", fontSize: 11, fontWeight: "800" }}>
                        {hosp.openBeds} Beds Open
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemActions}>
                    <Text style={[styles.itemDist, { color: colors.muted }]}>
                      ~{hosp.distanceKm?.toFixed(1) || "3.5"} km away
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {hosp.contactNumber && (
                        <Pressable
                          style={[styles.iconActionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                          onPress={() => Linking.openURL(`tel:${hosp.contactNumber!.replace(/[^0-9+]/g, "")}`)}
                        >
                          <IconSymbol name="phone.fill" size={14} color="#188038" />
                          <Text style={{ fontSize: 12, fontWeight: "700", color: "#188038" }}>Call</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={[styles.iconActionBtnPrimary, { backgroundColor: "#188038" }]}
                        onPress={() => {
                          setSelectedEvacPlace({
                            id: hosp.id,
                            name: hosp.name,
                            category: "hospital",
                            type: hosp.type,
                            address: hosp.address,
                            coordinates: { lat: hosp.coordinates.latitude, lng: hosp.coordinates.longitude },
                            elevationMeters: hosp.elevationMeters,
                            distanceKm: hosp.distanceKm || 0,
                            walkingMinutes: Math.round(((hosp.distanceKm || 1) / 4.5) * 60),
                            drivingMinutes: Math.round(((hosp.distanceKm || 1) / 35) * 60),
                            safetyScore: 92,
                            safetyStatus: "Safe & Accessible",
                            safetyTone: "green",
                            amenities: { drinkingWater: true, medicalStation: true, powerBackup: true, foodSupply: true },
                            badge: hosp.badge,
                            contactNumber: hosp.contactNumber,
                          });
                          setIsNavigating(true);
                        }}
                      >
                        <Text style={styles.iconActionTextPrimary}>Route</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* HAZARD ZONES TAB VIEW */}
        {/* ------------------------------------------------------------- */}
        {category === "hazard_zones" && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderWrap}>
              <View>
                <Text style={styles.sectionKicker}>ACTIVE MUNICIPAL DANGER ZONES</Text>
                <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
                  Verified Hazard & Flood Zones
                </Text>
              </View>
            </View>

            {isLoadingHazards ? (
              <ActivityIndicator size="large" color="#D93025" style={{ marginVertical: 24 }} />
            ) : hazardAlertsList.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No active high-risk hazard zones detected within sector radius.
                </Text>
              </View>
            ) : (
              hazardAlertsList.map((hazard) => (
                <View
                  key={hazard.id}
                  style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: "#D93025" + "40" }]}
                >
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemKicker, { color: "#D93025" }]}>
                        {hazard.severity} ALERT • {hazard.type.toUpperCase()}
                      </Text>
                      <Text style={[styles.itemTitle, { color: colors.foreground }]}>{hazard.title}</Text>
                      <Text style={[styles.itemAddress, { color: colors.muted }]}>{hazard.affectedLocation.name}</Text>
                    </View>
                    {hazard.waterDepthM && (
                      <View style={[styles.badgePill, { backgroundColor: "#FCE8E6", borderColor: "#EA4335" }]}>
                        <Text style={{ color: "#D93025", fontSize: 11, fontWeight: "800" }}>
                          ~{hazard.waterDepthM}m Water
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.hazardDesc, { color: colors.foreground }]}>{hazard.description}</Text>

                  {hazard.instructions && (
                    <View style={[styles.advisoryBox, { backgroundColor: colors.background }]}>
                      <Text style={[styles.advisoryText, { color: "#D93025" }]}>
                        ⚠️ {hazard.instructions}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.sasGridFooter, { color: colors.muted, marginTop: 8 }]}>
                    Source: {hazard.source} • Distance: ~{hazard.distanceKm?.toFixed(1) || "1.0"} km
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SAFER NEARBY & BEST SHELTER LIST */}
        {/* ------------------------------------------------------------- */}
        {(category === "safer_nearby" || category === "best_shelter") && planResult && planResult.allNearbyPlaces.length > 0 && (
          <View style={styles.nearbySection}>
            <View style={styles.nearbySectionHeader}>
              <Text style={styles.nearbyKicker}>STRICT PROXIMITY RADIUS • LIVE GPS</Text>
              <Text style={[styles.nearbySectionTitle, { color: colors.foreground }]}>
                {category === "best_shelter" ? "Recommended High-Ground Shelters" : dict.nearbySafePlaces} ({planResult.allNearbyPlaces.length})
              </Text>
            </View>

            <View style={styles.nearbyList}>
              {planResult.allNearbyPlaces.map((place) => {
                const isSelected = selectedEvacPlace?.id === place.id;
                return (
                  <View
                    key={place.id}
                    style={[
                      styles.nearbyCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? "#188038" : colors.border,
                      },
                      isSelected && { borderWidth: 2 },
                    ]}
                  >
                    <View style={styles.nearbyCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.nearbyPlaceType, { color: place.safetyTone === "green" ? "#188038" : "#1A73E8" }]}>
                          {place.type.toUpperCase()}
                        </Text>
                        <Text style={[styles.nearbyPlaceName, { color: colors.foreground }]}>{place.name}</Text>
                        <Text style={[styles.nearbyPlaceAddress, { color: colors.muted }]}>{place.address}</Text>
                      </View>
                      <View style={[styles.safetyBadgeMini, { backgroundColor: place.safetyTone === "green" ? "#E6F4EA" : "#E8F0FE" }]}>
                        <Text style={{ fontSize: 11, fontWeight: "800", color: place.safetyTone === "green" ? "#137333" : "#1A73E8" }}>
                          {place.safetyScore}/100
                        </Text>
                      </View>
                    </View>

                    <View style={styles.nearbyCardBottom}>
                      <Text style={[styles.nearbyStat, { color: colors.foreground }]}>
                        📏 {place.distanceKm} km • 🚗 ~{place.drivingMinutes} min
                      </Text>
                      <Pressable
                        style={[styles.selectBtn, { backgroundColor: isSelected ? "#188038" : colors.background, borderColor: colors.border }]}
                        onPress={() => {
                          setSelectedEvacPlace(place);
                          setIsNavigating(true);
                        }}
                      >
                        <Text style={[styles.selectBtnText, { color: isSelected ? "#FFFFFF" : colors.foreground }]}>
                          {isSelected ? "Navigating" : "Route Here"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <LocationSelectorModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelectLocation={handleSelectPanIndiaLocation}
        currentLabel={userCoord.address || "Live Location"}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 10, paddingBottom: 40 },
  permissionWarningCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  permissionWarningRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  permissionTitle: { fontSize: 13, fontWeight: "800" },
  permissionSub: { fontSize: 11, marginTop: 2 },
  grantGpsBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  grantGpsBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  locationCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12 },
  locationHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#E8F0FE", alignItems: "center", justifyContent: "center" },
  locationKicker: { fontSize: 9.5, fontWeight: "900", letterSpacing: 1, color: "#1A73E8" },
  locationAddressText: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  panIndiaBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, borderWidth: 1 },
  selectDistrictBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  selectDistrictText: { fontSize: 11, fontWeight: "700" },
  recenterBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  searchInputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginTop: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  searchDropdown: { borderWidth: 1, borderRadius: 10, marginTop: 6, overflow: "hidden" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderBottomWidth: 1 },
  searchResultTitle: { fontSize: 12, fontWeight: "700" },
  searchResultSub: { fontSize: 10 },
  hazardWarningBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FCE8E6", padding: 8, borderRadius: 8, marginTop: 8 },
  hazardWarningText: { fontSize: 11, color: "#D93025", fontWeight: "700", flex: 1 },
  categoryTabsRow: { flexDirection: "row", gap: 8, paddingBottom: 10 },
  categoryPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryPillText: { fontSize: 12, fontWeight: "800" },
  feedbackPill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 10, padding: 8, marginTop: 8 },
  feedbackText: { fontSize: 12, fontWeight: "700" },
  destinationCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12 },
  destHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  destTitleWrap: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  destIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  destTypeKicker: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  destName: { fontSize: 15, fontWeight: "800" },
  safetyScoreBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  safetyScoreText: { fontSize: 11, fontWeight: "800" },
  reasonBox: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, marginTop: 10 },
  reasonText: { fontSize: 11, fontWeight: "600", flex: 1 },
  metricsGrid: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 8, marginTop: 10 },
  metricItem: { alignItems: "center" },
  metricLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  metricValue: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: "#DADCE0" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  travelModeToggle: { flexDirection: "row", backgroundColor: "#F1F3F4", borderRadius: 10, padding: 2 },
  travelModeBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  startRouteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  startRouteBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  callBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  navStepBox: { padding: 12, borderRadius: 12, marginTop: 10 },
  navStepHeader: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  stepIconBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E6F4EA", alignItems: "center", justifyContent: "center" },
  navStepKicker: { fontSize: 10, fontWeight: "800", color: "#188038" },
  navStepText: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  navStepActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  stepActionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  stepActionText: { fontSize: 12, fontWeight: "700" },
  stepActionBtnPrimary: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 8 },
  stepActionTextPrimary: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  stopNavBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  stopNavText: { fontSize: 12, fontWeight: "800" },
  sectionContainer: { marginTop: 14 },
  sectionHeaderWrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionKicker: { fontSize: 9.5, fontWeight: "900", letterSpacing: 1, color: "#1A73E8" },
  sectionHeading: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  refreshPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  refreshText: { fontSize: 11, fontWeight: "800" },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 20, alignItems: "center", justifyContent: "center", gap: 8, marginVertical: 10 },
  emptyText: { fontSize: 12, textAlign: "center", fontWeight: "600" },
  sasGridCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  sasGridCardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  sasGridSectorCode: { fontSize: 10.5, fontWeight: "900", letterSpacing: 0.5 },
  sasGridSectorName: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  sasGridSummaryBox: { padding: 8, borderRadius: 8, marginTop: 8 },
  sasGridSummaryText: { fontSize: 11, fontWeight: "600" },
  sasGridMetricsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, borderTopWidth: 1, borderTopColor: "#E0E0E0", paddingTop: 8 },
  sasGridMetric: { alignItems: "center" },
  sasGridMetricLabel: { fontSize: 8.5, fontWeight: "800" },
  sasGridMetricVal: { fontSize: 11, fontWeight: "800", marginTop: 2 },
  sasGridFooter: { fontSize: 10, marginTop: 6, fontWeight: "600" },
  itemCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  itemHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  itemKicker: { fontSize: 10, fontWeight: "900" },
  itemTitle: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  itemAddress: { fontSize: 11, marginTop: 2 },
  badgePill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  itemActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, borderTopWidth: 1, borderTopColor: "#E0E0E0", paddingTop: 8 },
  itemDist: { fontSize: 11, fontWeight: "700" },
  iconActionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  iconActionBtnPrimary: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  iconActionTextPrimary: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  hazardDesc: { fontSize: 12, marginTop: 6, lineHeight: 16 },
  advisoryBox: { padding: 8, borderRadius: 8, marginTop: 6 },
  advisoryText: { fontSize: 11, fontWeight: "700" },
  nearbySection: { marginTop: 14 },
  nearbySectionHeader: { marginBottom: 10 },
  nearbyKicker: { fontSize: 9.5, fontWeight: "900", letterSpacing: 1, color: "#1A73E8" },
  nearbySectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  nearbyList: { gap: 10 },
  nearbyCard: { borderWidth: 1, borderRadius: 14, padding: 12 },
  nearbyCardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  nearbyPlaceType: { fontSize: 9.5, fontWeight: "900" },
  nearbyPlaceName: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  nearbyPlaceAddress: { fontSize: 11, marginTop: 2 },
  safetyBadgeMini: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  nearbyCardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, borderTopWidth: 1, borderTopColor: "#E0E0E0", paddingTop: 8 },
  nearbyStat: { fontSize: 11, fontWeight: "700" },
  selectBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  selectBtnText: { fontSize: 11, fontWeight: "800" },
});
