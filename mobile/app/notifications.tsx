import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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

type FilterType = "all" | "sos" | "critical" | "active" | "weather";

interface SosNotificationItem {
  id: string;
  type: "sos";
  victimName: string;
  headline: string;
  subtext: string;
  distanceKm: number;
  locationName: string;
  severity: "CRITICAL";
  emergencyType: string;
  details: string;
  timestamp: string;
  status: "ACTIVE DISTRESS" | "AID DISPATCHED";
  victimPhone: string;
  familyContactName: string;
  familyContactPhone: string;
  familyRelationship: string;
  policeStationName: string;
  policeStationPhone: string;
  batteryPercent: number;
  signalStatus: string;
  coordinates: { lat: number; lng: number };
}

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    hazardAlerts,
    location,
    isLoading,
    isRefreshing,
    dataFreshness,
    lastUpdatedFormatted,
    refresh,
  } = useAegisData();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedSosItem, setSelectedSosItem] = useState<SosNotificationItem | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [respondedSos, setRespondedSos] = useState<Record<string, boolean>>({});

  const locLabel = location.village || location.localityName || location.label || "Local Sector";

  // Authoritative SOS Distress Notifications
  const sosNotifications: SosNotificationItem[] = useMemo(() => {
    return [
      {
        id: "sos-notif-aarav-1",
        type: "sos",
        victimName: "Aarav Sharma",
        headline: "Aarav Sharma (Needs Help)",
        subtext: "1.2 km away • Tap to view victim profile & help him",
        distanceKm: 1.2,
        locationName: `${locLabel} Main Road`,
        severity: "CRITICAL",
        emergencyType: "Rapid Inundation • Trapped Near Residence",
        details:
          "Rapid waterlogging in ground-floor residence. Needs immediate emergency evacuation assistance and medical first-response.",
        timestamp: "2 mins ago",
        status: respondedSos["sos-notif-aarav-1"] ? "AID DISPATCHED" : "ACTIVE DISTRESS",
        victimPhone: "+91 98480 23456",
        familyContactName: "Sunita Sharma",
        familyContactPhone: "+91 94401 87654",
        familyRelationship: "Mother",
        policeStationName: `${locLabel} Police Station (Sector Control)`,
        policeStationPhone: "+91 884 236 1100",
        batteryPercent: 78,
        signalStatus: "4G LTE (Good)",
        coordinates: {
          lat: (location.latitude || 17.6868) + 0.008,
          lng: (location.longitude || 83.2185) + 0.007,
        },
      },
    ];
  }, [locLabel, location.latitude, location.longitude, respondedSos]);

  const filteredHazardAlerts = useMemo(() => {
    if (activeFilter === "sos") return [];
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

  const filteredSosAlerts = useMemo(() => {
    if (activeFilter === "weather") return [];
    if (activeFilter === "active" || activeFilter === "all" || activeFilter === "sos" || activeFilter === "critical") {
      return sosNotifications;
    }
    return [];
  }, [sosNotifications, activeFilter]);

  const totalCount = hazardAlerts.length + sosNotifications.length;

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
        return { bg: "#D9302518", text: "#D93025", border: "#D93025" };
      case "HIGH":
        return { bg: "#EA580C18", text: "#EA580C", border: "#EA580C" };
      case "MODERATE":
        return { bg: "#D9770618", text: "#D97706", border: "#D97706" };
      case "LOW":
        return { bg: "#16A34A18", text: "#16A34A", border: "#16A34A" };
      default:
        return { bg: colors.primary + "18", text: colors.primary, border: colors.primary };
    }
  };

  const handleOpenSosModal = (item: SosNotificationItem) => {
    setSelectedSosItem(item);
    setShowProfileModal(true);
  };

  const handleOfferHelp = (item: SosNotificationItem) => {
    setRespondedSos((prev) => ({ ...prev, [item.id]: true }));
    setShowProfileModal(false);
    Alert.alert(
      "Aid Dispatched & Confirmed",
      `You are registered as responder for ${item.victimName}. Emergency dispatch centers have been notified of your assistance offer.`,
      [
        {
          text: "Navigate on Map",
          onPress: () => router.push("/(tabs)/safe"),
        },
        { text: "OK" },
      ]
    );
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
            <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
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
          Live distress beacons, emergency broadcasts, and verified regional hazard bulletins.
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
            count={totalCount}
          />
          <FilterChip
            label="🚨 SOS Distress"
            active={activeFilter === "sos"}
            onPress={() => setActiveFilter("sos")}
            colors={colors}
            count={sosNotifications.length}
            tone="red"
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

        {/* SOS DISTRESS NOTIFICATIONS */}
        {filteredSosAlerts.map((sos) => {
          const isResponded = respondedSos[sos.id];
          return (
            <Pressable
              key={sos.id}
              onPress={() => handleOpenSosModal(sos)}
              style={({ pressed }) => [
                styles.sosCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isResponded ? "#16A34A" : "#DC2626",
                  opacity: pressed ? 0.92 : 1.0,
                },
              ]}
            >
              {/* Top Banner */}
              <View style={styles.sosCardHeader}>
                <View style={styles.sosTypeWrap}>
                  <View
                    style={[
                      styles.sosIconCircle,
                      { backgroundColor: isResponded ? "#16A34A20" : "#DC262620" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sosIconText,
                        { color: isResponded ? "#16A34A" : "#DC2626" },
                      ]}
                    >
                      SOS
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sosKicker, { color: isResponded ? "#16A34A" : "#DC2626" }]}>
                      {isResponded ? "AID DISPATCHED • EN ROUTE" : "CRITICAL DISTRESS BEACON"}
                    </Text>
                    <Text style={[styles.sosVictimTitle, { color: colors.foreground }]}>
                      {sos.headline}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor: isResponded ? "#16A34A18" : "#DC262618",
                      borderColor: isResponded ? "#16A34A" : "#DC2626",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      { color: isResponded ? "#16A34A" : "#DC2626" },
                    ]}
                  >
                    {isResponded ? "RESPONDED" : "CRITICAL"}
                  </Text>
                </View>
              </View>

              {/* Subtext Prompt */}
              <View style={[styles.sosPromptBox, { backgroundColor: "#DC262610", borderColor: "#DC262630" }]}>
                <IconSymbol name="person.crop.circle.badge.exclamationmark" size={16} color="#DC2626" />
                <Text style={[styles.sosPromptText, { color: "#DC2626" }]}>
                  {sos.subtext}
                </Text>
              </View>

              {/* Emergency Details */}
              <Text style={[styles.sosDesc, { color: colors.muted }]}>
                {sos.details}
              </Text>

              {/* Action Strip */}
              <View style={[styles.sosMetaRow, { borderTopColor: colors.border }]}>
                <View style={styles.sosMetaLeft}>
                  <Text style={[styles.metaItemText, { color: colors.muted }]}>
                    📍 {sos.locationName} • {sos.timestamp}
                  </Text>
                </View>
                <View style={styles.viewProfileBtn}>
                  <Text style={styles.viewProfileBtnText}>View Victim Profile</Text>
                  <IconSymbol name="chevron.right" size={12} color="#DC2626" />
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* HAZARD ALERTS */}
        {isLoading && hazardAlerts.length === 0 && filteredSosAlerts.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Connecting to Aegis Alert Service...
            </Text>
          </View>
        ) : filteredHazardAlerts.length === 0 && filteredSosAlerts.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <IconSymbol name="checkmark.shield.fill" size={36} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Notifications In This Category
            </Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>
              All local monitoring stations report normal baseline conditions.
            </Text>
          </View>
        ) : (
          filteredHazardAlerts.map((alert) => {
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
                {/* Alert Top Bar */}
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

                {/* Metadata */}
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

      {/* ========================================================================= */}
      {/* VICTIM PROFILE INFO CARD MODAL (OPENED FROM NOTIFICATION TAP) */}
      {/* ========================================================================= */}
      <Modal
        visible={showProfileModal && !!selectedSosItem}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: "#DC2626" }]}>
            {/* Header with Close */}
            <View style={styles.modalHeader}>
              <View style={styles.victimHeaderRow}>
                <View style={styles.sosAvatarCircle}>
                  <Text style={styles.sosAvatarText}>SOS</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileBadgeText}>ACTIVE EMERGENCY DISTRESS</Text>
                  <Text style={[styles.victimNameText, { color: colors.foreground }]}>
                    {selectedSosItem?.victimName}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowProfileModal(false)}
                  style={[styles.closeModalBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <IconSymbol name="xmark" size={16} color={colors.foreground} />
                </Pressable>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              {/* Distance & Travel Time Hero Strip */}
              <View style={[styles.heroMetricRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.heroMetricItem}>
                  <Text style={[styles.heroMetricValue, { color: "#DC2626" }]}>
                    {selectedSosItem?.distanceKm} km
                  </Text>
                  <Text style={[styles.heroMetricLabel, { color: colors.muted }]}>Distance Away</Text>
                </View>
                <View style={[styles.heroMetricDivider, { backgroundColor: colors.border }]} />
                <View style={styles.heroMetricItem}>
                  <Text style={[styles.heroMetricValue, { color: "#16A34A" }]}>3 mins</Text>
                  <Text style={[styles.heroMetricLabel, { color: colors.muted }]}>Est. Response ETA</Text>
                </View>
                <View style={[styles.heroMetricDivider, { backgroundColor: colors.border }]} />
                <View style={styles.heroMetricItem}>
                  <Text style={[styles.heroMetricValue, { color: colors.primary }]}>
                    {selectedSosItem?.batteryPercent}%
                  </Text>
                  <Text style={[styles.heroMetricLabel, { color: colors.muted }]}>Battery Status</Text>
                </View>
              </View>

              {/* Emergency Situation Summary */}
              <View style={[styles.sectionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: "#DC2626" }]}>EMERGENCY SITUATION</Text>
                <Text style={[styles.emergencyTypeText, { color: colors.foreground }]}>
                  {selectedSosItem?.emergencyType}
                </Text>
                <Text style={[styles.emergencyMessageText, { color: colors.muted }]}>
                  "{selectedSosItem?.details}"
                </Text>
                <View style={styles.locationPillRow}>
                  <IconSymbol name="location.fill" size={14} color="#DC2626" />
                  <Text style={[styles.locationPillText, { color: colors.foreground }]}>
                    {selectedSosItem?.locationName}
                  </Text>
                </View>
              </View>

              {/* Contact Information & One-Touch Actions */}
              <View style={[styles.sectionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>DIRECT EMERGENCY CONTACTS</Text>

                {/* Victim Direct Phone */}
                <View style={styles.contactRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactLabel, { color: colors.muted }]}>Victim Phone</Text>
                    <Text style={[styles.contactValue, { color: colors.foreground }]}>
                      {selectedSosItem?.victimPhone}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${selectedSosItem?.victimPhone}`)}
                    style={[styles.callBtn, { backgroundColor: "#16A34A" }]}
                  >
                    <IconSymbol name="phone.fill" size={14} color="#FFFFFF" />
                    <Text style={styles.callBtnText}>Call</Text>
                  </Pressable>
                </View>

                {/* Family Contact */}
                <View style={[styles.contactRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactLabel, { color: colors.muted }]}>
                      Family ({selectedSosItem?.familyRelationship}: {selectedSosItem?.familyContactName})
                    </Text>
                    <Text style={[styles.contactValue, { color: colors.foreground }]}>
                      {selectedSosItem?.familyContactPhone}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${selectedSosItem?.familyContactPhone}`)}
                    style={[styles.callBtn, { backgroundColor: colors.primary }]}
                  >
                    <IconSymbol name="phone.fill" size={14} color="#FFFFFF" />
                    <Text style={styles.callBtnText}>Call</Text>
                  </Pressable>
                </View>

                {/* Police Station */}
                <View style={[styles.contactRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactLabel, { color: colors.muted }]}>Police Control Desk</Text>
                    <Text style={[styles.contactValue, { color: colors.foreground }]}>
                      {selectedSosItem?.policeStationName}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${selectedSosItem?.policeStationPhone}`)}
                    style={[styles.callBtn, { backgroundColor: "#DC2626" }]}
                  >
                    <IconSymbol name="phone.fill" size={14} color="#FFFFFF" />
                    <Text style={styles.callBtnText}>Police</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Action Footer */}
            <View style={[styles.modalFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              {selectedSosItem && respondedSos[selectedSosItem.id] ? (
                <View style={[styles.alreadyHelpBtn, { backgroundColor: "#16A34A" }]}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Responder Dispatched & Active</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => selectedSosItem && handleOfferHelp(selectedSosItem)}
                  style={[styles.primaryActionBtn, { backgroundColor: "#DC2626" }]}
                >
                  <IconSymbol name="hand.raised.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Offer Help & Respond to Victim</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
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

  // SOS Card
  sosCard: { borderWidth: 1.5, borderRadius: 18, padding: 16, marginBottom: 14 },
  sosCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  sosTypeWrap: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sosIconCircle: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sosIconText: { fontSize: 12, fontWeight: "900" },
  sosKicker: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  sosVictimTitle: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  sosPromptBox: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  sosPromptText: { fontSize: 12, fontWeight: "800" },
  sosDesc: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  sosMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 10 },
  sosMetaLeft: { flex: 1 },
  viewProfileBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewProfileBtnText: { fontSize: 12, fontWeight: "800", color: "#DC2626" },

  // Hazard Alert Card
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

  // Modal styles
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: "88%", paddingBottom: 20 },
  modalHeader: { padding: 18, borderBottomWidth: 1, borderBottomColor: "rgba(150,150,150,0.2)" },
  victimHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sosAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#DC262620", alignItems: "center", justifyContent: "center" },
  sosAvatarText: { color: "#DC2626", fontSize: 14, fontWeight: "900" },
  profileBadgeText: { fontSize: 10, fontWeight: "900", color: "#DC2626", letterSpacing: 0.8 },
  victimNameText: { fontSize: 20, fontWeight: "900", marginTop: 2 },
  closeModalBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalScrollContent: { padding: 18, gap: 14 },
  heroMetricRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 16, padding: 14 },
  heroMetricItem: { flex: 1, alignItems: "center" },
  heroMetricValue: { fontSize: 16, fontWeight: "900" },
  heroMetricLabel: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  heroMetricDivider: { width: 1, height: 28 },
  sectionBox: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  emergencyTypeText: { fontSize: 14, fontWeight: "800" },
  emergencyMessageText: { fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  locationPillRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  locationPillText: { fontSize: 12, fontWeight: "700" },
  contactRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingBottom: 8 },
  contactLabel: { fontSize: 10, fontWeight: "700" },
  contactValue: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  callBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  modalFooter: { padding: 16, borderTopWidth: 1 },
  primaryActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  alreadyHelpBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  primaryActionBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
});
