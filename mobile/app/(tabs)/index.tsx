import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";
import { useEmergencyProfile } from "@/lib/emergency-profile";
import { useAegisData } from "@/hooks/use-aegis-data";
import { AegisApiService } from "@/lib/services/aegis-api";
import { RecentActivity, HourlyWeatherPoint } from "@/lib/services/aegis-types";
import { LocationSelectorModal, SelectedLocationResult } from "@/components/location-selector-modal";
import { findNearestDistrict } from "@/lib/india-locations";

export default function HomeScreen() {
  const colors = useColors();
  const { t, dict } = useAppPreferences();
  const { profile } = useEmergencyProfile();
  const router = useRouter();

  const {
    weather,
    activeCriticalAlerts,
    location,
    isLoading,
    dataFreshness,
    lastUpdatedFormatted,
    refresh,
    updateLocation,
  } = useAegisData();

  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Proactively request GPS location permissions on startup to center real GPS position
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const savedRaw = await AsyncStorage.getItem("agies-selected-location");
        if (savedRaw) return; // User already has a stored preference

        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              if (!active) return;
              const { latitude, longitude } = pos.coords;
              const nearest = findNearestDistrict(latitude, longitude);
              const label = `${nearest.district.name}, ${nearest.district.state}`;
              await updateLocation(latitude, longitude, label, "gps");
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000 }
          );
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted" && active) {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const nearest = findNearestDistrict(current.coords.latitude, current.coords.longitude);
          const label = `${nearest.district.name}, ${nearest.district.state}`;
          await updateLocation(current.coords.latitude, current.coords.longitude, label, "gps");
        }
      } catch (e) {
        console.warn("[HomeScreen] Startup GPS initialization:", e);
      }
    })();
    return () => {
      active = false;
    };
  }, [updateLocation]);

  // 1-Click "My Current GPS Location" button handler
  const handleQuickGpsClick = async () => {
    setIsLocatingGps(true);
    try {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            const nearest = findNearestDistrict(latitude, longitude);
            const label = `${nearest.district.name}, ${nearest.district.state}`;
            await updateLocation(latitude, longitude, label, "gps");
            setIsLocatingGps(false);
          },
          async () => {
            await fetchExpoLocation();
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
        return;
      }

      await fetchExpoLocation();
    } catch (e) {
      console.warn("[HomeScreen] Quick GPS click error:", e);
      setIsLocatingGps(false);
    }
  };

  const fetchExpoLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const nearest = findNearestDistrict(current.coords.latitude, current.coords.longitude);
        const label = `${nearest.district.name}, ${nearest.district.state}`;
        await updateLocation(current.coords.latitude, current.coords.longitude, label, "gps");
      }
    } finally {
      setIsLocatingGps(false);
    }
  };

  const handleSelectLocation = async (res: SelectedLocationResult) => {
    const mode = res.mode === "gps" ? "gps" : "custom";
    await updateLocation(res.latitude, res.longitude, res.label, mode);
  };

  // Load activities from central backend
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await AegisApiService.getRecentActivities(10);
        if (active && res.data) {
          setActivities(res.data);
        }
      } catch (e) {
        console.warn("[HomeScreen] Activities load failed:", e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const todayHours: HourlyWeatherPoint[] = useMemo(() => {
    if (!weather?.todayHourly) return [];
    if (Array.isArray(weather.todayHourly)) return weather.todayHourly;
    if (weather.todayHourly.hours && Array.isArray(weather.todayHourly.hours)) return weather.todayHourly.hours;
    if (weather.todayHourly.hourly && Array.isArray(weather.todayHourly.hourly)) return weather.todayHourly.hourly;
    return [];
  }, [weather?.todayHourly]);

  const forecastCards = useMemo(() => {
    if (weather?.forecast && weather.forecast.length > 0) {
      return weather.forecast;
    }
    return Array.from({ length: 5 }, (_, index) => ({
      day: index === 0 ? dict.today : `Day ${index + 1}`,
      date: "",
      label: "…",
      hi: "--",
      lo: "--",
      tempMaxC: 0,
      tempMinC: 0,
      rainProbabilityPct: 0,
      color: colors.muted,
      weatherCode: 0,
    }));
  }, [weather, dict, colors.muted]);

  const topCriticalAlert = activeCriticalAlerts[0] || null;

  const risk = weather?.isSevereWeather || topCriticalAlert ? 78 : 25;
  const riskLabel = risk > 60 ? dict.riskHigh : dict.riskLow;

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Open menu"
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={() => router.push("/menu" as any)}
          >
            <IconSymbol name="line.3.horizontal" size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.brandWrap}>
            <Text style={[styles.brand, { color: colors.foreground }]}>AGIES</Text>
            <Text style={[styles.brandSub, { color: colors.primary }]}>ALERT</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Notifications"
              style={styles.iconButton}
              onPress={() => router.push("/notifications")}
            >
              <IconSymbol name="bell.fill" size={21} color={colors.foreground} />
              {activeCriticalAlerts.length > 0 && <View style={styles.badge} />}
            </Pressable>
            <Pressable
              accessibilityLabel="Settings"
              style={styles.iconButton}
              onPress={() => router.push("/settings")}
            >
              <IconSymbol name="gearshape.fill" size={21} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        {/* Welcome Row */}
        <View style={[styles.welcomeRow, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.muted }]}>{t("greeting")}</Text>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {profile.fullName || "Aarav"} <Text style={{ color: colors.primary }}>•</Text>
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.livePill,
              {
                backgroundColor:
                  dataFreshness === "LIVE" ? colors.success + "18" : colors.warning + "18",
              },
              pressed && styles.pressed,
            ]}
            onPress={refresh}
          >
            <View
              style={[
                styles.liveDot,
                { backgroundColor: dataFreshness === "LIVE" ? colors.success : colors.warning },
              ]}
            />
            <Text
              style={[
                styles.liveText,
                { color: dataFreshness === "LIVE" ? colors.success : colors.warning },
              ]}
            >
              {dataFreshness === "LIVE" ? dict.live : "CACHED"}
            </Text>
          </Pressable>
        </View>

        {/* Severe Hazard Banner if Active */}
        {topCriticalAlert && (
          <Pressable
            onPress={() => router.push("/notifications")}
            style={({ pressed }) => [
              styles.alertBanner,
              {
                backgroundColor:
                  topCriticalAlert.severity === "CRITICAL"
                    ? colors.error + "1A"
                    : colors.warning + "1A",
                borderColor:
                  topCriticalAlert.severity === "CRITICAL" ? colors.error : colors.warning,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.alertBannerTop}>
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={20}
                color={topCriticalAlert.severity === "CRITICAL" ? colors.error : colors.warning}
              />
              <Text
                style={[
                  styles.alertBannerKicker,
                  {
                    color:
                      topCriticalAlert.severity === "CRITICAL" ? colors.error : colors.warning,
                  },
                ]}
              >
                {topCriticalAlert.severity} ALERT • {topCriticalAlert.type.toUpperCase().replace("_", " ")}
              </Text>
            </View>
            <Text style={[styles.alertBannerTitle, { color: colors.foreground }]}>
              {topCriticalAlert.title}
            </Text>
            <Text numberOfLines={2} style={[styles.alertBannerDesc, { color: colors.muted }]}>
              {topCriticalAlert.description}
            </Text>
          </Pressable>
        )}

        {/* Location Bar & Quick 1-Click GPS Button */}
        <View style={styles.locationBarRow}>
          <Pressable
            onPress={() => setLocationModalVisible(true)}
            style={({ pressed }) => [
              styles.locationBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <IconSymbol name="location.fill" size={17} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[styles.locationText, { color: colors.foreground }]}>
                {location.label}
              </Text>
              <Text style={[styles.locationSubText, { color: colors.muted }]}>
                {location.source === "gps" ? "Live GPS Centroid" : "District Sector Selected"}
              </Text>
            </View>
            <IconSymbol name="chevron.down" size={13} color={colors.muted} />
          </Pressable>

          {/* 1-Click "My Current GPS Location" Quick Action Button */}
          <Pressable
            onPress={handleQuickGpsClick}
            disabled={isLocatingGps}
            style={({ pressed }) => [
              styles.quickGpsBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.82, transform: [{ scale: 0.96 }] },
            ]}
          >
            {isLocatingGps ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="location.fill" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.quickGpsBtnText}>GPS</Text>
          </Pressable>
        </View>

        {/* Current Conditions Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>{t("conditions")}</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("climate")}</Text>
          </View>
          <Text style={[styles.updated, { color: colors.muted }]}>
            {lastUpdatedFormatted}
          </Text>
        </View>

        {/* Weather Card */}
        <View
          style={[
            styles.weatherCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.weatherTop}>
            <View style={styles.temperatureWrap}>
              <Text style={[styles.temperature, { color: colors.foreground }]}>
                {isLoading && !weather ? "--" : weather?.temperature ?? 29}
                <Text style={[styles.degree, { color: colors.primary }]}>°C</Text>
              </Text>
              <View>
                <Text style={[styles.weatherLabel, { color: colors.foreground }]}>
                  {weather?.weatherLabel || "Partly Cloudy"}
                </Text>
                <Text style={[styles.feels, { color: colors.muted }]}>
                  {t("feelsLike")} {weather?.apparentTemperature ?? 32}°C
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.weatherIconCircle,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <IconSymbol
                name="cloud.sun.rain.fill"
                size={34}
                color={colors.primary}
              />
            </View>
          </View>

          {/* Severe Note if any */}
          {weather?.severeWeatherNote && (
            <View
              style={[
                styles.severeNoteBox,
                { backgroundColor: colors.warning + "18", borderColor: colors.warning },
              ]}
            >
              <Text style={[styles.severeNoteText, { color: colors.warning }]}>
                ⚠️ {weather.severeWeatherNote}
              </Text>
            </View>
          )}

          {/* Weather Meta Details */}
          <View style={[styles.weatherMeta, { borderTopColor: colors.border }]}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {weather?.windSpeedKmH || 14} km/h
              </Text>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>{t("wind")}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {weather?.humidity || 76}%
              </Text>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>{t("humidity")}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {weather?.visibilityKm || 8.5} km
              </Text>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>{t("visibility")}</Text>
            </View>
          </View>
        </View>

        {/* 5-Day Outlook Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>{t("forecast")}</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("outlook")}</Text>
          </View>
        </View>

        {/* 5-Day Forecast Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forecastRow}
        >
          {forecastCards.map((fc, index) => {
            const isSelected = selectedDayIndex === index;
            return (
              <Pressable
                key={index}
                onPress={() => setSelectedDayIndex(index)}
                style={({ pressed }) => [
                  styles.forecastCard,
                  {
                    backgroundColor: isSelected ? colors.primary + "14" : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.forecastDay,
                    { color: isSelected ? colors.primary : colors.muted },
                  ]}
                >
                  {fc.day}
                </Text>
                <IconSymbol
                  name="cloud.rain.fill"
                  size={24}
                  color={fc.color || colors.primary}
                />
                <Text numberOfLines={1} style={[styles.forecastLabel, { color: colors.foreground }]}>
                  {fc.label}
                </Text>
                <Text style={[styles.forecastTemp, { color: colors.foreground }]}>
                  {fc.hi}° / {fc.lo}°
                </Text>
                <Text style={[styles.rainProb, { color: "#2479A8" }]}>
                  🌧️ {fc.rainProbabilityPct}%
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 24-Hour Progression Box */}
        {todayHours.length > 0 && (
          <View
            style={[
              styles.hourlyProgressionBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.hourlyHeader}>
              <Text style={[styles.hourlyTitle, { color: colors.foreground }]}>
                ⏱️ 24-Hour Progression
              </Text>
              <Text style={[styles.hourlySub, { color: colors.muted }]}>
                Hourly Telemetry
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
              {todayHours.map((hour, idx) => {
                const isNow = idx === 0;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.hourNode,
                      {
                        backgroundColor: isNow ? colors.primary + "15" : colors.border + "20",
                        borderColor: isNow ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.hourLabel,
                        { color: isNow ? colors.primary : colors.muted, fontWeight: isNow ? "800" : "600" },
                      ]}
                    >
                      {hour.hourLabel || hour.time || hour.timeIST || "12:00"}
                    </Text>
                    <IconSymbol
                      name="cloud.rain.fill"
                      size={16}
                      color={
                        hour.rainProbabilityPct > 50
                          ? "#2479A8"
                          : isNow
                          ? colors.primary
                          : colors.warning
                      }
                    />
                    <Text style={[styles.hourTemp, { color: colors.foreground }]}>
                      {hour.tempC ?? hour.temperatureC ?? 28}°
                    </Text>
                    {hour.rainProbabilityPct > 0 ? (
                      <Text style={[styles.hourRain, { color: "#2479A8" }]}>
                        {hour.rainProbabilityPct}%
                      </Text>
                    ) : (
                      <Text style={[styles.hourWind, { color: colors.muted }]}>
                        {hour.windSpeedKmH}k
                      </Text>
                    )}
                    <Text style={[styles.hourHumid, { color: colors.muted }]}>
                      💧{hour.humidityPct}%
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Risk Readiness Card */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>{t("readiness")}</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("riskScore")}</Text>
          </View>
          <Text style={[styles.link, { color: colors.primary }]}>{t("today")}</Text>
        </View>
        <View
          style={[
            styles.riskCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.riskRing,
              { borderColor: risk > 60 ? colors.warning : colors.success },
            ]}
          >
            <Text style={[styles.riskNumber, { color: colors.foreground }]}>{risk}</Text>
            <Text style={[styles.riskOutOf, { color: colors.muted }]}>/100</Text>
          </View>
          <View style={styles.riskCopy}>
            <Text
              style={[
                styles.riskLabel,
                { color: risk > 60 ? colors.warning : colors.success },
              ]}
            >
              {riskLabel}
            </Text>
            <Text style={[styles.riskDescription, { color: colors.muted }]}>
              {dict.riskDescription}
            </Text>
            <Pressable onPress={() => router.push("/safe")}>
              <Text style={[styles.link, { color: colors.primary }]}>{t("safetyPlan")}</Text>
            </Pressable>
          </View>
        </View>

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <ActionCard
            icon="sos.circle.fill"
            title={t("sos")}
            subtitle={t("emergencyFlow")}
            tone="red"
            onPress={() => router.push("/beacon")}
            colors={colors}
          />
          <ActionCard
            icon="shield.lefthalf.filled"
            title={t("safePing")}
            subtitle={t("checkIn")}
            tone="green"
            onPress={() => router.push("/beacon?mode=ping")}
            colors={colors}
          />
          <ActionCard
            icon="exclamationmark.bubble.fill"
            title={t("community")}
            subtitle={t("reportHazardShort")}
            tone="orange"
            onPress={() => router.push("/reports")}
            colors={colors}
          />
          <ActionCard
            icon="message.fill"
            title={t("askAgies")}
            subtitle={t("offlineGuidance")}
            tone="blue"
            onPress={() => router.push("/ask")}
            colors={colors}
          />
        </View>

        {/* Recent Activities Feed (IST compliant) */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>NATIONAL & SECTOR DISPATCH</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activities</Text>
          </View>
          <Pressable onPress={() => router.push("/reports")}>
            <Text style={[styles.link, { color: colors.primary }]}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.activitiesContainer}>
          {activities.length === 0 ? (
            <View style={[styles.emptyActivityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyActivityText, { color: colors.muted }]}>
                No recent incidents in your sector. All emergency systems operational.
              </Text>
            </View>
          ) : (
            activities.slice(0, 5).map((act) => {
              const toneColor =
                act.type === "sos_beacon"
                  ? "#D93025"
                  : act.type === "safe_checkin"
                  ? "#188038"
                  : act.type === "hazard_alert"
                  ? "#EA580C"
                  : colors.primary;

              return (
                <Pressable
                  key={act.id}
                  onPress={() => {
                    if (act.type === "sos_beacon" || act.type === "emergency_response") {
                      router.push("/map");
                    } else if (act.type === "community_report") {
                      router.push("/reports");
                    } else {
                      router.push("/notifications");
                    }
                  }}
                  style={({ pressed }) => [
                    styles.activityCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.activityHeader}>
                    <View style={[styles.activityTypeBadge, { backgroundColor: toneColor + "18" }]}>
                      <Text style={[styles.activityTypeText, { color: toneColor }]}>
                        {act.type.replace("_", " ").toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.activityTimeIST, { color: colors.muted }]}>
                      {act.timestampFormattedIST || act.relativeTime}
                    </Text>
                  </View>
                  <Text style={[styles.activityTitle, { color: colors.foreground }]}>{act.title}</Text>
                  <Text numberOfLines={2} style={[styles.activitySummary, { color: colors.muted }]}>
                    {act.summary}
                  </Text>
                  <View style={styles.activityFooter}>
                    <IconSymbol name="location.fill" size={11} color={colors.muted} />
                    <Text style={[styles.activityLocation, { color: colors.muted }]}>
                      {act.locationName} {act.district ? `• ${act.district}` : ""}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Pan-India 780+ District Selector Modal */}
        <LocationSelectorModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          onSelectLocation={handleSelectLocation}
          currentLabel={location.label}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  tone,
  onPress,
  colors,
}: {
  icon: any;
  title: string;
  subtitle: string;
  tone: "red" | "green" | "orange" | "blue";
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const toneMap = {
    red: colors.error,
    green: colors.success,
    orange: colors.warning,
    blue: colors.primary,
  };
  const tint = toneMap[tone];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: tint + "16" }]}>
        <IconSymbol name={icon} size={24} color={tint} />
      </View>
      <Text style={[styles.actionTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.actionSubtitle, { color: colors.muted }]}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 16, paddingBottom: 36 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  brandWrap: { alignItems: "center", marginLeft: 36 },
  brand: { fontSize: 16, fontWeight: "900", letterSpacing: 2.4 },
  brandSub: { fontSize: 9, fontWeight: "800", letterSpacing: 3.5, marginTop: -2 },
  headerActions: { flexDirection: "row", gap: 5 },
  iconButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17 },
  badge: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C73535", position: "absolute", top: 6, right: 5 },
  welcomeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottomWidth: 1 },
  greeting: { fontSize: 13, fontWeight: "500" },
  name: { fontSize: 24, fontWeight: "800", marginTop: 3 },
  livePill: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 11, borderRadius: 16, gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  alertBanner: { borderWidth: 1.5, borderRadius: 16, padding: 14, marginTop: 14 },
  alertBannerTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  alertBannerKicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  alertBannerTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  alertBannerDesc: { fontSize: 12, lineHeight: 17 },
  locationBarRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 15 },
  locationBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, padding: 11, borderRadius: 14, borderWidth: 1 },
  locationText: { fontSize: 13, fontWeight: "800" },
  locationSubText: { fontSize: 10.5, marginTop: 1 },
  quickGpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  quickGpsBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 22, marginBottom: 11 },
  eyebrow: { fontSize: 10, letterSpacing: 1.3, fontWeight: "800", marginBottom: 3 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  updated: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  link: { fontSize: 12, fontWeight: "800" },
  weatherCard: { borderRadius: 20, borderWidth: 1, padding: 17 },
  weatherTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  temperatureWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  temperature: { fontSize: 45, fontWeight: "800", lineHeight: 52 },
  degree: { fontSize: 24, fontWeight: "500", verticalAlign: "top" },
  weatherLabel: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  feels: { fontSize: 12 },
  weatherIconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  severeNoteBox: { borderWidth: 1, borderRadius: 10, padding: 8, marginTop: 12 },
  severeNoteText: { fontSize: 11, fontWeight: "700" },
  weatherMeta: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, marginTop: 17, paddingTop: 14 },
  metaItem: { alignItems: "center", flex: 1, gap: 3 },
  metaValue: { fontSize: 12, fontWeight: "800" },
  metaLabel: { fontSize: 10 },
  forecastRow: { gap: 9, paddingBottom: 2 },
  forecastCard: { width: 118, borderRadius: 16, borderWidth: 1, padding: 12, gap: 6 },
  forecastDay: { fontSize: 11, fontWeight: "700" },
  forecastLabel: { fontSize: 11, fontWeight: "700", minHeight: 20 },
  forecastTemp: { fontSize: 14, fontWeight: "800" },
  rainProb: { fontSize: 10, fontWeight: "700" },
  hourlyProgressionBox: { borderRadius: 16, borderWidth: 1, padding: 13, marginTop: 12 },
  hourlyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  hourlyTitle: { fontSize: 12, fontWeight: "800" },
  hourlySub: { fontSize: 10, fontWeight: "600" },
  hourlyScroll: { gap: 10, paddingVertical: 2 },
  hourNode: { width: 62, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 3 },
  hourLabel: { fontSize: 10 },
  hourTemp: { fontSize: 12, fontWeight: "800" },
  hourRain: { fontSize: 9.5, fontWeight: "700" },
  hourWind: { fontSize: 9.5 },
  hourHumid: { fontSize: 8.5 },
  riskCard: { borderRadius: 20, borderWidth: 1, padding: 17, flexDirection: "row", alignItems: "center", gap: 16 },
  riskRing: { width: 78, height: 78, borderWidth: 7, borderRadius: 39, alignItems: "center", justifyContent: "center" },
  riskNumber: { fontSize: 23, fontWeight: "900" },
  riskOutOf: { fontSize: 10, marginTop: -2 },
  riskCopy: { flex: 1, gap: 4 },
  riskLabel: { fontSize: 16, fontWeight: "800" },
  riskDescription: { fontSize: 11, lineHeight: 16, marginBottom: 2 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 23 },
  actionCard: { width: "48.4%", borderRadius: 17, borderWidth: 1, padding: 13, minHeight: 126 },
  actionIcon: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  actionTitle: { fontSize: 13, fontWeight: "800" },
  actionSubtitle: { fontSize: 10, marginTop: 4 },
  activitiesContainer: { gap: 10, marginTop: 6 },
  emptyActivityCard: { padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  emptyActivityText: { fontSize: 12, textAlign: "center" },
  activityCard: { borderRadius: 14, borderWidth: 1, padding: 13, gap: 6 },
  activityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  activityTypeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  activityTypeText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 0.4 },
  activityTimeIST: { fontSize: 10.5, fontWeight: "700" },
  activityTitle: { fontSize: 13, fontWeight: "800" },
  activitySummary: { fontSize: 11.5, lineHeight: 16 },
  activityFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  activityLocation: { fontSize: 10.5, fontWeight: "600" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
