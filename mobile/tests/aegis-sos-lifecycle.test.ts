import { describe, it, expect, beforeEach, vi } from "vitest";
import { AegisApiService } from "@/lib/services/aegis-api";
import {
  getLocalSosIncident,
  clearAllCache,
  getOfflineQueue,
} from "@/lib/services/aegis-cache";
import { SosIncident } from "@/lib/services/aegis-types";
import * as apiModule from "@/lib/_core/api";

describe("Aegis SOS Incident Lifecycle & Offline Guarantee", () => {
  beforeEach(async () => {
    await clearAllCache();
    vi.restoreAllMocks();
  });

  it("accurately reports 'SERVER RECEIVED' when online incident creation succeeds", async () => {
    const mockIncident: SosIncident = {
      id: "sos-test-01",
      requesterId: "usr-01",
      requesterName: "Test User",
      category: "flooding",
      note: "Urgent evacuation required",
      peopleCount: 3,
      location: {
        latitude: 17.6868,
        longitude: 83.2185,
        accuracy: 5,
        address: "Sector 04",
      },
      searchRadiusKm: 10,
      status: "MATCHING",
      familyAlert: {
        notifiedCount: 2,
        contacts: ["Mom (+919876543210)"],
        dispatchedAt: new Date().toISOString(),
        status: "DELIVERED",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(apiModule, "apiCall").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockIncident }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await AegisApiService.createSosIncident({
      category: "flooding",
      note: "Urgent evacuation required",
      latitude: 17.6868,
      longitude: 83.2185,
    });

    expect(result.success).toBe(true);
    expect(result.queued).toBe(false);
    expect(result.displayState).toBe("SERVER RECEIVED");
    expect(result.incident?.id).toBe("sos-test-01");

    // Must be persisted locally so app restart retains incident
    const local = await getLocalSosIncident();
    expect(local?.id).toBe("sos-test-01");
  });

  it("never claims server delivery when offline; displays 'OFFLINE — SYNC PENDING' and queues action", async () => {
    // Simulate network outage
    vi.spyOn(apiModule, "apiCall").mockRejectedValueOnce(new Error("Network request failed"));

    const result = await AegisApiService.createSosIncident({
      category: "medical",
      note: "Oxygen support required immediately",
      latitude: 17.6868,
      longitude: 83.2185,
    });

    expect(result.success).toBe(true);
    expect(result.queued).toBe(true);
    expect(result.displayState).toBe("OFFLINE — SYNC PENDING");
    expect(result.incident?.isPending).toBe(true);
    expect(result.message).toContain("OFFLINE — SYNC PENDING");

    // Stored in persistent local queue
    const queue = await getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("sos_incident");

    // Local incident survives
    const local = await getLocalSosIncident();
    expect(local?.isPending).toBe(true);
  });

  it("synchronizes pending offline queue and updates incident when network is restored", async () => {
    // 1. First trigger offline
    vi.spyOn(apiModule, "apiCall").mockRejectedValueOnce(new Error("Offline"));
    const offlineResult = await AegisApiService.createSosIncident({
      category: "trapped",
      note: "Trapped on roof",
      latitude: 17.6868,
      longitude: 83.2185,
    });
    expect(offlineResult.queued).toBe(true);

    const queueBefore = await getOfflineQueue();
    expect(queueBefore.length).toBe(1);

    // 2. Reconnect and replay
    const syncedIncident: SosIncident = {
      ...offlineResult.incident!,
      id: "sos-synced-100",
      status: "MATCHING",
      isPending: false,
    };

    vi.spyOn(apiModule, "apiCall").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: syncedIncident }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const syncRes = await AegisApiService.syncOfflineQueue();
    expect(syncRes.syncedCount).toBe(1);
    expect(syncRes.remainingCount).toBe(0);

    const queueAfter = await getOfflineQueue();
    expect(queueAfter.length).toBe(0);
  });
});
