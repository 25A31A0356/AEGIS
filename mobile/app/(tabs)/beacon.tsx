import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useEmergencyProfile, FamilyContact } from "@/lib/emergency-profile";
import { useAppPreferences } from "@/lib/app-preferences";
import { AegisApiService } from "@/lib/services/aegis-api";
import { getResponsibleLocation } from "@/lib/services/aegis-location";
import { DEFAULT_USER_LOCATION } from "@/lib/navigation-data";
import { getLocalSosState, OfflineSosState } from "@/lib/services/aegis-cache";
import { useAegisSosResponder } from "@/hooks/use-aegis-sos-responder";
import { NearbySosRequestModal } from "@/components/NearbySosRequestModal";

/**
 * Continuous Radar Wave Ripple Animation Component
 * Expands 3 concentric rings outward in a rhythmic beacon wave
 */
function WaveRipples({ color, active = false }: { color: "red" | "green"; active?: boolean }) {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = active ? 1100 : color === "red" ? 2200 : 2600;

    const createWaveLoop = (animVal: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animVal, {
            toValue: 1,
            duration: duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(animVal, {
            toValue: 0,
            duration: 0,
            useNativeDriver: Platform.OS !== "web",
          }),
        ])
      );
    };

    const anim1 = createWaveLoop(wave1, 0);
    const anim2 = createWaveLoop(wave2, duration * 0.33);
    const anim3 = createWaveLoop(wave3, duration * 0.66);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [active, color, wave1, wave2, wave3]);

  const rgb = color === "red" ? "217, 48, 37" : "24, 128, 56";

  const renderWave = (animVal: Animated.Value, key: number) => {
    const scale = animVal.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 2.35],
    });

    const opacity = animVal.interpolate({
      inputRange: [0, 0.25, 0.7, 1],
      outputRange: [0.75, 0.45, 0.18, 0],
    });

    return (
      <Animated.View
        key={key}
        style={[
          styles.waveRing,
          {
            backgroundColor: `rgba(${rgb}, 0.18)`,
            borderColor: `rgba(${rgb}, 0.55)`,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.waveAnchor} pointerEvents="none">
      {renderWave(wave1, 1)}
      {renderWave(wave2, 2)}
      {renderWave(wave3, 3)}
    </View>
  );
}

export default function BeaconScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile } = useEmergencyProfile();
  const { t, dict } = useAppPreferences();
  const { height: windowHeight } = useWindowDimensions();

  // Full Page Height for strictly isolating SOS and SAFE views
  const pageHeight = Math.max(480, windowHeight - 190);

  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState<0 | 1>(0);
  const [offlineSosState, setOfflineSosState] = useState<OfflineSosState | null>(null);
  useEffect(() => {
    getLocalSosState().then(setOfflineSosState).catch(() => {});
  }, []);

  // Rapido-style Nearby SOS Responder Hook with 7-stage lifecycle & safe check-in
  const {
    activeIncident,
    assignedIncident,
    incomingOffers,
    isSubmitting,
    isAccepting,
    acceptError,
    isSyncing,
    lifecycleDisplayState,
    triggerSos: triggerSosIncident,
    acceptOffer,
    declineOffer,
    cancelActiveSos,
    resolveActiveSos,
    syncPendingQueue,
    submitSafeCheckIn,
  } = useAegisSosResponder();

  // Live GPS Coordinate
  const [userCoord, setUserCoord] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  }>({
    latitude: DEFAULT_USER_LOCATION.lat,
    longitude: DEFAULT_USER_LOCATION.lng,
    address: "Locating live GPS...",
  });

  // Countdown State
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

  // Active family contacts
  const familyList: FamilyContact[] =
    profile.familyContacts && profile.familyContacts.length > 0
      ? profile.familyContacts
      : [
          {
            id: "fam-primary",
            name: profile.primaryContact.name,
            phone: profile.primaryContact.phone,
            relationship: profile.primaryContact.relationship,
            isPrimary: true,
          },
        ];

  const primaryContact =
    familyList.find((c) => c.isPrimary) || familyList[0] || profile.primaryContact;

  // Fetch Live Location
  const refreshLocation = async () => {
    try {
      const loc = await getResponsibleLocation();
      setUserCoord({
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.label,
      });
    } catch (e) {
      console.warn("Location error:", e);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  // Format SOS Message using standard AEGIS ALERT notification format
  const buildSosMessage = () => {
    const name = profile.fullName || "Citizen in Distress";
    const coordsStr = `${userCoord.latitude.toFixed(4)}, ${userCoord.longitude.toFixed(4)}`;
    const place = userCoord.address ? `${userCoord.address} (${coordsStr})` : coordsStr;
    return `Emergency SOS activated by ${name}. Current location: ${place}. Open AEGIS ALERT to view the live emergency location.`;
  };

  // Format Safe Message using Settings Info & Family
  const buildSafeMessage = () => {
    const name = profile.fullName || "User";
    const coordsStr = `${userCoord.latitude.toFixed(4)}, ${userCoord.longitude.toFixed(4)}`;
    const place = userCoord.address || "Live location";
    const custom = profile.customSafeMessage || "I am safe and out of danger.";

    return `SAFE CHECK-IN from ${name}: ${custom} Location: ${place} (${coordsStr}).`;
  };

  // Trigger Authoritative SOS Incident & Family Contacts Dispatch
  const triggerSos = async () => {
    const contactsSummary = familyList
      .filter((c) => c.phone)
      .map((c) => `${c.name} (${c.phone})`)
      .join(", ");

    const sosNote = `${profile.fullName} | Blood: ${profile.bloodGroup} | Med: ${profile.medicalNotes || "None"} | GPS: ${userCoord.address} (${userCoord.latitude.toFixed(4)}, ${userCoord.longitude.toFixed(4)}) | Family Alerted: ${contactsSummary || primaryContact.name}`;

    try {
      // 1. Create Authoritative SOS Incident on Aegis Software Backend
      await triggerSosIncident({
        category: "general",
        note: sosNote,
        familyContacts: familyList.map((f) => ({
          name: f.name,
          phone: f.phone,
          relationship: f.relationship,
        })),
      });

      // 2. Also register in traditional legacy beacon store for compatibility
      await AegisApiService.submitSosBeacon({
        hazard: "Emergency SOS",
        people: profile.peopleCount || familyList.length || 1,
        note: sosNote,
        latitude: userCoord.latitude,
        longitude: userCoord.longitude,
      });
    } catch (e) {
      console.warn("[Beacon] SOS Trigger Error:", e);
    }

    // 3. Automatically trigger emergency SMS with live GPS link to the configured family contact
    sendSmsSos();
  };

  const triggerSosRef = useRef(triggerSos);
  triggerSosRef.current = triggerSos;

  // SOS Countdown Handler
  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown <= 0) {
      setSosCountdown(null);
      void triggerSosRef.current();
      return;
    }
    const timer = setTimeout(() => {
      setSosCountdown((v) => (v === null ? null : v - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [sosCountdown]);

  const handlePressSos = () => {
    if (activeIncident) {
      Alert.alert(
        "SOS Incident Active",
        `An emergency SOS is currently active (${lifecycleDisplayState || activeIncident.status}). Would you like to cancel or mark resolved?`,
        [
          { text: "Cancel SOS", style: "destructive", onPress: () => cancelActiveSos() },
          { text: "I Am Safe", onPress: () => resolveActiveSos() },
          { text: "Dismiss", style: "cancel" },
        ]
      );
      return;
    }
    setSosCountdown(3);
  };

  const cancelSos = () => {
    setSosCountdown(null);
  };

  // Trigger Safe Check-in across all Family Contacts & Store History in IST
  // CRITICAL: If an active SOS incident exists, resolve it before submitting safe status.
  const triggerSafe = async () => {
    setSosCountdown(null);
    const safeMsg = buildSafeMessage();

    try {
      // Resolve any active SOS incident before sending safe check-in
      if (activeIncident) {
        try {
          await cancelActiveSos("User confirmed safe — SOS auto-resolved via Safe Check-In");
        } catch (sosErr) {
          console.warn("[Beacon] SOS auto-resolve on safe check-in failed:", sosErr);
          // Continue with safe check-in even if SOS resolve fails
        }
      }

      const res = await submitSafeCheckIn(safeMsg);
      Alert.alert(
        "Safe Check-In Broadcast",
        res.queued
          ? "✓ Safe check-in stored locally. Will sync to server when connection returns."
          : "✓ Safe status broadcast to server and family contacts successfully.",
        [{ text: "OK" }]
      );
    } catch (e) {
      console.warn("[Beacon] Safe Check-In Error:", e);
    }

    // Automatically trigger Safe check-in SMS with GPS coordinates to configured primary contact
    sendSmsSafe();
  };

  // Quick SMS Dispatch Handlers alerting all configured family contacts
  const sendSmsSos = (phoneOverride?: string) => {
    const validPhones = phoneOverride 
      ? [phoneOverride.replace(/[^0-9+]/g, "")]
      : familyList
          .map((c) => c.phone?.replace(/[^0-9+]/g, ""))
          .filter((p): p is string => Boolean(p && p.length >= 7));

    if (validPhones.length === 0) return;
    const body = encodeURIComponent(buildSosMessage());
    const phoneList = validPhones.join(Platform.OS === "ios" ? "&" : ",");
    Linking.openURL(`sms:${phoneList}${Platform.OS === "ios" ? "&" : "?"}body=${body}`);
  };

  const sendSmsSafe = (phoneOverride?: string) => {
    const targetPhone = (phoneOverride || primaryContact.phone || "").replace(/[^0-9+]/g, "");
    if (!targetPhone) return;
    const body = encodeURIComponent(buildSafeMessage());
    Linking.openURL(`sms:${targetPhone}${Platform.OS === "ios" ? "&" : "?"}body=${body}`);
  };

  const scrollToSos = () => {
    setCurrentPage(0);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollToSafe = () => {
    setCurrentPage(1);
    scrollRef.current?.scrollTo({ y: pageHeight, animated: true });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const pageIndex = Math.round(y / pageHeight);
    if (pageIndex === 1 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (pageIndex === 0 && currentPage !== 0) {
      setCurrentPage(0);
    }
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]} activeTab="beacon">
      {/* Clean Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            {t("greeting")} {profile.fullName || "Aarav"}
          </Text>
          <Text style={[styles.subGreeting, { color: colors.muted }]}>
            {currentPage === 0 ? dict.distressBeacon : dict.familyCheckIn}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={[styles.avatarButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.avatarText}>
            {profile.fullName?.trim() ? profile.fullName.trim()[0].toUpperCase() : "A"}
          </Text>
        </Pressable>
      </View>

      {/* Side-by-Side Pill Toggle Indicator */}
      <View style={[styles.modeSelectorBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          onPress={scrollToSos}
          style={[
            styles.modePill,
            currentPage === 0 && { backgroundColor: "#D93025" },
          ]}
        >
          <IconSymbol
            name="sos.circle.fill"
            size={15}
            color={currentPage === 0 ? "#FFFFFF" : "#D93025"}
          />
          <Text
            style={[
              styles.modePillText,
              { color: currentPage === 0 ? "#FFFFFF" : colors.foreground },
            ]}
          >
            {t("sos")} {activeIncident && "🚨 (ACTIVE)"}
          </Text>
        </Pressable>

        <Pressable
          onPress={scrollToSafe}
          style={[
            styles.modePill,
            currentPage === 1 && { backgroundColor: "#188038" },
          ]}
        >
          <IconSymbol
            name="antenna.radiowaves.left.and.right"
            size={15}
            color={currentPage === 1 ? "#FFFFFF" : "#188038"}
          />
          <Text
            style={[
              styles.modePillText,
              { color: currentPage === 1 ? "#FFFFFF" : colors.foreground },
            ]}
          >
            {dict.iAmSafe}
          </Text>
        </Pressable>
      </View>

      {/* Offline SOS Waiting For Network Banner */}
      {offlineSosState && !offlineSosState.isConfirmed && (
        <View style={[styles.activeResponderBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
          <View style={styles.activeResponderHeader}>
            <View style={[styles.responderTag, { backgroundColor: "#D97706" }]}>
              <IconSymbol name="antenna.radiowaves.left.and.right" size={14} color="#FFFFFF" />
              <Text style={styles.responderTagText}>OFFLINE SOS QUEUED</Text>
            </View>
            <Text style={[styles.responderEta, { color: "#B45309" }]}>
              Waiting for Network
            </Text>
          </View>
          <Text style={[styles.responderDest, { color: "#92400E", fontWeight: "700" }]}>
            Emergency request saved and waiting for network.
          </Text>
          <Text style={{ fontSize: 11, color: "#B45309", marginTop: 2 }}>
            Idempotency Key: {offlineSosState.idempotencyKey.substring(0, 18)}...
          </Text>
        </View>
      )}

      {/* Active Responder En Route Mode Banner (if user accepted an offer) */}
      {assignedIncident && (
        <View style={[styles.activeResponderBanner, { backgroundColor: colors.surface, borderColor: "#188038" }]}>
          <View style={styles.activeResponderHeader}>
            <View style={styles.responderTag}>
              <IconSymbol name="person.badge.shield.checkmark.fill" size={14} color="#FFFFFF" />
              <Text style={styles.responderTagText}>RESPONDER ACTIVE</Text>
            </View>
            <Text style={[styles.responderEta, { color: colors.primary }]}>
              {assignedIncident.assignedResponder?.distanceKm} km • ETA {assignedIncident.assignedResponder?.etaMinutes}m
            </Text>
          </View>
          <Text numberOfLines={1} style={[styles.responderDest, { color: colors.foreground }]}>
            Destination: {assignedIncident.location.address || assignedIncident.location.area}
          </Text>
          <View style={styles.responderActions}>
            <Pressable
              onPress={() => router.push("/map")}
              style={[styles.responderMapBtn, { backgroundColor: colors.primary }]}
            >
              <IconSymbol name="map.fill" size={13} color="#FFFFFF" />
              <Text style={styles.responderBtnText}>View Route on Map</Text>
            </Pressable>
            <Pressable
              onPress={resolveActiveSos}
              style={[styles.responderResolveBtn, { backgroundColor: "#188038" }]}
            >
              <IconSymbol name="checkmark.circle.fill" size={13} color="#FFFFFF" />
              <Text style={styles.responderBtnText}>Mark Resolved</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Quick India National Emergency Helplines Bar */}
      <View style={[styles.emergencyHelplinesBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.emergencyHelplinesLabel, { color: colors.muted }]}>PAN-INDIA HELPLINES:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.helplinesRow}>
          <Pressable
            onPress={() => Linking.openURL("tel:112")}
            style={[styles.helplineChip, { backgroundColor: "#D93025" }]}
          >
            <IconSymbol name="phone.fill" size={11} color="#FFFFFF" />
            <Text style={styles.helplineChipText}>112 National</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("tel:108")}
            style={[styles.helplineChip, { backgroundColor: "#EA580C" }]}
          >
            <IconSymbol name="cross.case.fill" size={11} color="#FFFFFF" />
            <Text style={styles.helplineChipText}>108 Ambulance</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("tel:100")}
            style={[styles.helplineChip, { backgroundColor: "#2563EB" }]}
          >
            <IconSymbol name="shield.fill" size={11} color="#FFFFFF" />
            <Text style={styles.helplineChipText}>100 Police</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("tel:101")}
            style={[styles.helplineChip, { backgroundColor: "#DC2626" }]}
          >
            <IconSymbol name="flame.fill" size={11} color="#FFFFFF" />
            <Text style={styles.helplineChipText}>101 Fire</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("tel:1078")}
            style={[styles.helplineChip, { backgroundColor: "#0D9488" }]}
          >
            <IconSymbol name="exclamationmark.triangle.fill" size={11} color="#FFFFFF" />
            <Text style={styles.helplineChipText}>1078 NDMA</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Vertical Paged ScrollView */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        pagingEnabled={true}
        decelerationRate="fast"
        snapToInterval={pageHeight}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ======================================================== */}
        {/* SLIDE 1: HERO ROUND SOS BUTTON OR ACTIVE SOS DASHBOARD */}
        {/* ======================================================== */}
        <View style={[styles.fullPageSlide, { height: pageHeight }]}>
          <View style={styles.heroCenterContent}>
            <Text style={[styles.heroKicker, { color: activeIncident?.isPending ? "#D97706" : "#D93025" }]}>
              {activeIncident
                ? activeIncident.isPending
                  ? "OFFLINE INCIDENT QUEUED"
                  : "AUTHORITATIVE INCIDENT DISPATCHED"
                : dict.criticalDistress}
            </Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              {activeIncident ? `STATE: ${lifecycleDisplayState || activeIncident.status}` : dict.emergencySos}
            </Text>

            {/* If Active SOS Incident is Running: Show Status Dashboard */}
            {activeIncident ? (
              <View
                style={[
                  styles.activeIncidentBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: activeIncident.isPending ? "#D97706" : "#D93025",
                  },
                ]}
              >
                {/* 7-Stage Lifecycle Display Banner */}
                <View style={styles.statusPillRow}>
                  <View
                    style={[
                      styles.pulsingDot,
                      { backgroundColor: activeIncident.isPending ? "#D97706" : "#D93025" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.activeStatusText,
                      { color: activeIncident.isPending ? "#D97706" : "#D93025" },
                    ]}
                  >
                    {lifecycleDisplayState || activeIncident.status}
                  </Text>
                </View>

                {/* Offline Warning Notice (if sync is pending) */}
                {activeIncident.isPending && (
                  <View style={[styles.offlineSyncNotice, { backgroundColor: "rgba(217, 119, 6, 0.12)" }]}>
                    <IconSymbol name="wifi.slash" size={14} color="#D97706" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.offlineNoticeTitle, { color: "#D97706" }]}>
                        OFFLINE — SYNC PENDING
                      </Text>
                      <Text style={[styles.offlineNoticeDesc, { color: colors.foreground }]}>
                        SOS is secured on device with GPS timestamp. Central server dispatch will transmit when connection connects.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => syncPendingQueue()}
                      disabled={isSyncing}
                      style={[styles.syncNowBtn, { backgroundColor: "#D97706" }]}
                    >
                      {isSyncing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.syncNowText}>Sync Now</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                {/* Assigned Responder Card */}
                {activeIncident.assignedResponder ? (
                  <View style={[styles.assignedCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.assignedAvatar}>
                      <IconSymbol name="person.badge.shield.checkmark.fill" size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.assignedName, { color: colors.foreground }]}>
                        {activeIncident.assignedResponder.name}
                      </Text>
                      <Text style={[styles.assignedBadge, { color: "#188038" }]}>
                        {activeIncident.assignedResponder.badge}
                      </Text>
                      <Text style={[styles.assignedMetrics, { color: colors.muted }]}>
                        📍 {activeIncident.assignedResponder.distanceKm} km away • ⏱ ETA {activeIncident.assignedResponder.etaMinutes} mins
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => router.push("/map")}
                      style={[styles.assignedMapBtn, { backgroundColor: colors.primary }]}
                    >
                      <IconSymbol name="map.fill" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : !activeIncident.isPending ? (
                  <View style={[styles.matchingRadarBox, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="small" color="#D93025" />
                    <Text style={[styles.matchingText, { color: colors.muted }]}>
                      Scanning active Aegis responders in {activeIncident.searchRadiusKm} km radius...
                    </Text>
                  </View>
                ) : null}

                {/* Family Contact Dispatch Badge */}
                <View style={styles.familyAlertBadge}>
                  <IconSymbol name="checkmark.circle.fill" size={13} color="#188038" />
                  <Text style={styles.familyAlertText}>
                    {activeIncident.familyAlert?.notifiedCount ?? 0} Family & Emergency Contacts Alerted
                  </Text>
                </View>

                {/* Actions: Cancel SOS or Mark Safe */}
                <View style={styles.activeActionsRow}>
                  <Pressable
                    onPress={() => cancelActiveSos()}
                    style={[styles.cancelActiveBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.cancelActiveBtnText, { color: colors.error }]}>Cancel SOS</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => resolveActiveSos()}
                    style={[styles.resolveActiveBtn, { backgroundColor: "#188038" }]}
                  >
                    <Text style={styles.resolveActiveBtnText}>I Am Safe</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Normal Standby Round SOS Button with Continuous Expanding Waves */
              <View style={styles.buttonWaveWrapper}>
                <WaveRipples color="red" active={sosCountdown !== null} />

                {sosCountdown === null ? (
                  <Pressable
                    onPress={handlePressSos}
                    disabled={isSubmitting}
                    style={({ pressed }) => [styles.roundOuterRed, pressed && styles.pressed]}
                  >
                    <View style={styles.roundMiddleRed}>
                      <View style={styles.roundButtonRed}>
                        {isSubmitting ? (
                          <ActivityIndicator size="large" color="#FFFFFF" />
                        ) : (
                          <>
                            <IconSymbol name="sos.circle.fill" size={56} color="#FFFFFF" />
                            <Text style={styles.roundMainTitle}>SOS</Text>
                            <Text style={styles.roundSubTitle}>{dict.holdOrTap}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ) : (
                  /* Circular SOS Countdown with Accelerated Waves */
                  <View style={styles.roundOuterRedActive}>
                    <View style={styles.roundMiddleRedActive}>
                      <View style={styles.roundButtonRedActive}>
                        <Text style={styles.countdownNumber}>{sosCountdown}</Text>
                        <Text style={styles.countdownText}>{dict.sendingSos}</Text>
                      </View>
                    </View>
                    <Pressable onPress={cancelSos} style={styles.cancelPill}>
                      <Text style={styles.cancelPillText}>{dict.cancel}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            <Text style={[styles.slideDesc, { color: colors.muted }]}>
              {activeIncident
                ? "Your live location and emergency status are broadcasting securely to nearby Aegis volunteers."
                : dict.broadcastDistressDesc}
            </Text>

            {/* Scroll Up Prompt to Reveal Safe */}
            <Pressable onPress={scrollToSafe} style={styles.scrollPrompt}>
              <Text style={[styles.scrollPromptText, { color: colors.muted }]}>
                {dict.scrollForSafe}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ======================================================== */}
        {/* SLIDE 2: HERO ROUND SAFE BUTTON (WITH RADAR WAVE RIPPLES)*/}
        {/* ======================================================== */}
        <View style={[styles.fullPageSlide, { height: pageHeight }]}>
          <View style={styles.heroCenterContent}>
            <Text style={[styles.heroKicker, { color: "#188038" }]}>{dict.familyCheckInKicker}</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>{dict.iAmSafe}</Text>

            {/* Centered Button Wrapper with Continuous Expanding Radar Wave Animation */}
            <View style={styles.buttonWaveWrapper}>
              <WaveRipples color="green" />

              <Pressable
                onPress={triggerSafe}
                style={({ pressed }) => [styles.roundOuterGreen, pressed && styles.pressed]}
              >
                <View style={styles.roundMiddleGreen}>
                  <View style={styles.roundButtonGreen}>
                    <IconSymbol name="antenna.radiowaves.left.and.right" size={56} color="#FFFFFF" />
                    <Text style={styles.roundMainTitle}>SAFE</Text>
                    <Text style={styles.roundSubTitle}>{dict.safeCheckIn}</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <Text style={[styles.slideDesc, { color: colors.muted }]}>
              {dict.sharesGpsDesc}
            </Text>

            {/* Scroll Down Prompt to Return to SOS */}
            <Pressable onPress={scrollToSos} style={styles.scrollPrompt}>
              <Text style={[styles.scrollPromptText, { color: colors.muted }]}>
                {dict.scrollForSos}
              </Text>
            </Pressable>
          </View>

          {/* Minimal Bottom Location & Family Contacts Link */}
          <Pressable
            onPress={() =>
              router.push({ pathname: "/utility/[section]", params: { section: "familyContacts" } } as any)
            }
            style={[styles.bottomInfoPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <IconSymbol name="person.2.fill" size={14} color={colors.primary} />
            <Text numberOfLines={1} style={[styles.bottomInfoText, { color: colors.foreground }]}>
              {familyList.length} {dict.familyContactsConfigured} • {dict.tapToManage}
            </Text>
            <IconSymbol name="chevron.right" size={12} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Rapido-Style Nearby SOS Responder Request Modal */}
      <NearbySosRequestModal
        visible={incomingOffers.length > 0}
        offer={incomingOffers[0] || null}
        isAccepting={isAccepting}
        errorMessage={acceptError}
        onAccept={acceptOffer}
        onDecline={declineOffer}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 6,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  subGreeting: {
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 2,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  modeSelectorBar: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    marginBottom: 12,
    gap: 6,
  },
  modePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: "900",
  },
  emergencyHelplinesBar: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 6,
  },
  emergencyHelplinesLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  helplinesRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  helplineChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  helplineChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  offlineSyncNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.3)",
  },
  offlineNoticeTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  offlineNoticeDesc: {
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
    lineHeight: 14,
  },
  syncNowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  syncNowText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  activeResponderBanner: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 6,
  },
  activeResponderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  responderTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#188038",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  responderTagText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
  },
  responderEta: {
    fontSize: 12.5,
    fontWeight: "800",
  },
  responderDest: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  responderActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  responderMapBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  responderResolveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  responderBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  fullPageSlide: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  heroCenterContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  heroKicker: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 20,
    textAlign: "center",
  },
  activeIncidentBox: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  statusPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D93025",
  },
  activeStatusText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#D93025",
  },
  matchingRadarBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  matchingText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "600",
  },
  assignedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  assignedAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#188038",
    alignItems: "center",
    justifyContent: "center",
  },
  assignedName: {
    fontSize: 13,
    fontWeight: "800",
  },
  assignedBadge: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  assignedMetrics: {
    fontSize: 11,
    marginTop: 2,
  },
  assignedMapBtn: {
    padding: 8,
    borderRadius: 10,
  },
  familyAlertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  familyAlertText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#188038",
  },
  activeActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelActiveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelActiveBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  resolveActiveBtn: {
    flex: 1.2,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resolveActiveBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  buttonWaveWrapper: {
    width: 250,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  waveAnchor: {
    position: "absolute",
    width: 146,
    height: 146,
    alignItems: "center",
    justifyContent: "center",
  },
  waveRing: {
    position: "absolute",
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 2,
  },
  roundOuterRed: {
    width: 206,
    height: 206,
    borderRadius: 103,
    backgroundColor: "rgba(217, 48, 37, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundMiddleRed: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(217, 48, 37, 0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundButtonRed: {
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: "#D93025",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 3.5,
    borderColor: "#FF8C7F",
    shadowColor: "#D93025",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  roundOuterRedActive: {
    width: 206,
    height: 206,
    borderRadius: 103,
    backgroundColor: "rgba(217, 48, 37, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundMiddleRedActive: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(217, 48, 37, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundButtonRedActive: {
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: "#D93025",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3.5,
    borderColor: "#FF8C7F",
  },
  countdownNumber: {
    fontSize: 46,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  countdownText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#FCE8E6",
    letterSpacing: 0.8,
  },
  cancelPill: {
    position: "absolute",
    bottom: -10,
    backgroundColor: "#202124",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cancelPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  roundOuterGreen: {
    width: 206,
    height: 206,
    borderRadius: 103,
    backgroundColor: "rgba(24, 128, 56, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundMiddleGreen: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(24, 128, 56, 0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundButtonGreen: {
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: "#188038",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 3.5,
    borderColor: "#66DB87",
    shadowColor: "#188038",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  roundMainTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  roundSubTitle: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.6,
    opacity: 0.9,
  },
  slideDesc: {
    fontSize: 12,
    marginTop: 18,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 16,
  },
  scrollPrompt: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  scrollPromptText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  bottomInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
  },
  bottomInfoText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
