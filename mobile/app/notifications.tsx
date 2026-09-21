import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAegisData } from "@/hooks/use-aegis-data";
import { HazardSeverity, HazardType } from "@/lib/services/aegis-types";

type FilterType = "all" | "critical" | "active" | "weather";

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    hazardAlerts,
    isLoading,
    isRefreshing,
    dataFreshness,
    lastUpdatedFormatted,
    refresh,
  } = useAegisData();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredAlerts = useMemo(() => {
    return hazardAlerts.filter((alert) => {
      if (activeFilter === "critical") {
        return alert.severity === "CRITICAL" || alert.severity === "HIGH";
      }
      if (activeFilter === "active") {
        return alert.status === "ACTIVE";
      }
      if (activeFilter === "weather") {
        return alert.type === "cyclone" || alert.type === "flood" || alert.type === "severe_weather";
      }
      return true;
    });
  }, [hazardAlerts, activeFilter]);

  const getHazardIcon = (type: HazardType) => {
    switch (type) {
      case "flood":
        return "drop.fill";
      case "cyclone":
        return "wind";
      case "earthquake":
        return "waveform.path.ecg";
      case "wildfire":
        return "flame.fill";
      case "severe_weather":
        return "cloud.bolt.rain.fill";
      default:
        return "exclamationmark.triangle.fill";
    }
  };

  const getSeverityStyle = (severity: HazardSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return { bg: "#D93025" + "18", text: "#D93025", border: "#D93025" };
      case "HIGH":
        return { bg: "#EA580C" + "18", text: "#EA580C", border: "#EA580C" };
      case "MODERATE":
        return { bg: "#D97706" + "18", text: "#D97706", border: "#D97706" };
      case "LOW":
        return { bg: "#16A34A" + "18", text: "#16A34A", border: "#16A34A" };
      default:
        return { bg: colors.primary + "18", text: colors.primary, border: colors.primary };
    }
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.back}>
          <IconSymbol
            name="chevron.right"
            size={18}
            color={colors.primary}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </Pressable>

        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.kicker, { color: colors.error }]}>AEGIS ALERT NETWORK</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Hazard Alerts</Text>
          </View>
          <View
            style={[
              styles.freshnessTag,
              {
                backgroundColor:
                  dataFreshness === "LIVE" ? colors.success + "18" : colors.warning + "18",
                borderColor: dataFreshness === "LIVE" ? colors.success : colors.warning,
              },
            ]}
          >
            <Text
              style={[
                styles.freshnessText,
                { color: dataFreshness === "LIVE" ? colors.success : colors.warning },
              ]}
            >
              {dataFreshness}
            </Text>
          </View>
        </View>

        <Text style={[styles.intro, { color: colors.muted }]}>
          Verified regional hazard bulletins, severe climate alerts, and emergency directives.
        </Text>

        <Text style={[styles.updatedText, { color: colors.muted }]}>
          {lastUpdatedFormatted}
        </Text>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <FilterChip
            label="All Alerts"
            active={activeFilter === "all"}
            onPress={() => setActiveFilter("all")}
            colors={colors}
            count={hazardAlerts.length}
          />
          <FilterChip
            label="Critical / High"
            active={activeFilter === "critical"}
            onPress={() => setActiveFilter("critical")}
            colors={colors}
            tone="red"
          />
          <FilterChip
            label="Active Directives"
            active={activeFilter === "active"}
            onPress={() => setActiveFilter("active")}
            colors={colors}
          />
          <FilterChip
            label="Weather & Flood"
            active={activeFilter === "weather"}
            onPress={() => setActiveFilter("weather")}
            colors={colors}
          />
        </ScrollView>

        {/* Alerts List */}
        {isLoading && hazardAlerts.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Connecting to Aegis Alert Service...
            </Text>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <IconSymbol name="checkmark.shield.fill" size={36} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Hazards In This Category
            </Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>
              All local monitoring stations report normal baseline conditions.
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => {
            const sevStyle = getSeverityStyle(alert.severity);
            const iconName = getHazardIcon(alert.type);

            return (
              <View
                key={alert.id}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: alert.severity === "CRITICAL" ? colors.error : colors.border,
                  },
                ]}
              >
                {/* Alert Top Bar: Type, Severity, Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.typeWrap}>
                    <View style={[styles.iconCircle, { backgroundColor: sevStyle.bg }]}>
                      <IconSymbol name={iconName} size={18} color={sevStyle.text} />
                    </View>
                    <View>
                      <Text style={[styles.hazardType, { color: colors.muted }]}>
                        {alert.type.toUpperCase().replace("_", " ")}
                      </Text>
                      <Text style={[styles.locationAffected, { color: colors.foreground }]}>
                        📍 {alert.affectedLocation.name}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: sevStyle.bg, borderColor: sevStyle.border },
                    ]}
                  >
                    <Text style={[styles.severityText, { color: sevStyle.text }]}>
                      {alert.severity}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={[styles.alertTitle, { color: colors.foreground }]}>
                  {alert.title}
                </Text>

                {/* Description */}
                <Text style={[styles.alertDesc, { color: colors.muted }]}>
                  {alert.description}
                </Text>

                {/* Directive / Instructions */}
                {alert.instructions && (
                  <View
                    style={[
                      styles.instructionsBox,
                      { backgroundColor: sevStyle.bg, borderColor: sevStyle.border + "40" },
                    ]}
                  >
                    <Text style={[styles.instructionsTitle, { color: sevStyle.text }]}>
                      DIRECTIVE / ACTION:
                    </Text>
                    <Text style={[styles.instructionsText, { color: colors.foreground }]}>
                      {alert.instructions}
                    </Text>
                  </View>
                )}

                {/* Metadata: Issued, Expires, Source */}
                <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                  <View style={styles.metaLeft}>
                    <Text style={[styles.metaItemText, { color: colors.muted }]}>
                      Issued: {new Date(alert.issuedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Expires: {new Date(alert.expiresAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </Text>
                    <Text style={[styles.sourceText, { color: colors.primary }]}>
                      Source: {alert.source}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          alert.status === "ACTIVE" ? colors.success + "18" : colors.muted + "18",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: alert.status === "ACTIVE" ? colors.success : colors.muted },
                      ]}
                    >
                      {alert.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  colors,
  count,
  tone,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  count?: number;
  tone?: "red";
}) {
  const activeBg = tone === "red" ? colors.error : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? activeBg : colors.surface,
          borderColor: active ? activeBg : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: active ? "#ffffff" : colors.foreground, fontWeight: active ? "800" : "600" },
        ]}
      >
        {label} {count !== undefined ? `(${count})` : ""}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 14, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 18 },
  backText: { fontSize: 12, fontWeight: "800" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  kicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { fontSize: 28, fontWeight: "900", marginTop: 4 },
  freshnessTag: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, marginTop: 4 },
  freshnessText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  intro: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  updatedText: { fontSize: 11, fontWeight: "600", marginTop: 4, marginBottom: 14 },
  filterRow: { gap: 8, paddingBottom: 16 },
  filterChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipText: { fontSize: 12 },
  loadingBox: { padding: 40, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 12, fontWeight: "600" },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 24, alignItems: "center", gap: 8, marginTop: 20 },
  emptyTitle: { fontSize: 15, fontWeight: "800" },
  emptySub: { fontSize: 12, textAlign: "center" },
  alertCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  typeWrap: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hazardType: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  locationAffected: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  severityBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  severityText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  alertTitle: { fontSize: 16, fontWeight: "800", lineHeight: 22, marginBottom: 6 },
  alertDesc: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  instructionsBox: { borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 12 },
  instructionsTitle: { fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 3 },
  instructionsText: { fontSize: 12, fontWeight: "600", lineHeight: 17 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 10 },
  metaLeft: { flex: 1, gap: 2 },
  metaItemText: { fontSize: 10, fontWeight: "600" },
  sourceText: { fontSize: 10, fontWeight: "700" },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
});
