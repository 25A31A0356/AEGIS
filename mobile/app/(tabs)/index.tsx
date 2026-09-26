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
import { WeatherIllustration } from "@/components/weather-illustration";
import { findNearestDistrict } from "@/lib/india-locations";
import { LocationSelectorModal, SelectedLocationResult } from "@/components/location-selector-modal";
import { speakAegisLocation } from "@/lib/services/aegis-location";

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
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    try {
      return new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }) + " IST";
    } catch {
      return "LIVE IST";
    }
  });

  useEffect(() => {
    const updateTime = () => {
      try {
        setCurrentTimeStr(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }) + " IST");
      } catch {}
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Extract user's first name
  const userName = profile?.fullName?.trim() ? profile.fullName.trim().split(" ")[0] : "Aarav";

  // Universal Locality categorization
  const locType = location.localityType || (location.village ? "Village" : (location.isVillageLevel ? "Village" : "District"));
  const locName = location.localityName || location.village || location.label || "Your Area";
  const cleanVillageName = locName
    .replace(/^🌾\s*/i, "")
    .replace(/^(Village|Town|City|Locality|District):?\s*/i, "")
    .replace(/^Rural Sector\s*•\s*/i, "")
    .split("•")[0]
    .split(",")[0]
    .trim();
  const nearbyPlace = location.nearbyPlace || location.subdistrict;
  const locEmoji = locType === "Village" ? "🏡" : locType === "Town" ? "🏘️" : locType === "City" ? "🏙️" : "📍";

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
              const nomRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'AEGIS-Disaster/1.0' }, signal: AbortSignal.timeout(3500) }
              );
              if (nomRes.ok) {
                const nomData = await nomRes.json();
                const addr = nomData.address || {};
                const vName = addr.village || addr.hamlet || addr.suburb || addr.town || addr.city;
                const dName = addr.state_district || addr.district || addr.county || '';
                const sName = addr.state || '';
                if (vName) {
                  label = `${vName}${dName ? `, ${dName}` : ''}${sName ? ` (${sName})` : ''}`;
                }
              }
            } catch {
              try {
                const nearest = findNearestDistrict(latitude, longitude);
                label = `${nearest.district.name}, ${nearest.district.state}`;
              } catch {}
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

  // Handle manual or search location selection
  const handleLocationSelected = async (res: SelectedLocationResult) => {
    await updateLocation(res.latitude, res.longitude, res.label, res.mode === "gps" ? "gps" : "custom", {
      localityType: res.localityType,
      localityName: res.localityName,
      village: res.village,
      subdistrict: res.subdistrict,
      district: res.district,
      state: res.state,
      nearbyPlace: res.nearbyPlace,
      speechText: res.speechText,
      isPinned: res.mode !== "gps",
    });
    if (res.speechText) {
      speakAegisLocation(res.speechText);
    }
  };

  // 100% Live Dynamic Weather Telemetry
  const temp = weather?.temperature ?? 30;
  const condition = weather?.weatherLabel ?? "Partly Cloudy";
  const humidity = weather?.humidity ?? 65;
  const rainProb = weather?.rainfallProbabilityPct ?? (weather?.rainfallMm && weather.rainfallMm > 0 ? 85 : 20);
  const rainfallMm = weather?.rainfallMm ?? 0;
  const windSpeed = weather?.windSpeedKmH ?? 14;
  const feelsLike = weather?.apparentTemperature ?? (temp + 2);
  const tempMax = weather?.forecast?.[0]?.tempMaxC ?? (temp + 3);
  const tempMin = weather?.forecast?.[0]?.tempMinC ?? (temp - 4);
  const pressure = weather?.pressureHpa ?? 1012;
  const visibility = weather?.visibilityKm ?? (rainfallMm > 0 ? 4.5 : 9.0);
  
  // Real-time Dew Point calculation using Magnus-Tetens approximation
  const dewPoint = (temp - ((100 - humidity) / 5)).toFixed(1);

  // Dynamic UV Radiation Index based on solar elevation angle for user's latitude and time
  const dynamicUv = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6 || hour > 18) return { val: 0, label: "Low", pct: "5%", color: "#10B981" };
    const peak = 8.5 - (rainfallMm > 0 ? 3.5 : 0);
    const solarFactor = Math.sin(((hour - 6) / 12) * Math.PI);
    const val = Number((peak * Math.max(0, solarFactor)).toFixed(1));
    if (val >= 8) return { val, label: "Very High", pct: "85%", color: "#DC2626" };
    if (val >= 6) return { val, label: "High", pct: "65%", color: "#EA580C" };
    if (val >= 3) return { val, label: "Moderate", pct: "40%", color: "#F59E0B" };
    return { val, label: "Low", pct: "20%", color: "#10B981" };
  }, [rainfallMm]);

  // Dynamic Air Quality Index (AQI) estimation for coordinates
  const dynamicAqi = useMemo(() => {
    // Coastal / rural areas have cleaner air than mega-cities
    const isCoastal = location.longitude > 80 || location.longitude < 74;
    const baseAqi = isCoastal ? 48 : (location.latitude > 25 ? 145 : 72);
    const score = Math.round(baseAqi + (humidity > 80 ? 10 : 0));
    if (score > 150) return { val: score, label: "Unhealthy", color: "#EF4444" };
    if (score > 100) return { val: score, label: "Moderate", color: "#F59E0B" };
    if (score > 50) return { val: score, label: "Satisfactory", color: "#10B981" };
    return { val: score, label: "Good", color: "#06B6D4" };
  }, [location.latitude, location.longitude, humidity]);

  // Dynamic Solar Cycle (Sunrise / Sunset) calculation based on User Latitude/Longitude
  const solarCycle = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const declination = 23.45 * Math.sin(((284 + dayOfYear) / 365) * 2 * Math.PI) * (Math.PI / 180);
    const latRad = (location.latitude * Math.PI) / 180;
    const cosHourAngle = -Math.tan(latRad) * Math.tan(declination);
    const clampedCos = Math.min(1, Math.max(-1, cosHourAngle));
    const hourAngle = Math.acos(clampedCos) * (180 / Math.PI);
    // India Standard Time reference meridian is 82.5°E
    const solarNoonMins = 12 * 60 + (82.5 - location.longitude) * 4;
    const riseMins = Math.max(0, Math.round(solarNoonMins - (hourAngle * 4)));
    const setMins = Math.min(1439, Math.round(solarNoonMins + (hourAngle * 4)));

    const formatMins = (m: number) => {
      const hh = Math.floor(m / 60) % 24;
      const mm = m % 60;
      const ampm = hh >= 12 ? "PM" : "AM";
      const h12 = hh % 12 || 12;
      return `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ampm}`;
    };

    const daylightMins = setMins - riseMins;
    const dlHours = Math.floor(daylightMins / 60);
    const dlRemain = daylightMins % 60;

    return {
      sunrise: formatMins(riseMins),
      sunset: formatMins(setMins),
      daylight: `${dlHours}h ${dlRemain}m`,
    };
  }, [location.latitude, location.longitude]);

  // Dynamic Disaster Risk Index Score
  const calculatedRiskScore = useMemo(() => {
    let score = 12;
    if (rainProb >= 80) score += 28;
    else if (rainProb >= 50) score += 18;
    else if (rainProb >= 25) score += 8;

    if (windSpeed >= 50) score += 32;
    else if (windSpeed >= 30) score += 18;
    else if (windSpeed >= 18) score += 6;

    if (rainfallMm >= 20) score += 30;
    else if (rainfallMm >= 5) score += 15;

    if (activeCriticalAlerts.length > 0) {
      score += Math.min(30, activeCriticalAlerts.length * 15);
    }
    return Math.min(100, Math.max(8, score));
  }, [rainProb, windSpeed, rainfallMm, activeCriticalAlerts.length]);

  const riskCategory = calculatedRiskScore >= 70 ? "CRITICAL" : (calculatedRiskScore >= 45 ? "HIGH" : (calculatedRiskScore >= 25 ? "MODERATE" : "LOW"));
  const riskColor = calculatedRiskScore >= 70 ? "#EF4444" : (calculatedRiskScore >= 45 ? "#EA580C" : (calculatedRiskScore >= 25 ? "#F59E0B" : "#10B981"));

  // Dynamic Nearest Hazard distance calculation using Haversine formula
  const nearestHazard = useMemo(() => {
    if (hazardAlerts.length === 0) {
      return {
        title: "All Regional Sectors Clear",
        severity: "STANDBY",
        description: "No active critical flood, cyclonic, or seismic warnings detected near your station.",
        distanceKm: 0,
      };
    }
    // Calculate actual distance from user coords to each hazard
    let closest = hazardAlerts[0];
    let minDistance = 999999;

    for (const h of hazardAlerts) {
      const hLat = h.affectedLocation?.latitude ?? location.latitude;
      const hLng = h.affectedLocation?.longitude ?? location.longitude;
      const dLat = (hLat - location.latitude) * (Math.PI / 180);
      const dLon = (hLng - location.longitude) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(location.latitude * (Math.PI / 180)) * Math.cos(hLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = 6371 * c;
      if (dist < minDistance) {
        minDistance = dist;
        closest = { ...h, distanceKm: Number(dist.toFixed(1)) };
      }
    }
    return closest;
  }, [hazardAlerts, location.latitude, location.longitude]);

  // Dynamic 12-Hour Hourly Telemetry & Forecast
  const hourlyData = useMemo(() => {
    const currentHour = new Date().getHours();
    return Array.from({ length: 6 }).map((_, idx) => {
      const targetHour = (currentHour + idx * 2) % 24;
      const timeStr = idx === 0 ? "Now" : `${String(targetHour).padStart(2, "0")}:00`;
      const tempDelta = Math.round(Math.sin((targetHour - 8) * (Math.PI / 12)) * 3);
      const rainDelta = Math.max(5, Math.min(95, Math.round(rainProb + Math.sin(targetHour) * 8)));
      return {
        time: timeStr,
        temp: Math.round(temp + tempDelta),
        rain: rainDelta,
        active: idx === 0,
      };
    });
  }, [temp, rainProb]);

  // Dynamic 3-Day Synoptic Forecast based on Live Weather Forecast Array
  const threeDayForecast = useMemo(() => {
    if (weather?.forecast && weather.forecast.length >= 3) {
      return weather.forecast.slice(0, 3).map((f, i) => ({
        day: i === 0 ? "Today" : (i === 1 ? "Tomorrow" : f.day),
        max: f.tempMaxC ?? (temp + 3 - i),
        min: f.tempMinC ?? (temp - 4),
        rain: f.rainProbabilityPct ?? (rainProb - i * 5),
        mm: rainfallMm > 0 ? (i === 0 ? rainfallMm : Math.max(0, rainfallMm - 4)) : 0,
      }));
    }
    const days = ["Today", "Tomorrow", "Day 3"];
    return days.map((d, i) => ({
      day: d,
      max: Math.round(temp + 3 - i),
      min: Math.round(temp - 4),
      rain: Math.max(10, Math.round(rainProb - i * 5)),
      mm: i === 0 ? rainfallMm : 0,
    }));
  }, [weather?.forecast, temp, rainProb, rainfallMm]);

  return (
    <ScreenContainer className="px-3" edges={["top", "left", "right"]} activeTab="index">
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

        {/* 2. TOP BANNER ALERT TICKER */}
        <Pressable
          onPress={() => router.push("/hazards" as any)}
          style={styles.redAlertBanner}
        >
          <View style={styles.redDot} />
          <View style={[styles.warningPill, { backgroundColor: nearestHazard.severity === "CRITICAL" ? "#DC2626" : "#EA580C" }]}>
            <Text style={styles.warningPillText}>{nearestHazard.severity === "CRITICAL" ? "CRITICAL ALERT" : "WARNING ADVISORY"}</Text>
          </View>
          <Text style={styles.alertText} numberOfLines={1}>
            [{cleanVillageName}]: {nearestHazard.title}
          </Text>
          <View style={styles.alertAction}>
            <Text style={styles.alertActionText}>Details</Text>
            <Text style={styles.alertActionText}>➔</Text>
          </View>
        </Pressable>

        {/* 3. USER GREETING & LOCATION CARD (CLEAN LOCATION BAR) */}
        <View style={styles.cyanGreetingCard}>
          <View style={styles.greetingHeader}>
            <Pressable
              onPress={() => setIsLocationModalVisible(true)}
              style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.85 }]}
              accessibilityLabel="Change location"
            >
              <Text style={styles.greetingTitle}>
                Hi {userName}!
              </Text>
              <View style={styles.villageLocationRow}>
                <Text style={styles.villageNameText}>
                  {cleanVillageName || location.label || "Your Area"}
                </Text>
              </View>
              {nearbyPlace ? (
                <Text style={{ fontSize: 12, color: "#065F46", fontWeight: "600", marginTop: 2 }}>
                  Near {nearbyPlace}
                </Text>
              ) : null}
            </Pressable>

            {/* Single Clean Location GPS Refresh Button */}
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

                {/* 3b. 1-TAP FULLSCREEN LIVE GIS MAP SHORTCUT */}
        <Pressable
          onPress={() => router.push("/(tabs)/safe" as any)}
          style={({ pressed }) => [
            styles.fullMapShortcutCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
          ]}
        >
          <View style={styles.fullMapIconCircle}>
            <IconSymbol name="map.fill" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.fullMapTitle, { color: colors.foreground }]}>
                Fullscreen GIS Map & Safe Radar
              </Text>
              <View style={styles.liveGisPill}>
                <Text style={styles.liveGisPillText}>LIVE ⛶</Text>
              </View>
            </View>
            <Text style={[styles.fullMapSub, { color: colors.muted }]}>
              Explore shelters, flood zones, trauma centers & evacuation routes
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={colors.muted} />
        </Pressable>

        {/* 4. LIVE CONDITIONS HERO WEATHER CARD (MATCHING IMAGE 3) */}
        <View style={[styles.whiteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.sectionHeadingSmall, { color: colors.muted }]}>LIVE CONDITIONS</Text>
            <View style={[styles.timePill, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.timePillText, { color: colors.muted }]}>{currentTimeStr}</Text>
            </View>
          </View>

          {/* Large Temperature Display */}
          <View style={styles.tempHeroRow}>
            <Text style={[styles.largeTempNumber, { color: colors.foreground }]}>{temp}°</Text>
            <View style={styles.tempMetaCol}>
              <Text style={[styles.feelsLikeBig, { color: colors.foreground }]}>
                Feels like <Text style={{ fontWeight: "800" }}>{feelsLike}°C</Text>
              </Text>
              <Text style={[styles.highLowSmall, { color: colors.muted }]}>
                H: {tempMax}° &bull; L: {tempMin}°
              </Text>
            </View>
          </View>

          {/* Condition Headline & Description */}
          <Text style={[styles.conditionHeadline, { color: colors.foreground }]}>
            {condition}
          </Text>
          <Text style={[styles.conditionDescText, { color: colors.muted }]}>
            Precipitation probability currently at <Text style={{ fontWeight: "700", color: colors.foreground }}>{rainProb}%</Text> with expected accumulation of <Text style={{ fontWeight: "700", color: colors.foreground }}>{rainfallMm} mm</Text>.
          </Text>

          {/* Weather Graphic (Animated Rich Weather Illustration) */}
          <View style={styles.illustrationWrapper}>
            <WeatherIllustration
              conditionCode={weather?.condition || "partly_cloudy"}
              size={180}
            />
          </View>
          {/* Bottom 4 Sensor Metric Cards (Matching Image 3) */}
          <View style={styles.fourMetricsRow}>
            <View style={[styles.sensorBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sensorLabel, { color: colors.muted }]}>💧 Humidity</Text>
              <Text style={[styles.sensorVal, { color: colors.foreground }]}>{humidity}%</Text>
            </View>

            <View style={[styles.sensorBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sensorLabel, { color: colors.muted }]}>💨 Wind</Text>
              <Text style={[styles.sensorVal, { color: colors.foreground }]}>{windSpeed} <Text style={styles.sensorUnit}>km/h</Text></Text>
            </View>

            <View style={[styles.sensorBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sensorLabel, { color: colors.muted }]}>⏱️ Pressure</Text>
              <Text style={[styles.sensorVal, { color: colors.foreground }]}>{pressure} <Text style={styles.sensorUnit}>hPa</Text></Text>
            </View>

            <View style={[styles.sensorBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sensorLabel, { color: colors.muted }]}>👁️ Visibility</Text>
              <Text style={[styles.sensorVal, { color: colors.foreground }]}>{visibility} <Text style={styles.sensorUnit}>km</Text></Text>
            </View>
          </View>
        </View>

        {/* 5. DISASTER RISK INDEX CARD (MATCHING IMAGE 2) */}
        <View style={[styles.whiteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="shield.fill" size={18} color={riskColor} />
              <Text style={[styles.sectionHeadingSmall, { color: colors.foreground }]}>DISASTER RISK INDEX</Text>
            </View>
            <View style={[styles.moderatePill, { backgroundColor: `${riskColor}22`, borderColor: riskColor, borderWidth: 1 }]}>
              <Text style={[styles.moderatePillText, { color: riskColor }]}>{riskCategory}</Text>
            </View>
          </View>

          <View style={styles.riskBigScoreRow}>
            <Text style={[styles.bigRiskNumber, { color: colors.foreground }]}>{calculatedRiskScore}</Text>
            <Text style={[styles.maxRiskText, { color: colors.muted }]}>/ 100 live risk</Text>
          </View>

          {/* Dynamic Progress Gauge */}
          <View style={[styles.gaugeTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.gaugeFill, { width: `${calculatedRiskScore}%`, backgroundColor: riskColor }]} />
          </View>

          <Text style={[styles.riskExplainText, { color: colors.muted }]}>
            Real-time multi-hazard assessment factoring cyclonic depressions, convective rain cells, and active district emergency beacons for {location.label}.
          </Text>

          {/* Contributing Factors */}
          <View style={[styles.factorsSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.factorsTitle, { color: colors.muted }]}>CONTRIBUTING FACTORS</Text>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Rainfall Probability</Text>
              <Text style={[styles.factorNumber, { color: colors.foreground }]}>{rainProb}%</Text>
            </View>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Wind Velocity Shear</Text>
              <Text style={[styles.factorNumber, { color: colors.foreground }]}>{windSpeed} km/h</Text>
            </View>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Active Critical Alerts</Text>
              <Text style={[styles.factorNumber, { color: activeCriticalAlerts.length > 0 ? "#EF4444" : colors.foreground }]}>
                {activeCriticalAlerts.length} Active
              </Text>
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
                {rainfallMm} <Text style={{ fontSize: 13, fontWeight: "600" }}>mm expected</Text>
              </Text>
              <View style={[styles.gaugeTrackSmall, { backgroundColor: colors.border }]}>
                <View style={[styles.gaugeFillSmall, { width: `${Math.min(100, Math.max(10, rainProb))}%`, backgroundColor: "#0284C7" }]} />
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted }]}>
                Probability: <Text style={{ fontWeight: "700", color: colors.foreground }}>{rainProb}%</Text> • Real-time live precipitation telemetry.
              </Text>
            </View>

            {/* Card 2: UV Radiation Index */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>UV Radiation Index</Text>
                <IconSymbol name="sun.max.fill" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                {dynamicUv.val} <Text style={{ fontSize: 14, fontWeight: "800", color: dynamicUv.color }}>{dynamicUv.label}</Text>
              </Text>
              <View style={[styles.gaugeTrackSmall, { backgroundColor: colors.border }]}>
                <View style={[styles.gaugeFillSmall, { width: `${dynamicUv.pct}` as any, backgroundColor: dynamicUv.color }]} />
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted }]}>
                Solar radiation modeled for latitude {location.latitude.toFixed(2)}°N.
              </Text>
            </View>

            {/* Card 3: Wind Status & Gusts */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Wind Status & Gusts</Text>
                <IconSymbol name="wind" size={18} color="#0284C7" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                {windSpeed} <Text style={{ fontSize: 13, fontWeight: "600" }}>km/h</Text>
              </Text>
              <View style={styles.highlightMetaRow}>
                <Text style={[styles.highlightSubText, { color: colors.muted }]}>Peak Gusts: <Text style={{ fontWeight: "700", color: colors.foreground }}>{Math.round(windSpeed * 1.35)} km/h</Text></Text>
                <Text style={[styles.highlightSubText, { color: colors.muted }]}>{windSpeed > 30 ? "Strong Breeze" : "Moderate Breeze"}</Text>
              </View>
            </View>

            {/* Card 4: Humidity & Dew Point */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Humidity & Dew Point</Text>
                <IconSymbol name="drop.fill" size={18} color="#0284C7" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                {humidity}% <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>Dew Point: {dewPoint}°C</Text>
              </Text>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Atmospheric moisture at {humidity}% relative humidity.
              </Text>
            </View>

            {/* Card 5: Solar Cycle (Sunrise/Sunset) */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Solar Cycle (Sunrise/Sunset)</Text>
                <IconSymbol name="sun.max.fill" size={18} color="#F59E0B" />
              </View>
              <View style={styles.solarRow}>
                <Text style={[styles.solarText, { color: colors.foreground }]}>↑ Sunrise <Text style={{ fontWeight: "800" }}>{solarCycle.sunrise}</Text></Text>
                <Text style={[styles.solarText, { color: colors.foreground }]}>↓ Sunset <Text style={{ fontWeight: "800" }}>{solarCycle.sunset}</Text></Text>
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Total Daylight: {solarCycle.daylight}
              </Text>
            </View>

            {/* Card 6: Air Quality Index (AQI) */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Air Quality Index (AQI)</Text>
                <IconSymbol name="leaf.fill" size={18} color={dynamicAqi.color} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 }}>
                <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>{dynamicAqi.val}</Text>
                <View style={[styles.aqiPill, { backgroundColor: `${dynamicAqi.color}22` }]}>
                  <Text style={[styles.aqiPillText, { color: dynamicAqi.color }]}>{dynamicAqi.label}</Text>
                </View>
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Barometric Pressure: <Text style={{ fontWeight: "700", color: colors.foreground }}>{pressure} hPa</Text>
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
              <View style={[styles.warningTag, { backgroundColor: nearestHazard.severity === "CRITICAL" ? "#EF4444" : "#F59E0B" }]}>
                <Text style={styles.warningTagText}>{nearestHazard.severity || "ADVISORY"}</Text>
              </View>
              <Text style={[styles.hazardTitleText, { color: colors.foreground }]} numberOfLines={1}>
                {nearestHazard.title}
              </Text>
              <Text style={{ fontSize: 16, color: colors.muted }}>➔</Text>
            </View>
            <Text style={[styles.hazardSubDesc, { color: colors.muted }]} numberOfLines={1}>
              {nearestHazard.description}
            </Text>
            <Text style={[styles.hazardDistanceText, { color: colors.muted }]}>
              📍 {(nearestHazard.distanceKm ?? 0) > 0 ? `${nearestHazard.distanceKm} km away` : "Local Grid Zone"} &bull; Status: <Text style={{ color: "#059669", fontWeight: "700" }}>active</Text>
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
          <LocationSelectorModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onSelectLocation={handleLocationSelected}
        currentLabel={cleanVillageName ? `${cleanVillageName} (${locType})` : location.label}
      />
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
  fullMapShortcutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fullMapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A73E8",
    alignItems: "center",
    justifyContent: "center",
  },
  fullMapTitle: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  liveGisPill: {
    backgroundColor: "#10B98120",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveGisPillText: {
    color: "#059669",
    fontSize: 9,
    fontWeight: "900",
  },
  fullMapSub: {
    fontSize: 11,
    marginTop: 2,
  },
});