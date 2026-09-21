import * as ImagePicker from "expo-image-picker";
import { useState, useMemo, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";
import { useAegisCommunityReports } from "@/hooks/use-aegis-community-reports";
import { getResponsibleLocation } from "@/lib/services/aegis-location";
import { AegisCommunityReport, HazardSeverity } from "@/lib/services/aegis-types";

type Severity = "Low" | "Medium" | "High";
type FilterTab = "all" | "verified" | "community" | "pending";

export default function ReportsScreen() {
  const colors = useColors();
  const { t, dict } = useAppPreferences();

  const {
    pendingReports,
    allReports,
    isLoading,
    isRefreshing,
    isSubmitting,
    connectionStatus,
    lastUpdatedFormatted,
    refresh,
    submitReport,
  } = useAegisCommunityReports();

  const hazardOptions = useMemo(
    () => [
      { key: "flooding", label: dict.flooding, icon: "cloud.rain.fill", color: "#2479A8" },
      { key: "roadBlocked", label: dict.roadBlocked, icon: "exclamationmark.triangle.fill", color: "#D97706" },
      { key: "fire", label: dict.fire, icon: "flame.fill", color: "#C73535" },
      { key: "powerOutage", label: dict.powerOutage, icon: "bolt.slash.fill", color: "#8B5CF6" },
      { key: "landslide", label: dict.landslide, icon: "mountain.2.fill", color: "#78350F" },
      { key: "otherHazard", label: dict.otherHazard, icon: "exclamationmark.bubble.fill", color: "#4B5563" },
    ],
    [dict]
  );

  const severityOptions = useMemo(
    () => [
      { key: "Low", label: dict.severityLow, color: colors.success },
      { key: "Medium", label: dict.severityMedium, color: colors.warning },
      { key: "High", label: dict.severityHigh, color: colors.error },
    ],
    [dict, colors]
  );

  const [hazardKey, setHazardKey] = useState("flooding");
  const [details, setDetails] = useState("");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [image, setImage] = useState<string>();
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [locInfo, setLocInfo] = useState<{ lat: number; lng: number; accuracy?: number | null; address?: string }>({
    lat: 17.6868,
    lng: 83.2185,
    accuracy: 8,
    address: "Sector 04 • High Risk Basin Zone",
  });

  // Capture location on mount
  useEffect(() => {
    getResponsibleLocation().then((loc) => {
      setLocInfo({
        lat: loc.latitude,
        lng: loc.longitude,
        accuracy: loc.accuracyMeters ?? 8,
        address: loc.label || "Sector 04",
      });
    });
  }, []);

  const upload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos permission needed", "Allow photo access to attach evidence to a citizen hazard report.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.75 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!details.trim()) {
      Alert.alert("Add a description", "Please describe the hazard you are seeing before submitting.");
      return;
    }

    const currentHazard = hazardOptions.find((h) => h.key === hazardKey);
    const hazardLabel = currentHazard?.label || "Hazard Incident";

    const res = await submitReport({
      category: hazardKey,
      hazard: hazardLabel,
      title: `${hazardLabel} at ${locInfo.address}`,
      description: details.trim(),
      severity,
      latitude: locInfo.lat,
      longitude: locInfo.lng,
      accuracy: locInfo.accuracy,
      address: locInfo.address,
      image,
      imageUrl: image,
    });

    setSubmittedFeedback(res.message);
    setDetails("");
    setImage(undefined);

    setTimeout(() => {
      setSubmittedFeedback(null);
    }, 6000);
  };

  const filteredReports = useMemo(() => {
    if (filterTab === "verified") {
      return allReports.filter(
        (r) => r.verificationStatus === "VERIFIED" || r.source === "OFFICIAL" || r.source === "VERIFIED COMMUNITY"
      );
    }
    if (filterTab === "community") {
      return allReports.filter((r) => r.source === "COMMUNITY" || r.source === "UNVERIFIED COMMUNITY");
    }
    if (filterTab === "pending") {
      return allReports.filter((r) => r.isPending || r.status === "pending_review");
    }
    return allReports;
  }, [allReports, filterTab]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  };

  const getSeverityBadgeColor = (sev: HazardSeverity | string) => {
    const s = String(sev).toUpperCase();
    if (s === "CRITICAL") return { bg: "#C7353520", text: "#C73535", border: "#C73535" };
    if (s === "HIGH") return { bg: "#EA580C20", text: "#EA580C", border: "#EA580C" };
    if (s === "MODERATE" || s === "MEDIUM") return { bg: "#D9770620", text: "#D97706", border: "#D97706" };
    return { bg: "#16A34A20", text: "#16A34A", border: "#16A34A" };
  };

  const getSourceBadge = (source: string, isPending?: boolean) => {
    if (isPending) return { label: "⏳ PENDING SYNC", bg: "#6B728025", text: "#9CA3AF" };
    if (source === "OFFICIAL") return { label: "🏛️ OFFICIAL", bg: "#1E3A8A30", text: "#60A5FA" };
    if (source === "VERIFIED COMMUNITY") return { label: "✓ VERIFIED COMMUNITY", bg: "#065F4630", text: "#34D399" };
    return { label: "👥 COMMUNITY SIGNAL", bg: "#78350F25", text: "#FBBF24" };
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        {/* Real-time Status Header */}
        <View style={styles.topStatusRow}>
          <Text style={[styles.kicker, { color: colors.warning }]}>{dict.communitySignal}</Text>
          <View
            style={[
              styles.connectionBadge,
              {
                backgroundColor:
                  connectionStatus === "LIVE"
                    ? "#16A34A20"
                    : connectionStatus === "RECONNECTING"
                    ? "#D9770620"
                    : "#DC262620",
                borderColor:
                  connectionStatus === "LIVE"
                    ? "#16A34A"
                    : connectionStatus === "RECONNECTING"
                    ? "#D97706"
                    : "#DC2626",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    connectionStatus === "LIVE"
                      ? "#16A34A"
                      : connectionStatus === "RECONNECTING"
                      ? "#D97706"
                      : "#DC2626",
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    connectionStatus === "LIVE"
                      ? "#16A34A"
                      : connectionStatus === "RECONNECTING"
                      ? "#D97706"
                      : "#DC2626",
                },
              ]}
            >
              {connectionStatus === "LIVE"
                ? "LIVE REALTIME FEED"
                : connectionStatus === "RECONNECTING"
                ? "RECONNECTING..."
                : "OFFLINE CACHE"}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{t("reportHazard")}</Text>
        <Text style={[styles.intro, { color: colors.muted }]}>{dict.shareWhatYouSee}</Text>

        {/* Location Accuracy Card */}
        <View style={[styles.location, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="location.fill" size={19} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationTitle, { color: colors.foreground }]}>
              {locInfo.address}
            </Text>
            <Text style={[styles.locationCoords, { color: colors.muted }]}>
              GPS: {locInfo.lat.toFixed(4)}°, {locInfo.lng.toFixed(4)}° • Accuracy ±{locInfo.accuracy}m
            </Text>
          </View>
          <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
        </View>

        {/* Category Chips */}
        <Text style={[styles.label, { color: colors.foreground }]}>{dict.whatReporting}</Text>
        <View style={styles.chips}>
          {hazardOptions.map((item) => {
            const isSelected = hazardKey === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setHazardKey(item.key)}
                style={[
                  styles.chip,
                  {
                    borderColor: isSelected ? item.color : colors.border,
                    backgroundColor: isSelected ? item.color + "18" : colors.surface,
                  },
                ]}
              >
                <IconSymbol
                  name={item.icon as any}
                  size={14}
                  color={isSelected ? item.color : colors.muted}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? item.color : colors.foreground },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Severity Selector */}
        <Text style={[styles.label, { color: colors.foreground }]}>{dict.severity}</Text>
        <View style={styles.severityRow}>
          {severityOptions.map((item) => {
            const isSelected = severity === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setSeverity(item.key as Severity)}
                style={[
                  styles.severity,
                  {
                    borderColor: isSelected ? item.color : colors.border,
                    backgroundColor: isSelected ? item.color + "15" : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    { color: isSelected ? item.color : colors.muted },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Upload Media */}
        <Pressable onPress={upload} style={[styles.upload, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} />
          ) : (
            <View style={[styles.uploadIcon, { backgroundColor: colors.primary + "16" }]}>
              <IconSymbol name="plus.circle.fill" size={22} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
              {image ? dict.uploadImage : t("uploadImage")}
            </Text>
            <Text style={[styles.uploadSub, { color: colors.muted }]}>
              {image ? dict.tapReplaceImage : dict.addEvidenceCamera}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={colors.muted} />
        </Pressable>

        {/* Details Input */}
        <Text style={[styles.label, { color: colors.foreground }]}>{dict.describeHazard}</Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder={dict.describePlaceholder}
          placeholderTextColor={colors.muted}
          multiline
          style={[
            styles.input,
            { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.warning },
            pressed && styles.pressed,
            isSubmitting && { opacity: 0.7 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <IconSymbol name="paperplane.fill" size={20} color="#fff" />
              <Text style={styles.buttonText}>{t("sendReport")}</Text>
            </>
          )}
        </Pressable>

        {/* Feedback Banner */}
        {submittedFeedback && (
          <View style={[styles.confirm, { backgroundColor: colors.success + "12", borderColor: colors.success + "45" }]}>
            <IconSymbol name="checkmark.circle.fill" size={22} color={colors.success} />
            <Text style={[styles.confirmText, { color: colors.success }]}>
              {submittedFeedback}
            </Text>
          </View>
        )}

        {/* Section Header & Tabs */}
        <View style={styles.activityHeader}>
          <View>
            <Text style={[styles.section, { color: colors.foreground }]}>{t("recentReports")}</Text>
            <Text style={[styles.activitySub, { color: colors.muted }]}>
              Central Database ({allReports.length} reports) • {lastUpdatedFormatted}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {(["all", "verified", "community", "pending"] as FilterTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setFilterTab(tab)}
              style={[
                styles.tabBtn,
                filterTab === tab && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
                filterTab !== tab && {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: filterTab === tab ? "#fff" : colors.muted },
                ]}
              >
                {tab === "all"
                  ? "All"
                  : tab === "verified"
                  ? "Verified"
                  : tab === "community"
                  ? "Community"
                  : `Pending (${pendingReports.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Activity Feed Cards */}
        {isLoading && allReports.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Loading live community activity feed...
            </Text>
          </View>
        ) : filteredReports.length === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>{dict.noReportsYet}</Text>
        ) : (
          filteredReports.map((item: AegisCommunityReport) => {
            const sevBadge = getSeverityBadgeColor(item.severity);
            const srcBadge = getSourceBadge(item.source, item.isPending);

            return (
              <View
                key={item.id}
                style={[
                  styles.recentCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: item.isPending ? colors.warning : colors.border,
                  },
                ]}
              >
                {/* Header: Source, Severity & Authoritative ID */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.sourceBadge, { backgroundColor: srcBadge.bg }]}>
                    <Text style={[styles.sourceBadgeText, { color: srcBadge.text }]}>
                      {srcBadge.label}
                    </Text>
                  </View>

                  <View style={[styles.sevBadge, { backgroundColor: sevBadge.bg, borderColor: sevBadge.border }]}>
                    <Text style={[styles.sevBadgeText, { color: sevBadge.text }]}>
                      {item.severity}
                    </Text>
                  </View>
                </View>

                {/* Title & Description */}
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {item.title || item.hazard}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.muted }]}>
                  {item.description}
                </Text>

                {/* Optional Media Preview */}
                {item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImagePreview} />
                )}

                {/* Location & Time Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border + "30" }]}>
                  <View style={styles.footerLoc}>
                    <IconSymbol name="location.fill" size={12} color={colors.primary} />
                    <Text style={[styles.footerLocText, { color: colors.foreground }]}>
                      {item.location.address || "Sector 04"}
                    </Text>
                  </View>
                  <Text style={[styles.footerTimeText, { color: colors.muted }]}>
                    {formatRelativeTime(item.createdAt)} • #{item.id.substring(0, 16)}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={[styles.note, { color: colors.muted }]}>{dict.reportsNote}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 18, paddingBottom: 36 },
  topStatusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  kicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  connectionBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: "900", marginTop: 4 },
  intro: { fontSize: 13, lineHeight: 19, marginTop: 9, marginBottom: 18 },
  location: { flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderRadius: 16, borderWidth: 1, marginBottom: 23 },
  locationTitle: { fontSize: 13, fontWeight: "800" },
  locationCoords: { fontSize: 10, marginTop: 2 },
  locationDot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 13, fontWeight: "800", marginBottom: 9 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  chipText: { fontSize: 11, fontWeight: "700" },
  severityRow: { flexDirection: "row", gap: 8, marginBottom: 19 },
  severity: { flex: 1, alignItems: "center", borderWidth: 1, borderRadius: 13, paddingVertical: 11 },
  severityText: { fontSize: 12, fontWeight: "800" },
  upload: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderStyle: "dashed", borderRadius: 15, padding: 11, marginBottom: 18 },
  uploadIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  preview: { width: 42, height: 42, borderRadius: 13 },
  uploadTitle: { fontSize: 13, fontWeight: "800" },
  uploadSub: { fontSize: 10, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 14, minHeight: 110, padding: 14, fontSize: 13, textAlignVertical: "top", marginBottom: 17 },
  button: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 16, borderRadius: 16 },
  buttonText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  confirm: { flexDirection: "row", alignItems: "center", gap: 8, padding: 13, borderWidth: 1, borderRadius: 14, marginTop: 14 },
  confirmText: { flex: 1, fontSize: 12, fontWeight: "800" },
  activityHeader: { marginTop: 28, marginBottom: 12 },
  section: { fontSize: 18, fontWeight: "900" },
  activitySub: { fontSize: 11, marginTop: 2 },
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  tabBtn: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  tabBtnText: { fontSize: 11, fontWeight: "800" },
  loadingBox: { padding: 20, alignItems: "center", gap: 8 },
  loadingText: { fontSize: 12 },
  recentCard: { padding: 14, borderWidth: 1, borderRadius: 16, marginBottom: 12 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sourceBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  sourceBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  sevBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  sevBadgeText: { fontSize: 9, fontWeight: "900" },
  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  cardDesc: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  cardImagePreview: { width: "100%", height: 140, borderRadius: 10, marginBottom: 10 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1 },
  footerLoc: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerLocText: { fontSize: 11, fontWeight: "700" },
  footerTimeText: { fontSize: 10, fontWeight: "600" },
  empty: { fontSize: 12, textAlign: "center", marginVertical: 20 },
  note: { fontSize: 10, lineHeight: 15, marginTop: 14, textAlign: "center" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
