import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useDeviceGps } from "@/hooks/use-device-gps";
import { speakAegisLocation } from "@/lib/services/aegis-location";

export default function GpsDiagnosticsScreen() {
  const colors = useColors();
  const router = useRouter();

  const {
    location,
    latitude,
    longitude,
    accuracyMeters,
    accuracyTier,
    provider,
    isMockLocation,
    permissionGranted,
    locationServicesEnabled,
    isLoading,
    isLiveTracking,
    syncedQueueCount,
    fetchGpsFix,
    toggleLiveTracking,
    syncQueue,
  } = useDeviceGps({ autoFetch: true });

  const [liveAgeSeconds, setLiveAgeSeconds] = useState<number>(0);

  // Live ticking age counter
  useEffect(() => {
    const timer = setInterval(() => {
      if (location?.timestamp) {
        const age = Math.max(0, Math.round((Date.now() - new Date(location.timestamp).getTime()) / 1000));
        setLiveAgeSeconds(age);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [location?.timestamp]);

  const tierColor =
    accuracyTier === "HIGH_QUALITY"
      ? "#10B981" // Emerald Green (<=10m)
      : accuracyTier === "USABLE"
      ? "#06B6D4" // Cyan (10-25m)
      : accuracyTier === "APPROXIMATE"
      ? "#F59E0B" // Amber (25-50m)
      : "#EF4444"; // Red (>50m)

  const shareDiagnostics = async () => {
    if (!location) return;
    const payload = JSON.stringify(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracyMeters: location.accuracyMeters,
        accuracyTier: location.accuracyTier,
        altitudeMeters: location.altitudeMeters,
        speedMps: location.speedMps,
        bearingDegrees: location.bearingDegrees,
        timestamp: location.timestamp,
        provider: location.provider,
        isMockLocation: location.isMockLocation,
        permissionGranted: location.permissionGranted,
        locationServicesEnabled: location.locationServicesEnabled,
      },
      null,
      2
    );
    await Share.share({
      title: "AEGIS Native GPS Diagnostic Telemetry",
      message: payload,
    });
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} enableSwipeTabs={false}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.right" size={20} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>GPS Diagnostic Core</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>Hardware GNSS / Fused Precision Validator</Text>
        </View>
        <Pressable onPress={shareDiagnostics} style={styles.shareBtn}>
          <IconSymbol name="square.and.arrow.up" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Primary Precision Hero Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: tierColor, borderWidth: 1.5 }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + "20", borderColor: tierColor }]}>
              <View style={[styles.dot, { backgroundColor: tierColor }]} />
              <Text style={[styles.tierText, { color: tierColor }]}>
                {accuracyTier} FIX
              </Text>
            </View>
            <Text style={[styles.ageText, { color: liveAgeSeconds > 30 ? "#EF4444" : colors.muted }]}>
              Age: {liveAgeSeconds}s {liveAgeSeconds > 30 ? "(STALE)" : "(FRESH)"}
            </Text>
          </View>

          {/* Precision Lat/Lng Coordinates (8 decimal places) */}
          <View style={styles.coordinateBox}>
            <View style={styles.coordCol}>
              <Text style={[styles.coordLabel, { color: colors.muted }]}>LATITUDE</Text>
              <Text style={[styles.coordValue, { color: colors.foreground }]}>
                {latitude !== null ? latitude.toFixed(8) : "Acquiring..."}
              </Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordCol}>
              <Text style={[styles.coordLabel, { color: colors.muted }]}>LONGITUDE</Text>
              <Text style={[styles.coordValue, { color: colors.foreground }]}>
                {longitude !== null ? longitude.toFixed(8) : "Acquiring..."}
              </Text>
            </View>
          </View>

          {/* Accuracy Meters Highlight */}
          <View style={styles.accuracyRow}>
            <Text style={[styles.accuracyLabel, { color: colors.muted }]}>Measured Accuracy:</Text>
            <Text style={[styles.accuracyValue, { color: tierColor }]}>
              ±{accuracyMeters !== null ? accuracyMeters.toFixed(2) : "--"} meters
            </Text>
          </View>
        </View>

        {/* 2. Hardware Sensor & Telemetry Metrics */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sensor Telemetry</Text>

          <View style={styles.metricGrid}>
            <View style={[styles.metricItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.mLabel, { color: colors.muted }]}>Provider</Text>
              <Text style={[styles.mVal, { color: colors.foreground }]}>{provider}</Text>
            </View>

            <View style={[styles.metricItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.mLabel, { color: colors.muted }]}>Mock State</Text>
              <Text style={[styles.mVal, { color: isMockLocation ? "#EF4444" : "#10B981" }]}>
                {isMockLocation ? "MOCK DETECTED" : "AUTHENTIC"}
              </Text>
            </View>

            <View style={[styles.metricItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.mLabel, { color: colors.muted }]}>Altitude</Text>
              <Text style={[styles.mVal, { color: colors.foreground }]}>
                {location?.altitudeMeters !== null && location?.altitudeMeters !== undefined
                  ? `${location.altitudeMeters.toFixed(1)} m`
                  : "N/A"}
              </Text>
            </View>

            <View style={[styles.metricItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.mLabel, { color: colors.muted }]}>Speed</Text>
              <Text style={[styles.mVal, { color: colors.foreground }]}>
                {location?.speedMps !== null && location?.speedMps !== undefined
                  ? `${(location.speedMps * 3.6).toFixed(1)} km/h`
                  : "0.0 km/h"}
              </Text>
            </View>

            <View style={[styles.metricItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.mLabel, { color: colors.muted }]}>Bearing / Heading</Text>
              <Text style={[styles.mVal, { color: colors.foreground }]}>
                {location?.bearingDegrees !== null && location?.bearingDegrees !== undefined
                  ? `${location.bearingDegrees.toFixed(1)}°`
                  : "N/A"}
              </Text>
            </View>

            <View style={[styles.metricItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.mLabel, { color: colors.muted }]}>Offline Sync Queue</Text>
              <Text style={[styles.mVal, { color: colors.primary }]}>
                {syncedQueueCount > 0 ? `${syncedQueueCount} Synced` : "Clean"}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. System Permission & Service Health */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>System Status</Text>

          <View style={styles.statusRow}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>Location Services (Hardware GPS)</Text>
            <Text style={[styles.statusBadgeText, { color: locationServicesEnabled ? "#10B981" : "#EF4444" }]}>
              {locationServicesEnabled ? "ENABLED" : "DISABLED"}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>Fine/Precise Location Permission</Text>
            <Text style={[styles.statusBadgeText, { color: permissionGranted ? "#10B981" : "#EF4444" }]}>
              {permissionGranted ? "ACCESS_FINE_LOCATION" : "DENIED"}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>Live Stream Watcher</Text>
            <Text style={[styles.statusBadgeText, { color: isLiveTracking ? "#10B981" : colors.muted }]}>
              {isLiveTracking ? "ACTIVE (3000ms)" : "STANDBY"}
            </Text>
          </View>
        </View>

        {/* 4. Action Controls */}
        <View style={styles.btnRow}>
          <Pressable
            onPress={fetchGpsFix}
            disabled={isLoading}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Re-acquire High-Accuracy Fix</Text>
            )}
          </Pressable>

          <Pressable
            onPress={toggleLiveTracking}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isLiveTracking ? "#EF4444" : colors.surface,
                borderColor: isLiveTracking ? "#EF4444" : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.secondaryBtnText,
                { color: isLiveTracking ? "#FFFFFF" : colors.foreground },
              ]}
            >
              {isLiveTracking ? "Stop Live Tracking" : "Start Live 3s Stream"}
            </Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              const count = await syncQueue();
              Alert.alert("Offline Sync", `Synchronized ${count} cached location reading(s) with backend.`);
            }}
            style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Sync Offline Queue</Text>
          </Pressable>

          <Pressable
            onPress={() => speakAegisLocation(location?.speechText)}
            style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>🔊 Speak Location Fix</Text>
          </Pressable>
        </View>

        {/* 5. Raw JSON Telemetry Inspector */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Raw Location Data Model</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {JSON.stringify(
                {
                  latitude: location?.latitude,
                  longitude: location?.longitude,
                  accuracyMeters: location?.accuracyMeters,
                  altitudeMeters: location?.altitudeMeters,
                  speedMps: location?.speedMps,
                  bearingDegrees: location?.bearingDegrees,
                  timestamp: location?.timestamp,
                  provider: location?.provider,
                  isMockLocation: location?.isMockLocation,
                },
                null,
                2
              )}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 11,
  },
  shareBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  ageText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  coordinateBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  coordCol: {
    flex: 1,
  },
  coordDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#334155",
    marginHorizontal: 12,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  coordValue: {
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  accuracyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(100, 116, 139, 0.2)",
  },
  accuracyLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  accuracyValue: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricItem: {
    width: "48%",
    padding: 10,
    borderRadius: 10,
  },
  mLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  mVal: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(100, 116, 139, 0.15)",
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  btnRow: {
    gap: 8,
  },
  primaryBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  codeBlock: {
    backgroundColor: "#0B0F19",
    padding: 12,
    borderRadius: 10,
  },
  codeText: {
    color: "#06B6D4",
    fontFamily: "monospace",
    fontSize: 11,
  },
});
