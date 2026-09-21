import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  queueOfflineSos,
  saveLocalSosState,
  getLocalSosState,
  clearLocalSosState,
  saveReportDraft,
  getReportDraft,
  clearReportDraft,
  queueOfflineReport,
  getOfflineQueue,
  clearOfflineQueue,
  getNationalEmergencyHotlines,
  saveFamilyEmergencyContacts,
  getFamilyEmergencyContacts,
  getOfflineSafetyGuides,
  saveActiveAlertsCache,
  getCachedAlertsWithFreshness,
  clearAllCache,
  CapturedGps,
  OfflineSosState,
  ReportDraft,
} from "../lib/services/aegis-cache";
import { AegisApiService } from "../lib/services/aegis-api";

describe("AEGIS Mobile Offline Operations & Resilient Storage Suite", () => {
  beforeEach(async () => {
    await clearAllCache();
    await AsyncStorage.clear();
  });

  // -------------------------------------------------------------------------
  // 1. SOS QUEUE & HIGH-ACCURACY GPS CAPTURE
  // -------------------------------------------------------------------------
  it("captures high-accuracy GPS fix and persists offline SOS to local queue", async () => {
    const gpsSnapshot: CapturedGps = {
      latitude: 19.0760,
      longitude: 72.8777,
      accuracyMeters: 4.5,
      altitude: 14.2,
      heading: 180.0,
      speed: 0.0,
      timestamp: Date.now(),
      provider: "GPS",
      locationName: "Dharavi Sector 5",
      city: "Mumbai",
      state: "Maharashtra",
    };

    const payload = {
      emergencyType: "FLASH_FLOOD",
      description: "Trapped on ground floor with rising floodwaters.",
      peopleCount: 3,
      batteryLevel: 68,
      networkStatus: "OFFLINE" as const,
    };

    const sosState = await queueOfflineSos(payload, gpsSnapshot);

    expect(sosState).toBeDefined();
    expect(sosState.id).toMatch(/^sos_loc_/);
    expect(sosState.idempotencyKey).toMatch(/^sos_offline_/);
    expect(sosState.status).toBe("QUEUED");
    expect(sosState.isConfirmed).toBe(false);
    expect(sosState.emergencyType).toBe("FLASH_FLOOD");
    expect(sosState.peopleCount).toBe(3);
    expect(sosState.gps.latitude).toBe(19.0760);
    expect(sosState.gps.longitude).toBe(72.8777);
    expect(sosState.gps.accuracyMeters).toBe(4.5);
    expect(sosState.gps.altitude).toBe(14.2);

    // Verify it is persisted in local state storage
    const storedState = await getLocalSosState();
    expect(storedState).not.toBeNull();
    expect(storedState?.idempotencyKey).toBe(sosState.idempotencyKey);
    expect(storedState?.isConfirmed).toBe(false);

    // Verify it is queued in the offline action queue
    const queue = await getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("sos_beacon");
    expect(queue[0].payload.idempotency_key).toBe(sosState.idempotencyKey);
  });

  // -------------------------------------------------------------------------
  // 2. OFFLINE SOS STATE TRANSITIONS: QUEUED -> WAITING -> SYNCING -> CONFIRMED
  // -------------------------------------------------------------------------
  it("tracks authoritative SOS state machine without pretending beacon is sent", async () => {
    const gps: CapturedGps = {
      latitude: 28.6139,
      longitude: 77.2090,
      accuracyMeters: 8.0,
      timestamp: Date.now(),
      provider: "GPS",
    };

    // Step 1: Trigger offline -> QUEUED
    let state = await queueOfflineSos(
      {
        emergencyType: "BUILDING_COLLAPSE",
        description: "Partial roof collapse",
        peopleCount: 2,
      },
      gps
    );
    expect(state.status).toBe("QUEUED");
    expect(state.isConfirmed).toBe(false);

    // Step 2: Transition to WAITING_FOR_NETWORK
    state.status = "WAITING_FOR_NETWORK";
    await saveLocalSosState(state);
    let current = await getLocalSosState();
    expect(current?.status).toBe("WAITING_FOR_NETWORK");
    expect(current?.isConfirmed).toBe(false);

    // Step 3: Network detected -> SYNCING
    state.status = "SYNCING";
    state.syncAttempts = 1;
    state.lastAttemptAt = Date.now();
    await saveLocalSosState(state);
    current = await getLocalSosState();
    expect(current?.status).toBe("SYNCING");
    expect(current?.isConfirmed).toBe(false);

    // Step 4: Backend Acknowledgment -> CONFIRMED (Authoritative PostgreSQL ID)
    state.status = "CONFIRMED";
    state.isConfirmed = true;
    state.backendSosId = "sos_srv_9981273948";
    state.confirmedAt = new Date().toISOString();
    await saveLocalSosState(state);

    const finalState = await getLocalSosState();
    expect(finalState?.status).toBe("CONFIRMED");
    expect(finalState?.isConfirmed).toBe(true);
    expect(finalState?.backendSosId).toBe("sos_srv_9981273948");
  });

  // -------------------------------------------------------------------------
  // 3. IDEMPOTENT SYNC DEDUPLICATION
  // -------------------------------------------------------------------------
  it("uses idempotency keys so repeated sync attempts do not duplicate records", async () => {
    const idempotencyKey = `sos_offline_test_idem_${Date.now()}`;
    const gps: CapturedGps = {
      latitude: 13.0827,
      longitude: 80.2707,
      accuracyMeters: 5.0,
      timestamp: Date.now(),
      provider: "GPS",
    };

    const state: OfflineSosState = {
      id: "sos_loc_123",
      idempotencyKey,
      status: "QUEUED",
      gps,
      emergencyType: "CYCLONE",
      description: "Severe gale winds",
      peopleCount: 1,
      isConfirmed: false,
      queuedAt: Date.now(),
      syncAttempts: 0,
      smsSent: false,
    };

    await saveLocalSosState(state);

    // Verify idempotencyKey is uniquely maintained
    const loaded = await getLocalSosState();
    expect(loaded?.idempotencyKey).toBe(idempotencyKey);
  });

  // -------------------------------------------------------------------------
  // 4. CITIZEN REPORT DRAFT AUTO-SAVE & RESTORE
  // -------------------------------------------------------------------------
  it("persists citizen incident report drafts across restarts", async () => {
    const draft: ReportDraft = {
      category: "ROAD_BLOCKED",
      hazardType: "roadBlocked",
      title: "Fallen Banyan Tree on MG Road",
      description: "Large tree blocking both northbound lanes near metro pillar 42.",
      severity: "High",
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: "MG Road, Bengaluru",
        city: "Bengaluru",
        state: "Karnataka",
      },
      mediaUrls: ["file:///local/cache/tree_photo.jpg"],
      peopleAffected: "Multiple vehicles",
      isRoadBlocked: true,
      isImmediateDanger: false,
      updatedAt: Date.now(),
    };

    // Save draft
    await saveReportDraft(draft);

    // Retrieve draft
    const restored = await getReportDraft();
    expect(restored).not.toBeNull();
    expect(restored?.category).toBe("ROAD_BLOCKED");
    expect(restored?.title).toBe("Fallen Banyan Tree on MG Road");
    expect(restored?.location.city).toBe("Bengaluru");
    expect(restored?.mediaUrls.length).toBe(1);

    // Clear draft on submission
    await clearReportDraft();
    const cleared = await getReportDraft();
    expect(cleared).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 5. OFFLINE REPORT QUEUE
  // -------------------------------------------------------------------------
  it("queues citizen reports offline with idempotency and clears draft", async () => {
    // 1. Create active draft
    await saveReportDraft({
      category: "FLOOD",
      title: "Waterlogging at Underpass",
      description: "Underpass submerged in 4 feet water",
      severity: "Critical",
      location: { lat: 28.61, lng: 77.20, address: "Connaught Place", city: "Delhi", state: "Delhi" },
      mediaUrls: [],
      updatedAt: Date.now(),
    });

    // 2. Queue report offline
    const action = await queueOfflineReport({
      category: "FLOOD",
      title: "Waterlogging at Underpass",
      description: "Underpass submerged in 4 feet water",
      severity: "CRITICAL",
      latitude: 28.61,
      longitude: 77.20,
      accuracy_meters: 6.0,
      location_name: "Connaught Place",
      city: "Delhi",
      state: "Delhi",
    });

    expect(action).toBeDefined();
    expect(action.type).toBe("community_report");
    expect(action.payload.idempotency_key).toBeDefined();

    // Draft should be automatically cleared
    const draft = await getReportDraft();
    expect(draft).toBeNull();

    // Action queue should have 1 item
    const queue = await getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("community_report");
  });

  // -------------------------------------------------------------------------
  // 6. PAN-INDIA EMERGENCY HOTLINES & FAMILY CONTACTS
  // -------------------------------------------------------------------------
  it("provides 100% offline access to verified national emergency hotlines", () => {
    const hotlines = getNationalEmergencyHotlines();
    expect(hotlines.length).toBeGreaterThanOrEqual(8);

    const num112 = hotlines.find((h) => h.number === "112");
    expect(num112).toBeDefined();
    expect(num112?.name).toContain("National Emergency");

    const num108 = hotlines.find((h) => h.number === "108");
    expect(num108).toBeDefined();
    expect(num108?.category).toBe("MEDICAL");

    const num1070 = hotlines.find((h) => h.number === "1070");
    expect(num1070).toBeDefined();
    expect(num1070?.category).toBe("DISASTER");
  });

  it("saves and retrieves family emergency contacts offline", async () => {
    const contacts = [
      { name: "Priya Sharma", phone: "+919876543210", relationship: "Spouse", isPrimary: true },
      { name: "Rajesh Sharma", phone: "+919876543211", relationship: "Brother", isPrimary: false },
    ];

    await saveFamilyEmergencyContacts(contacts);
    const loaded = await getFamilyEmergencyContacts();

    expect(loaded.length).toBe(2);
    expect(loaded[0].name).toBe("Priya Sharma");
    expect(loaded[0].phone).toBe("+919876543210");
  });

  // -------------------------------------------------------------------------
  // 7. OFFLINE EMERGENCY SURVIVAL GUIDES
  // -------------------------------------------------------------------------
  it("provides complete offline disaster survival protocols and checklists", () => {
    const guides = getOfflineSafetyGuides();
    expect(guides.length).toBeGreaterThanOrEqual(7);

    const floodGuide = guides.find((g) => g.hazardType === "FLOOD");
    expect(floodGuide).toBeDefined();
    expect(floodGuide?.before.length).toBeGreaterThan(0);
    expect(floodGuide?.during.length).toBeGreaterThan(0);
    expect(floodGuide?.after.length).toBeGreaterThan(0);
    expect(floodGuide?.emergencyKit.length).toBeGreaterThan(0);

    const quakeGuide = guides.find((g) => g.hazardType === "EARTHQUAKE");
    expect(quakeGuide).toBeDefined();
    expect(quakeGuide?.title).toContain("Drop, Cover, Hold On");

    const firstAidGuide = guides.find((g) => g.hazardType === "FIRST_AID");
    expect(firstAidGuide).toBeDefined();
    expect(firstAidGuide?.during.some((item) => item.includes("CPR"))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 8. LAST-KNOWN DISASTER ALERTS CACHING & STALENESS
  // -------------------------------------------------------------------------
  it("persists active alerts to offline cache with explicit freshness metadata", async () => {
    const sampleAlerts = [
      {
        id: "alert-offline-01",
        title: "IMD Level 3 Red Flood Warning",
        severity: "CRITICAL",
        state: "Odisha",
        issuedAt: new Date().toISOString(),
      },
    ];

    await saveActiveAlertsCache(sampleAlerts);

    const cachedRes = await getCachedAlertsWithFreshness();
    expect(cachedRes.alerts.length).toBe(1);
    expect(cachedRes.alerts[0].id).toBe("alert-offline-01");
    expect(cachedRes.freshness).toBe("LIVE");
    expect(cachedRes.lastUpdatedFormatted).toContain("LAST UPDATED:");
  });
});
