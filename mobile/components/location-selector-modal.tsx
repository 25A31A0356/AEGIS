import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";
import {
  INDIA_STATES_AND_UTS,
  ALL_INDIAN_DISTRICTS,
  POPULAR_INDIAN_REGIONS,
  searchIndianLocations,
  getDistrictsForState,
  findNearestDistrict,
  IndiaDistrict,
  IndiaStateInfo,
} from "@/lib/india-locations";

export interface SelectedLocationResult {
  latitude: number;
  longitude: number;
  label: string;
  district?: string;
  state?: string;
  village?: string;
  subdistrict?: string;
  localityType?: "Village" | "Town" | "City" | "Locality" | "District";
  localityName?: string;
  nearbyPlace?: string;
  speechText?: string;
  isPinned?: boolean;
  mode: "gps" | "district" | "custom";
}

interface LocationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (result: SelectedLocationResult) => Promise<void> | void;
  currentLabel?: string;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
  currentLabel,
}) => {
  const colors = useColors();
  const { t, dict } = useAppPreferences();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<IndiaStateInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "states">("search");
  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [onlineResults, setOnlineResults] = useState<any[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Instant local district matches
  const localResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchIndianLocations(searchQuery, 30);
  }, [searchQuery]);

  // Online village search effect
  React.useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 3) {
      setOnlineResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', India')}&addressdetails=1&limit=5`,
          { headers: { 'User-Agent': 'AEGIS-Disaster/1.0' }, signal: AbortSignal.timeout(3500) }
        );
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items)) {
            const mapped = items.map((item: any) => {
              const addr = item.address || {};
              const village = addr.village || addr.hamlet || addr.suburb || addr.town || item.name;
              const district = addr.state_district || addr.district || addr.county || '';
              const state = addr.state || 'India';
              return {
                id: `online-${item.place_id}`,
                name: village ? `${village} (${district || state})` : item.name,
                state: state,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                isVillage: true,
                rawName: village || item.name,
                districtName: district,
              };
            });
            setOnlineResults(mapped);
          }
        }
      } catch {
        // Fallback to local
      } finally {
        setIsSearchingOnline(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    return [...localResults, ...onlineResults];
  }, [localResults, onlineResults]);

  // Districts for currently selected state
  const stateDistricts = useMemo(() => {
    if (!selectedState) return [];
    return getDistrictsForState(selectedState.name);
  }, [selectedState]);

  // 1-Click Live GPS Location Acquisition
  const handleUseLiveGps = async () => {
    setIsLoadingGps(true);
    setErrorMessage(null);
    try {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            let label = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
            let district = "Local District";
            let state = "India";
            try {
              const nomRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'AEGIS-Disaster/1.0' }, signal: AbortSignal.timeout(3500) }
              );
              if (nomRes.ok) {
                const nomData = await nomRes.json();
                const addr = nomData.address || {};
                const village = addr.village || addr.hamlet || addr.suburb || addr.town || addr.city;
                const mandal = addr.county || addr.subdistrict || addr.taluk;
                district = addr.state_district || addr.district || mandal || district;
                state = addr.state || state;
                const primary = village || mandal || district;
                const parts = [mandal && mandal !== primary ? mandal : undefined, district && district !== primary ? district : undefined, state].filter(Boolean);
                label = parts.length > 0 ? `${primary} • ${parts.join(', ')}` : primary;
              }
            } catch {
              const nearest = findNearestDistrict(latitude, longitude);
              district = nearest.district.name;
              state = nearest.district.state;
              label = `${district}, ${state}`;
            }

            await onSelectLocation({
              latitude,
              longitude,
              label,
              district,
              state,
              mode: "gps",
            });
            setIsLoadingGps(false);
            onClose();
          },
          async () => {
            // Fallback to Expo Location
            await fetchExpoGps();
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
        return;
      }

      await fetchExpoGps();
    } catch (e: any) {
      console.warn("[LocationModal] GPS error:", e);
      setErrorMessage("Could not acquire GPS position. Please select a district below.");
      setIsLoadingGps(false);
    }
  };

  const fetchExpoGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Location permission was denied. Please pick a district manually.");
        setIsLoadingGps(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let label = "Live Sector";
      let districtName: string | undefined;
      let stateName: string | undefined;

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        const place = reverse[0];
        if (place) {
          districtName = place.district || place.subregion || place.city || undefined;
          stateName = place.region || undefined;
          label = [districtName, stateName].filter(Boolean).join(", ") || "Live GPS Sector";
        }
      } catch {
        const nearest = findNearestDistrict(current.coords.latitude, current.coords.longitude);
        label = `${nearest.district.name}, ${nearest.district.state}`;
        districtName = nearest.district.name;
        stateName = nearest.district.state;
      }

      await onSelectLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        label,
        district: districtName,
        state: stateName,
        mode: "gps",
      });
      setIsLoadingGps(false);
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to locate GPS.");
      setIsLoadingGps(false);
    }
  };

    const handleSelectDistrict = async (d: any) => {
    const isOnlineVillage = d.isVillage || d.id?.startsWith("online-") || d.id?.startsWith("geo-");
    const vName = d.rawName || (isOnlineVillage ? d.name.split(" (")[0] : undefined);
    const dName = d.districtName || d.district || d.name;
    const sName = d.state || "India";
    const locType = isOnlineVillage ? "Village" : "District";
    const locName = vName || d.name;
    const nearby = dName && dName !== locName ? `Near ${dName}` : undefined;
    const formatted = isOnlineVillage ? `${locName} (Village) • ${nearby ? nearby + ', ' : ''}${sName}` : `${d.name}, ${sName}`;
    const speech = isOnlineVillage
      ? `Your current location is ${locName} Village${nearby ? ', ' + nearby : ''}, in ${sName}.`
      : `Your current location is ${d.name}, in ${sName}.`;

    await onSelectLocation({
      latitude: d.latitude,
      longitude: d.longitude,
      label: formatted,
      district: dName,
      state: sName,
      village: vName,
      localityType: locType,
      localityName: locName,
      nearbyPlace: nearby ? nearby.replace("Near ", "") : undefined,
      speechText: speech,
      isPinned: true,
      mode: isOnlineVillage ? "custom" : "district",
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadge}>
                <Text style={[styles.kickerText, { color: colors.primary }]}>
                  🇮🇳 PAN-INDIA DIRECTORY (780+ DISTRICTS)
                </Text>
              </View>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                {dict.choosePlace || "Choose Location"}
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.muted }]}>
                Current: <Text style={{ fontWeight: "700", color: colors.foreground }}>{currentLabel || "Visakhapatnam, AP"}</Text>
              </Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.border + "40" }]}>
              <IconSymbol name="xmark" size={16} color={colors.foreground} />
            </Pressable>
          </View>

          {/* 1-Click "My Current GPS Location" Button */}
          <Pressable
            onPress={handleUseLiveGps}
            disabled={isLoadingGps}
            style={({ pressed }) => [
              styles.gpsButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            {isLoadingGps ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <IconSymbol name="location.fill" size={18} color="#FFFFFF" />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsButtonTitle}>
                {isLoadingGps ? "Acquiring High-Accuracy GPS..." : "📍 My Current GPS Location"}
              </Text>
              <Text style={styles.gpsButtonSub}>
                Center real-time weather, disaster alerts & safe evacuation plans
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => {
              onClose();
              router.push("/gps-diagnostics");
            }}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: 8,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 16 }}>🛰️</Text>
              <View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>
                  GPS Diagnostics & Sensor Validator
                </Text>
                <Text style={{ fontSize: 10, color: colors.muted }}>
                  View live measured accuracy, satellites & provider telemetry
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={14} color={colors.muted} />
          </Pressable>

          {errorMessage && (
            <View style={[styles.errorBox, { backgroundColor: colors.error + "15", borderColor: colors.error }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* Navigation Tabs: Search & Popular vs State Drilldown */}
          <View style={[styles.tabBar, { backgroundColor: colors.border + "30" }]}>
            <Pressable
              onPress={() => {
                setActiveTab("search");
                setSelectedState(null);
              }}
              style={[
                styles.tabBtn,
                activeTab === "search" && [styles.tabBtnActive, { backgroundColor: colors.surface }],
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === "search" ? colors.primary : colors.muted },
                ]}
              >
                🔍 Search All Districts
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("states")}
              style={[
                styles.tabBtn,
                activeTab === "states" && [styles.tabBtnActive, { backgroundColor: colors.surface }],
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === "states" ? colors.primary : colors.muted },
                ]}
              >
                🗺️ 28 States & 8 UTs
              </Text>
            </Pressable>
          </View>

          {/* Tab 1: Instant Search & Popular Districts */}
          {activeTab === "search" && (
            <View style={{ flex: 1 }}>
              {/* Search Bar */}
              <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Type district name (e.g., Pune, Puri, Guntur, Shimla)..."
                  placeholderTextColor={colors.muted}
                  style={[styles.searchInput, { color: colors.foreground }]}
                  autoCapitalize="words"
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")} style={styles.clearQueryBtn}>
                    <IconSymbol name="xmark" size={12} color={colors.muted} />
                  </Pressable>
                )}
              </View>

              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {searchQuery.trim().length > 0 ? (
                  /* Search Results */
                  <View style={styles.resultsContainer}>
                    <Text style={[styles.sectionHeading, { color: colors.muted }]}>
                      MATCHING DISTRICTS ({searchResults.length})
                    </Text>
                    {searchResults.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: colors.muted }]}>
                          No districts found matching "{searchQuery}".
                        </Text>
                      </View>
                    ) : (
                      searchResults.map((d) => (
                        <Pressable
                          key={d.id}
                          onPress={() => handleSelectDistrict(d)}
                          style={({ pressed }) => [
                            styles.districtRow,
                            { borderColor: colors.border + "60" },
                            pressed && { backgroundColor: colors.border + "30" },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={styles.rowTitleWrap}>
                              <Text style={[styles.districtName, { color: colors.foreground }]}>
                                {d.name}
                              </Text>
                              {d.isCoastalDisasterZone && (
                                <View style={styles.coastalPill}>
                                  <Text style={styles.coastalPillText}>🌊 Coastal Hazard</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.districtMeta, { color: colors.muted }]}>
                              {d.state} {d.isUT ? "• UT" : ""} • {d.latitude.toFixed(2)}°N, {d.longitude.toFixed(2)}°E
                            </Text>
                          </View>
                          <IconSymbol name="chevron.right" size={14} color={colors.muted} />
                        </Pressable>
                      ))
                    )}
                  </View>
                ) : (
                  /* Major Hubs & Disaster Prone Zones */
                  <View>
                    <Text style={[styles.sectionHeading, { color: colors.muted }]}>
                      ⚡ QUICK ACCESS CORRIDORS & METROS
                    </Text>
                    <View style={styles.quickGrid}>
                      {POPULAR_INDIAN_REGIONS.map((region) => (
                        <Pressable
                          key={region.id}
                          onPress={() => handleSelectDistrict(region)}
                          style={({ pressed }) => [
                            styles.quickChip,
                            { backgroundColor: colors.border + "30", borderColor: colors.border },
                            pressed && { backgroundColor: colors.primary + "20" },
                          ]}
                        >
                          <Text style={[styles.quickChipName, { color: colors.foreground }]}>
                            {region.name}
                          </Text>
                          <Text numberOfLines={1} style={[styles.quickChipState, { color: colors.muted }]}>
                            {region.state}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Text style={[styles.sectionHeading, { color: colors.muted, marginTop: 18 }]}>
                      📍 ALL 780+ DISTRICT DIRECTORY
                    </Text>
                    <Text style={[styles.helperBody, { color: colors.muted }]}>
                      Use the search bar above or switch to the "28 States & 8 UTs" tab to browse by state.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Tab 2: State -> District Drilldown Selector */}
          {activeTab === "states" && (
            <View style={{ flex: 1 }}>
              {selectedState ? (
                /* Selected State's Districts List */
                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => setSelectedState(null)}
                    style={[styles.backToStatesBtn, { borderColor: colors.border }]}
                  >
                    <IconSymbol name="chevron.right" size={14} color={colors.primary} style={{ transform: [{ rotate: "180deg" }] }} />
                    <Text style={[styles.backToStatesText, { color: colors.primary }]}>
                      Back to All States & UTs
                    </Text>
                  </Pressable>

                  <View style={styles.selectedStateHeader}>
                    <Text style={[styles.selectedStateTitle, { color: colors.foreground }]}>
                      {selectedState.name}
                    </Text>
                    <Text style={[styles.selectedStateSubtitle, { color: colors.muted }]}>
                      {stateDistricts.length} Administrative Districts • Capital: {selectedState.capital}
                    </Text>
                  </View>

                  <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                    {stateDistricts.map((d) => (
                      <Pressable
                        key={d.id}
                        onPress={() => handleSelectDistrict(d)}
                        style={({ pressed }) => [
                          styles.districtRow,
                          { borderColor: colors.border + "60" },
                          pressed && { backgroundColor: colors.border + "30" },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.rowTitleWrap}>
                            <Text style={[styles.districtName, { color: colors.foreground }]}>
                              {d.name}
                            </Text>
                            {d.isCoastalDisasterZone && (
                              <View style={styles.coastalPill}>
                                <Text style={styles.coastalPillText}>🌊 Coastal</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.districtMeta, { color: colors.muted }]}>
                            {d.latitude.toFixed(3)}°N, {d.longitude.toFixed(3)}°E
                          </Text>
                        </View>
                        <IconSymbol name="chevron.right" size={14} color={colors.muted} />
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                /* 28 States & 8 UTs List */
                <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.sectionHeading, { color: colors.muted }]}>
                    28 STATES & 8 UNION TERRITORIES OF INDIA
                  </Text>
                  {INDIA_STATES_AND_UTS.map((st) => (
                    <Pressable
                      key={st.code}
                      onPress={() => setSelectedState(st)}
                      style={({ pressed }) => [
                        styles.stateRow,
                        { borderColor: colors.border + "60" },
                        pressed && { backgroundColor: colors.border + "30" },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.rowTitleWrap}>
                          <Text style={[styles.stateName, { color: colors.foreground }]}>
                            {st.name}
                          </Text>
                          {st.isUT && (
                            <View style={[styles.utPill, { backgroundColor: colors.primary + "18" }]}>
                              <Text style={[styles.utPillText, { color: colors.primary }]}>UT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.stateMeta, { color: colors.muted }]}>
                          {st.districtsCount} Districts • Zone: {st.zone} • Capital: {st.capital}
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={14} color={colors.muted} />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    height: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerBadge: {
    marginBottom: 4,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsButtonTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  gpsButtonSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    marginTop: 1,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  tabBtnActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: "100%",
  },
  clearQueryBtn: {
    padding: 4,
  },
  scrollArea: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  helperBody: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  resultsContainer: {
    gap: 6,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
  },
  districtRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  rowTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  districtName: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  coastalPill: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coastalPillText: {
    color: "#0369A1",
    fontSize: 9,
    fontWeight: "800",
  },
  districtMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  quickChip: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  quickChipName: {
    fontSize: 12.5,
    fontWeight: "800",
  },
  quickChipState: {
    fontSize: 10.5,
    marginTop: 2,
  },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  stateName: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  utPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  utPillText: {
    fontSize: 9.5,
    fontWeight: "900",
  },
  stateMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  backToStatesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backToStatesText: {
    fontSize: 12,
    fontWeight: "800",
  },
  selectedStateHeader: {
    marginBottom: 10,
  },
  selectedStateTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  selectedStateSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
});
