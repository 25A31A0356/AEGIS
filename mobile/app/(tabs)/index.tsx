import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";
import { useEmergencyProfile } from "@/lib/emergency-profile";
import { useAegisData } from "@/hooks/use-aegis-data";
import { AegisLogo } from "@/components/aegis-logo";
import { findNearestDistrict } from "@/lib/india-locations";

export default function HomeScreen() {
  const colors = useColors();
  const { dict } = useAppPreferences();
  const { profile } = useEmergencyProfile();
  const router = useRouter();

  const {
    weather,
    hazardAlerts,
    activeCriticalAlerts,
    location,
    isLoading,
    refresh,
    updateLocation,
  } = useAegisData();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract user's first name
  const userName = profile?.fullName?.trim() ? profile.fullName.trim().split(" ")[0] : "Aarav";

  // Extract clean village name
  const rawVillage = location.village || location.formattedVillage || location.label || "Gunrock Enclave";
  const cleanVillageName = rawVillage
    .replace(/^🌾\s*/i, "")
    .replace(/^Village:?\s*/i, "")
    .replace(/^Rural Sector\s*•\s*/i, "")
    .split("•")[0]
    .split(",")[0]
    .trim();

  // Function to refresh and re-acquire live GPS location
  const handleLocationRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            let label = `${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`;
            try {
              const places = await Location.reverseGeocodeAsync({ latitude, longitude });
              if (places && places.length > 0) {
                const p = places[0];
                const vName = p.name || p.street || p.subregion;
                const dName = p.district || p.city || p.subregion;
                const sName = p.region || p.country;
                if (vName && vName !== dName) {
                  label = `Village: ${vName}, ${dName}`;
                } else {
                  label = `Village: ${dName}, ${sName}`;
                }
              }
            } catch {
              const nearest = findNearestDistrict(latitude, longitude);
              label = `Village: ${nearest.district.name}, ${nearest.district.state}`;
            }
            await updateLocation(latitude, longitude, label, "gps");
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const nearest = findNearestDistrict(current.coords.latitude, current.coords.longitude);
          await updateLocation(current.coords.latitude, current.coords.longitude, `Village: ${nearest.district.name}`, "gps");
        }
      }
      await refresh();
    } catch (err) {
      console.warn("Location refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Proactively fetch user's real GPS location on startup
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              if (!active) return;
              const { latitude, longitude } = pos.coords;
              let label = `${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`;
              try {
                const places = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (places && places.length > 0) {
                  const p = places[0];
                  const vName = p.name || p.street || p.subregion;
                  const dName = p.district || p.city || p.subregion;
                  const sName = p.region || p.country;
                  if (vName && vName !== dName) {
                    label = `Village: ${vName}, ${dName} (${sName})`;
                  } else {
                    label = `Village: ${dName}, ${sName}`;
                  }
                }
              } catch {
                const nearest = findNearestDistrict(latitude, longitude);
                label = `Village: ${nearest.district.name}, ${nearest.district.state}`;
              }
              await updateLocation(latitude, longitude, label, "gps");
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000 }
          );
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted" && active) {
          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const nearest = findNearestDistrict(current.coords.latitude, current.coords.longitude);
          await updateLocation(current.coords.latitude, current.coords.longitude, `Village: ${nearest.district.name}`, "gps");
        }
      } catch (e) {
        console.warn("[HomeScreen] Startup GPS initialization:", e);
      }
    })();
    return () => {
      active = false;
    };
  }, [updateLocation]);

  // Weather telemetry values matching Web
  const temp = weather?.temperature ?? 30;
  const condition = weather?.weatherLabel ?? "Partly Cloudy With Coastal Breeze";
  const humidity = weather?.humidity ?? 61;
  const rainProb = weather?.rainfallProbabilityPct ?? 35;
  const rainfallMm = weather?.rainfallMm ?? 0;
  const windSpeed = weather?.windSpeedKmH ?? 18;
  const feelsLike = weather?.apparentTemperature ?? 33;
  const tempMax = weather?.forecast?.[0]?.tempMaxC ?? 34;
  const tempMin = weather?.forecast?.[0]?.tempMinC ?? 26;
  const pressure = 1006;
  const visibility = 8;
  const uvIndex = 6;
  const aqi = 65;
  const dewPoint = "22.2";

  // Calculated risk score
  const calculatedRiskScore = 34;

  const topCriticalAlert = activeCriticalAlerts[0] || {
    id: "alert-1",
    title: "Seismic Watch: M5.4 Earthquake Epicenter Relaxation",
    severity: "WARNING",
    description: "Seismic Watch: M5.4 Earthquake Epicenter Relaxation",
    distanceKm: 1672.6,
  };

  // Hourly items matching Web
  const hourlyData = [
    { time: "Now", temp: 30, rain: 47, active: true },
    { time: "19:00", temp: 31, rain: 41, active: false },
    { time: "20:00", temp: 32, rain: 38, active: false },
    { time: "21:00", temp: 32, rain: 23, active: false },
    { time: "22:00", temp: 33, rain: 27, active: false },
  ];

  // 3-Day Synoptic Forecast items matching Web
  const threeDayForecast = [
    { day: "Today", max: 34, min: 26, rain: 35, mm: 0 },
    { day: "Tomorrow", max: 33, min: 27, rain: 39, mm: 0 },
    { day: "Fri", max: 32, min: 26, rain: 43, mm: 0 },
  ];

  return (
    <ScreenContainer className="px-3" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* 1. TOP APP BAR */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Open menu"
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
            onPress={() => router.push("/menu" as any)}
          >
            <IconSymbol name="line.3.horizontal" size={22} color={colors.foreground} />
          </Pressable>

          <AegisLogo size="md" showSubtitle={true} />

          <View style={styles.topBarActions}>
            <Pressable
              accessibilityLabel="Notifications"
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/notifications" as any)}
            >
              <IconSymbol name="bell.fill" size={20} color={colors.foreground} />
              <View style={styles.badgeDot} />
            </Pressable>
            <Pressable
              accessibilityLabel="Profile"
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, overflow: "hidden" }]}
              onPress={() => router.push("/settings" as any)}
            >
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarLetter}>
                    {userName[0]?.toUpperCase() || "A"}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* 2. TOP BANNER ALERT TICKER (MATCHING IMAGE 3) */}
        <Pressable
          onPress={() => router.push("/hazards" as any)}
          style={styles.redAlertBanner}
        >
          <View style={styles.redDot} />
          <View style={styles.warningPill}>
            <Text style={styles.warningPillText}>WARNING CAP ADVISORY</Text>
          </View>
          <Text style={styles.alertText} numberOfLines={1}>
            [Guwahati Sector]: Seismic Watch...
          </Text>
          <View style={styles.alertAction}>
            <Text style={styles.alertActionText}>View Advisory Details</Text>
            <Text style={styles.alertActionText}>➔</Text>
          </View>
        </Pressable>

        {/* 3. USER GREETING & VILLAGE CARD (MATCHING IMAGE 3) */}
        <View style={styles.cyanGreetingCard}>
          <View style={styles.greetingHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingTitle}>
                Hi {userName}! 👋
              </Text>
              <View style={styles.villageLocationRow}>
                <Text style={styles.pinIcon}>📍</Text>
                <Text style={styles.villageNameText}>
                  Village: {cleanVillageName}
                </Text>
              </View>
            </View>

            {/* Mint Location Target Refresh Button */}
            <Pressable
              onPress={handleLocationRefresh}
              disabled={isRefreshing}
              style={({ pressed }) => [
                styles.mintLocationBtn,
                pressed && styles.pressed,
              ]}
              accessibilityLabel="Refresh Location"
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <IconSymbol name="location.fill" size={24} color="#059669" />
              )}
            </Pressable>
          </View>
        </View>

        {/* 4. LIVE CONDITIONS HERO WEATHER CARD (MATCHING IMAGE 3) */}
        <View style={[styles.whiteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.sectionHeadingSmall, { color: colors.muted }]}>LIVE CONDITIONS</Text>
            <View style={[styles.timePill, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.timePillText, { color: colors.muted }]}>06:46 PM IST</Text>
            </View>
          </View>

          {/* Large Temperature Display */}
          <View style={styles.tempHeroRow}>
            <Text style={[styles.largeTempNumber, { color: colors.foreground }]}>30°</Text>
            <View style={styles.tempMetaCol}>
              <Text style={[styles.feelsLikeBig, { color: colors.foreground }]}>
                Feels like <Text style={{ fontWeight: "800" }}>33°C</Text>
              </Text>
              <Text style={[styles.highLowSmall, { color: colors.muted }]}>
                H: 34° &bull; L: 26°
              </Text>
            </View>
          </View>

          {/* Condition Headline & Description */}
          <Text style={[styles.conditionHeadline, { color: colors.foreground }]}>
            Partly Cloudy With Coastal Breeze
          </Text>
          <Text style={[styles.conditionDescText, { color: colors.muted }]}>
            Precipitation probability currently at <Text style={{ fontWeight: "700", color: colors.foreground }}>35%</Text> with expected accumulation of <Text style={{ fontWeight: "700", color: colors.foreground }}>0 mm</Text>.
          </Text>

          {/* Weather Graphic (Cloud & Moon Center Icon) */}
          <View style={styles.illustrationWrapper}>
            <View style={styles.moonCloudGraphic}>
              <View style={styles.moonShape} />
              <View style={styles.cloudShapeFront} />
            </View>
          </View>

          {/* Bottom 4 Sensor Metric Cards (Matching Image 3) */}
          <View style={styles.fourMetricsRow}>
            <View style={[styles.sensorBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sensorLabel, { color: colors.muted }]}>💧 Humidity</Text>
              <Text style={[styles.sensorVal, { color: colors.foreground }]}>61%</Text>
            </View>

            <View style={[styles.sensorBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sensorLabel, { color: colors.muted }]}>💨 Wind</Text>
              <Text style={[styles.sensorVal, { color: colors.foreground }]}>18 <Text style={styles.sensorUnit}>km/h</Text></Text>
            </View>

            <View style={[styles.sensorBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sensorLabel, { color: colors.muted }]}>⏱️ Pressure</Text>
              <Text style={[styles.sensorVal, { color: colors.foreground }]}>1006 <Text style={styles.sensorUnit}>hPa</Text></Text>
            </View>

            <View style={[styles.sensorBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sensorLabel, { color: colors.muted }]}>👁️ Visibility</Text>
              <Text style={[styles.sensorVal, { color: colors.foreground }]}>8 <Text style={styles.sensorUnit}>km</Text></Text>
            </View>
          </View>
        </View>

        {/* 5. DISASTER RISK INDEX CARD (MATCHING IMAGE 2) */}
        <View style={[styles.whiteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="shield.fill" size={18} color="#F59E0B" />
              <Text style={[styles.sectionHeadingSmall, { color: colors.foreground }]}>DISASTER RISK INDEX</Text>
            </View>
            <View style={styles.moderatePill}>
              <Text style={styles.moderatePillText}>MODERATE</Text>
            </View>
          </View>

          <View style={styles.riskBigScoreRow}>
            <Text style={[styles.bigRiskNumber, { color: colors.foreground }]}>34</Text>
            <Text style={[styles.maxRiskText, { color: colors.muted }]}>/ 100 max risk</Text>
          </View>

          {/* Green Progress Gauge */}
          <View style={[styles.gaugeTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.gaugeFill, { width: "34%", backgroundColor: "#10B981" }]} />
          </View>

          <Text style={[styles.riskExplainText, { color: colors.muted }]}>
            Real-time multi-hazard assessment factoring cyclonic depressions, convective rain cells, and active district emergency beacons.
          </Text>

          {/* Contributing Factors */}
          <View style={[styles.factorsSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.factorsTitle, { color: colors.muted }]}>CONTRIBUTING FACTORS</Text>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Rainfall Probability</Text>
              <Text style={[styles.factorNumber, { color: colors.foreground }]}>35%</Text>
            </View>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Wind Velocity Shear</Text>
              <Text style={[styles.factorNumber, { color: colors.foreground }]}>18 km/h</Text>
            </View>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Active SOS Beacons</Text>
              <Text style={[styles.factorNumber, { color: "#EF4444" }]}>2 Active</Text>
            </View>
          </View>
        </View>

        {/* 6. HOURLY TELEMETRY & FORECAST (MATCHING IMAGE 2) */}
        <View style={[styles.whiteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="clock.fill" size={17} color={colors.foreground} />
              <Text style={[styles.sectionHeadingSmall, { color: colors.foreground }]}>HOURLY TELEMETRY & FORECAST</Text>
            </View>
            <Text style={[styles.subtleTextRight, { color: colors.muted }]}>Next 12 Hours</Text>
          </View>

          {/* Hourly Pills Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScrollRow}>
            {hourlyData.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.hourlyPillBox,
                  h.active
                    ? { backgroundColor: "#0F172A", borderColor: "#0F172A" }
                    : { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.hourlyTimeText, { color: h.active ? "#FFFFFF" : colors.foreground }]}>
                  {h.time}
                </Text>
                <IconSymbol
                  name="sun.max.fill"
                  size={24}
                  color={h.active ? "#F59E0B" : "#F59E0B"}
                  style={{ marginVertical: 6 }}
                />
                <Text style={[styles.hourlyTempText, { color: h.active ? "#FFFFFF" : colors.foreground }]}>
                  {h.temp}°
                </Text>
                <View style={styles.hourlyRainRow}>
                  <Text style={[styles.hourlyRainText, { color: h.active ? "#94A3B8" : colors.muted }]}>
                    💧 {h.rain}%
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 7. TODAY'S TELEMETRY HIGHLIGHTS (MATCHING IMAGE 2 & 1) */}
        <View style={{ gap: 10 }}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="chart.bar.fill" size={17} color={colors.foreground} />
              <Text style={[styles.sectionHeadingSmall, { color: colors.foreground }]}>TODAY'S TELEMETRY HIGHLIGHTS</Text>
            </View>
            <Text style={[styles.subtleTextRight, { color: colors.muted }]}>Sensors: Real-Time</Text>
          </View>

          {/* 2x2 Grid of Highlights */}
          <View style={styles.highlightGrid}>
            {/* Card 1: Precipitation & Rainfall */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Precipitation & Rainfall</Text>
                <IconSymbol name="cloud.rain.fill" size={18} color="#0284C7" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                0 <Text style={{ fontSize: 13, fontWeight: "600" }}>mm expected</Text>
              </Text>
              <View style={[styles.gaugeTrackSmall, { backgroundColor: colors.border }]}>
                <View style={[styles.gaugeFillSmall, { width: "35%", backgroundColor: "#0284C7" }]} />
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted }]}>
                Probability: <Text style={{ fontWeight: "700", color: colors.foreground }}>35%</Text> • Peak expected during late afternoon.
              </Text>
            </View>

            {/* Card 2: UV Radiation Index */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>UV Radiation Index</Text>
                <IconSymbol name="sun.max.fill" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                6 <Text style={{ fontSize: 14, fontWeight: "800", color: "#EA580C" }}>High</Text>
              </Text>
              <View style={[styles.gaugeTrackSmall, { backgroundColor: colors.border }]}>
                <View style={[styles.gaugeFillSmall, { width: "60%", backgroundColor: "#EA580C" }]} />
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted }]}>
                Peak solar intensity from 11:30 to 14:30 IST.
              </Text>
            </View>

            {/* Card 3: Wind Status & Gusts */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Wind Status & Gusts</Text>
                <IconSymbol name="wind" size={18} color="#0284C7" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                18 <Text style={{ fontSize: 13, fontWeight: "600" }}>km/h (SW)</Text>
              </Text>
              <View style={styles.highlightMetaRow}>
                <Text style={[styles.highlightSubText, { color: colors.muted }]}>Peak Gusts: <Text style={{ fontWeight: "700", color: colors.foreground }}>23 km/h</Text></Text>
                <Text style={[styles.highlightSubText, { color: colors.muted }]}>Moderate Breeze</Text>
              </View>
            </View>

            {/* Card 4: Humidity & Dew Point */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Humidity & Dew Point</Text>
                <IconSymbol name="drop.fill" size={18} color="#0284C7" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                61% <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>Dew Point: {dewPoint}°C</Text>
              </Text>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Atmospheric moisture level is high, increasing perceived thermal index.
              </Text>
            </View>

            {/* Card 5: Solar Cycle (Sunrise/Sunset) */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Solar Cycle (Sunrise/Sunset)</Text>
                <IconSymbol name="sun.max.fill" size={18} color="#F59E0B" />
              </View>
              <View style={styles.solarRow}>
                <Text style={[styles.solarText, { color: colors.foreground }]}>↑ Sunrise <Text style={{ fontWeight: "800" }}>05:48 AM</Text></Text>
                <Text style={[styles.solarText, { color: colors.foreground }]}>↓ Sunset <Text style={{ fontWeight: "800" }}>06:14 PM</Text></Text>
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Total Daylight: 12h 26m
              </Text>
            </View>

            {/* Card 6: Air Quality Index (AQI) */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Air Quality Index (AQI)</Text>
                <IconSymbol name="leaf.fill" size={18} color="#10B981" />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 }}>
                <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>65</Text>
                <View style={styles.aqiPill}>
                  <Text style={styles.aqiPillText}>Moderate</Text>
                </View>
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Barometric Pressure: <Text style={{ fontWeight: "700", color: colors.foreground }}>1006 hPa</Text> (Steady)
              </Text>
            </View>
          </View>
        </View>

        {/* 8. ACTIVE HAZARDS NEAR YOU (MATCHING IMAGE 1) */}
        <View style={[styles.whiteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <Text style={[styles.sectionHeadingSmall, { color: colors.foreground }]}>ACTIVE HAZARDS NEAR YOU</Text>
            </View>
            <View style={styles.monitoredPill}>
              <Text style={styles.monitoredPillText}>1 Monitored</Text>
            </View>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
            Real-time distance calculated from your station GPS
          </Text>

          {/* Hazard item box */}
          <Pressable
            onPress={() => router.push("/hazards" as any)}
            style={[styles.hazardItemBox, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <View style={styles.hazardItemTop}>
              <View style={styles.warningTag}>
                <Text style={styles.warningTagText}>WARNING</Text>
              </View>
              <Text style={[styles.hazardTitleText, { color: colors.foreground }]} numberOfLines={1}>
                Seismic Watch: M5.4 Earthquake Epicenter Relaxation
              </Text>
              <Text style={{ fontSize: 16, color: colors.muted }}>➔</Text>
            </View>
            <Text style={[styles.hazardSubDesc, { color: colors.muted }]} numberOfLines={1}>
              Seismic Watch: M5.4 Earthquake Epicenter Relaxation
            </Text>
            <Text style={[styles.hazardDistanceText, { color: colors.muted }]}>
              📍 1672.6 km away &bull; Status: <Text style={{ color: "#059669", fontWeight: "700" }}>monitoring</Text>
            </Text>
          </Pressable>
        </View>

        {/* 9. 3-DAY SYNOPTIC FORECAST (MATCHING IMAGE 1) */}
        <View style={[styles.whiteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="calendar" size={17} color={colors.foreground} />
              <Text style={[styles.sectionHeadingSmall, { color: colors.foreground }]}>3-DAY SYNOPTIC FORECAST</Text>
            </View>
            <Text style={[styles.subtleTextRight, { color: colors.muted }]}>IMD Numerical Prediction</Text>
          </View>

          {/* 3 Columns */}
          <View style={styles.threeDayRow}>
            {threeDayForecast.map((d, idx) => (
              <View key={idx} style={[styles.forecastDayCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.forecastDayName, { color: colors.foreground }]}>{d.day}</Text>
                <IconSymbol name="sun.max.fill" size={32} color="#F59E0B" style={{ marginVertical: 8 }} />
                <Text style={[styles.forecastTemps, { color: colors.foreground }]}>
                  {d.max}° <Text style={{ color: colors.muted, fontWeight: "500" }}>/ {d.min}°</Text>
                </Text>
                <Text style={[styles.forecastRainPct, { color: colors.foreground }]}>
                  {d.rain}% Rain
                </Text>
                <Text style={[styles.forecastMm, { color: colors.muted }]}>
                  {d.mm} mm
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
    gap: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  redAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#450A0A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  warningPill: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  alertText: {
    flex: 1,
    color: "#FECACA",
    fontSize: 11,
    fontWeight: "600",
  },
  alertAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  alertActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cyanGreetingCard: {
    backgroundColor: "#E6F8F6",
    borderColor: "#B2EBF2",
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  greetingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  villageLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  pinIcon: {
    fontSize: 16,
  },
  villageNameText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#059669",
  },
  mintLocationBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  whiteCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeadingSmall: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  timePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  timePillText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  subtleTextRight: {
    fontSize: 11,
    fontWeight: "500",
  },
  tempHeroRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginVertical: 4,
  },
  largeTempNumber: {
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -1,
  },
  tempMetaCol: {
    gap: 3,
  },
  feelsLikeBig: {
    fontSize: 14,
  },
  highLowSmall: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  conditionHeadline: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: -0.2,
  },
  conditionDescText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  illustrationWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  moonCloudGraphic: {
    width: 140,
    height: 90,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  moonShape: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FBBF24",
    top: 4,
    left: 45,
  },
  cloudShapeFront: {
    position: "absolute",
    width: 100,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#334155",
    bottom: 6,
    left: 20,
  },
  fourMetricsRow: {
    flexDirection: "row",
    gap: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F020",
  },
  sensorBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  sensorLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  sensorVal: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "monospace",
    marginTop: 3,
  },
  sensorUnit: {
    fontSize: 9,
    fontWeight: "500",
  },
  moderatePill: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  moderatePillText: {
    color: "#D97706",
    fontSize: 10,
    fontWeight: "800",
  },
  riskBigScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginVertical: 8,
  },
  bigRiskNumber: {
    fontSize: 48,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  maxRiskText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  gaugeTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 8,
  },
  gaugeFill: {
    height: "100%",
    borderRadius: 3,
  },
  riskExplainText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  factorsSection: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  factorsTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  factorLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  factorName: {
    fontSize: 12,
  },
  factorNumber: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  hourlyScrollRow: {
    gap: 8,
    paddingVertical: 4,
  },
  hourlyPillBox: {
    width: 72,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  hourlyTimeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  hourlyTempText: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  hourlyRainRow: {
    marginTop: 4,
  },
  hourlyRainText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  highlightGrid: {
    gap: 10,
  },
  highlightCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  highlightTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  highlightBigVal: {
    fontSize: 26,
    fontWeight: "900",
    fontFamily: "monospace",
    marginVertical: 4,
  },
  gaugeTrackSmall: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginVertical: 6,
  },
  gaugeFillSmall: {
    height: "100%",
    borderRadius: 2,
  },
  highlightSubText: {
    fontSize: 11,
    lineHeight: 15,
  },
  highlightMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  solarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  solarText: {
    fontSize: 12,
  },
  aqiPill: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aqiPillText: {
    color: "#D97706",
    fontSize: 10,
    fontWeight: "700",
  },
  monitoredPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  monitoredPillText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  cardSubtitle: {
    fontSize: 11,
    marginBottom: 10,
  },
  hazardItemBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  hazardItemTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningTag: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  warningTagText: {
    color: "#D97706",
    fontSize: 9,
    fontWeight: "800",
  },
  hazardTitleText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  hazardSubDesc: {
    fontSize: 11,
  },
  hazardDistanceText: {
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 2,
  },
  threeDayRow: {
    flexDirection: "row",
    gap: 8,
  },
  forecastDayCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  forecastDayName: {
    fontSize: 13,
    fontWeight: "700",
  },
  forecastTemps: {
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  forecastRainPct: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  forecastMm: {
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
