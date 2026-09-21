import { describe, it, expect, beforeEach, vi } from "vitest";
import { AegisApiService } from "@/lib/services/aegis-api";
import { clearAllCache, getCachedActivities } from "@/lib/services/aegis-cache";
import { RecentActivity } from "@/lib/services/aegis-types";
import * as apiModule from "@/lib/_core/api";

describe("Aegis Recent Activities Feed (IST compliant)", () => {
  beforeEach(async () => {
    await clearAllCache();
    vi.restoreAllMocks();
  });

  it("fetches recent activities from canonical endpoint and caches them locally", async () => {
    const mockActivities: RecentActivity[] = [
      {
        id: "act-1",
        type: "sos_beacon",
        title: "Coastal Distress SOS Triggered",
        summary: "High water surge reported in Low Basin Sector.",
        severity: "HIGH",
        timestamp: "2026-09-20T08:00:00.000Z",
        timestampFormattedIST: "20 Sep 2026, 01:30 PM IST",
        relativeTime: "5m ago",
        locationName: "Visakhapatnam East Sector",
        state: "Andhra Pradesh",
        district: "Visakhapatnam",
        status: "ACTIVE",
        source: "Aegis Pan-India Network",
        deepLinkUrl: "https://aegis.gov.in/sos/sos-test",
      },
    ];

    vi.spyOn(apiModule, "apiCall").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockActivities }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await AegisApiService.getRecentActivities();
    expect(result.data.length).toBe(1);
    expect(result.cached).toBe(false);
    expect(result.data[0].timestampFormattedIST).toContain("IST");

    // Local cache check
    const cached = await getCachedActivities();
    expect(cached?.length).toBe(1);
    expect(cached?.[0].id).toBe("act-1");
  });

  it("falls back to local resilient cache when network request fails", async () => {
    // 1. Prime the cache
    const mockActivities: RecentActivity[] = [
      {
        id: "act-cached-1",
        type: "safe_checkin",
        title: "Family Safe Check-In Broadcast",
        summary: "User checked in safely at SDMA High Ground Shelter.",
        timestamp: new Date().toISOString(),
        timestampFormattedIST: "20 Sep 2026, 01:45 PM IST",
        relativeTime: "10m ago",
        locationName: "Town Center Relief Shelter",
        source: "Aegis Safe Ping",
      },
    ];

    vi.spyOn(apiModule, "apiCall").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockActivities }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    await AegisApiService.getRecentActivities();

    // 2. Next call fails
    vi.spyOn(apiModule, "apiCall").mockRejectedValueOnce(new Error("Network disconnect"));

    const cachedResult = await AegisApiService.getRecentActivities();
    expect(cachedResult.cached).toBe(true);
    expect(cachedResult.data.length).toBe(1);
    expect(cachedResult.data[0].id).toBe("act-cached-1");
  });
});
