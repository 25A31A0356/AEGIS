import { describe, it, expect, beforeEach, vi } from "vitest";
import { AegisApiService } from "@/lib/services/aegis-api";
import {
  getSafeCheckInHistory,
  clearAllCache,
  saveLocalSosIncident,
  getLocalSosIncident,
} from "@/lib/services/aegis-cache";
import { SafeCheckInRecord, SosIncident } from "@/lib/services/aegis-types";
import * as apiModule from "@/lib/_core/api";

describe("Aegis Safe Check-In & History Preservation", () => {
  beforeEach(async () => {
    await clearAllCache();
    vi.restoreAllMocks();
  });

  it("submits a safe check-in and preserves IST formatted timestamp and location", async () => {
    const mockRecord: SafeCheckInRecord = {
      id: "safe-001",
      userId: "usr-01",
      userName: "Aarav Sharma",
      status: "delivered",
      timestamp: "2026-09-20T08:00:00.000Z",
      timestampFormattedIST: "20 Sep 2026, 01:30 PM IST",
      location: {
        latitude: 17.6868,
        longitude: 83.2185,
        address: "High Ground Shelter Sector 4",
        state: "Andhra Pradesh",
        district: "Visakhapatnam",
      },
      message: "Evacuated to High Ground Shelter. Safe and unharmed.",
      familyNotifiedCount: 2,
      familyContacts: [{ name: "Father", phone: "+919876543210" }],
      isOfflineSync: false,
    };

    vi.spyOn(apiModule, "apiCall").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockRecord }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await AegisApiService.submitSafeCheckIn({
      userId: "usr-01",
      userName: "Aarav Sharma",
      latitude: 17.6868,
      longitude: 83.2185,
      address: "High Ground Shelter Sector 4",
      state: "Andhra Pradesh",
      district: "Visakhapatnam",
      message: "Evacuated to High Ground Shelter. Safe and unharmed.",
      familyContacts: [{ name: "Father", phone: "+919876543210" }],
    });

    expect(result.success).toBe(true);
    expect(result.queued).toBe(false);
    expect(result.record.status).toBe("delivered");
    expect(result.record.timestampFormattedIST).toContain("IST");

    const history = await getSafeCheckInHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe(result.record.id);
  });

  it("preserves past SOS incident history when safe check-in is registered", async () => {
    // 1. Existing SOS incident is in history
    const pastSos: SosIncident = {
      id: "sos-past-01",
      requesterId: "usr-01",
      requesterName: "Aarav",
      category: "flooding",
      note: "Past distress alert",
      peopleCount: 2,
      location: { latitude: 17.6868, longitude: 83.2185 },
      searchRadiusKm: 10,
      status: "RESOLVED",
      familyAlert: { notifiedCount: 1, contacts: [], dispatchedAt: new Date().toISOString(), status: "DELIVERED" },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveLocalSosIncident(pastSos);

    // 2. Perform Safe Check-in
    vi.spyOn(apiModule, "apiCall").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await AegisApiService.submitSafeCheckIn({
      latitude: 17.6868,
      longitude: 83.2185,
      message: "Checked in safe.",
    });

    // 3. Past SOS incident must NOT be erased
    const localSos = await getLocalSosIncident();
    expect(localSos?.id).toBe("sos-past-01");
    expect(localSos?.status).toBe("RESOLVED");

    // 4. Safe history has the new check-in
    const safeHistory = await getSafeCheckInHistory();
    expect(safeHistory.length).toBe(1);
  });
});
