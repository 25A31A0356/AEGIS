import { describe, it, expect, beforeEach, vi } from "vitest";
import { AegisApiService } from "@/lib/services/aegis-api";
import { SosMapMarker } from "@/lib/services/aegis-types";
import * as apiModule from "@/lib/_core/api";

describe("Pan-India SOS Map & Privacy Masking", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches active SOS map markers and verifies privacy coordinates masking", async () => {
    const mockMarkers: SosMapMarker[] = [
      {
        id: "m-01",
        sosId: "sos-ap-01",
        category: "flooding",
        title: "Flash Inundation Rescue Needed",
        severity: "HIGH",
        status: "MATCHING",
        state: "Andhra Pradesh",
        district: "Visakhapatnam",
        area: "Low Basin Corridor",
        coordinates: {
          latitude: 17.6835,
          longitude: 83.2192,
        },
        isMasked: true,
        peopleCount: 4,
        timestamp: new Date().toISOString(),
        freshness: "LIVE",
        deepLinkUrl: "https://aegis.gov.in/sos/sos-ap-01",
      },
    ];

    vi.spyOn(apiModule, "apiCall").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockMarkers }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await AegisApiService.getSosMapMarkers({ state: "Andhra Pradesh" });
    expect(res.data.length).toBe(1);
    const marker = res.data[0];

    expect(marker.isMasked).toBe(true);
    expect(marker.state).toBe("Andhra Pradesh");
    expect(marker.deepLinkUrl).toBe("https://aegis.gov.in/sos/sos-ap-01");
  });

  it("generates correct authoritative web deep-link URL", () => {
    const url = AegisApiService.getDeepLinkWebSosUrl("sos-secure-abc123");
    expect(url).toBe("https://aegis.gov.in/sos/sos-secure-abc123");
  });
});
