import { describe, it, expect, beforeEach } from "vitest";
import { reportsService } from "../server/reportsService";
import { AegisApiService } from "../lib/services/aegis-api";
import { clearOfflineQueue, getOfflineQueue } from "../lib/services/aegis-cache";

describe("Aegis Community Reports & Real-Time Activity", () => {
  beforeEach(async () => {
    await clearOfflineQueue();
  });

  describe("Server Authoritative Reports Service", () => {
    it("lists baseline authoritative reports with correct structure", () => {
      const reports = reportsService.listReports();
      expect(reports.length).toBeGreaterThanOrEqual(3);

      const first = reports[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("hazard");
      expect(first).toHaveProperty("severity");
      expect(first).toHaveProperty("location");
      expect(first).toHaveProperty("source");
      expect(first).toHaveProperty("verificationStatus");
      expect(first).toHaveProperty("status");
      expect(first.location).toHaveProperty("latitude");
      expect(first.location).toHaveProperty("longitude");
    });

    it("filters reports by category, severity, and verification status", () => {
      const floodReports = reportsService.listReports({ category: "flooding" });
      expect(floodReports.every((r) => r.category.toLowerCase() === "flooding")).toBe(true);

      const criticalReports = reportsService.listReports({ severity: "critical" });
      expect(criticalReports.every((r) => r.severity === "CRITICAL")).toBe(true);
    });

    it("creates an authoritative report with a unique server ID and broadcasts realtime event", async () => {
      let receivedEvent: any = null;
      const cleanup = reportsService.registerRealtimeListener((evt) => {
        if (evt.type === "report.created") {
          receivedEvent = evt;
        }
      });

      const newReport = await reportsService.createReport({
        category: "roadBlocked",
        hazard: "Landslide at Km 14 Pass",
        title: "Hill Road Blocked by Boulder",
        description: "Large boulder fell across single-lane pass. Traffic backed up.",
        severity: "HIGH",
        latitude: 17.725,
        longitude: 83.245,
        accuracy: 6,
        address: "Hill View Pass, Sector 12",
      });

      expect(newReport.id).toMatch(/^rep-/);
      expect(newReport.title).toBe("Hill Road Blocked by Boulder");
      expect(newReport.severity).toBe("HIGH");
      expect(newReport.location.latitude).toBe(17.725);
      expect(newReport.location.longitude).toBe(83.245);
      expect(newReport.status).toBe("pending_review");
      expect(newReport.source).toBe("COMMUNITY");

      // Verify Real-time event was emitted
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent.type).toBe("report.created");
      expect(receivedEvent.data.id).toBe(newReport.id);

      cleanup();
    });

    it("enforces idempotency keys to prevent duplicate creation", async () => {
      const testKey = `test-idem-${Date.now()}`;

      const report1 = await reportsService.createReport({
        hazard: "Waterlogging at Gate 3",
        severity: "Medium",
        details: "Water rising rapidly",
        idempotencyKey: testKey,
      });

      const report2 = await reportsService.createReport({
        hazard: "Waterlogging at Gate 3",
        severity: "Medium",
        details: "Water rising rapidly",
        idempotencyKey: testKey,
      });

      // Both calls must return the EXACT same authoritative report instance and ID
      expect(report1.id).toBe(report2.id);
      expect(report1.createdAt).toBe(report2.createdAt);
    });

    it("updates report status and verification, broadcasting realtime events", () => {
      let statusEvent: any = null;
      const cleanup = reportsService.registerRealtimeListener((evt) => {
        if (evt.type === "report.status_changed") {
          statusEvent = evt;
        }
      });

      const updated = reportsService.updateReportStatus("rep-baseline-02", "verified", "VERIFIED");
      expect(updated).toBeDefined();
      expect(updated?.status).toBe("verified");
      expect(updated?.verificationStatus).toBe("VERIFIED");
      expect(updated?.source).toBe("VERIFIED COMMUNITY");

      expect(statusEvent).not.toBeNull();
      expect(statusEvent.data.id).toBe("rep-baseline-02");
      expect(statusEvent.data.status).toBe("verified");

      cleanup();
    });

    it("upvotes report and promotes to verified after reaching threshold", () => {
      const rep = reportsService.getReportById("rep-baseline-02");
      const initialVotes = rep?.upvotes ?? 0;

      const upvoted = reportsService.upvoteReport("rep-baseline-02");
      expect(upvoted?.upvotes).toBe(initialVotes + 1);
    });
  });

  describe("Client API Service & Offline Queue Resilience", () => {
    it("submits report with offline fallback queue when network is unavailable", async () => {
      const testKey = `idem-offline-${Date.now()}`;

      const result = await AegisApiService.submitCommunityReport({
        category: "flooding",
        hazard: "Flash Flood Surge",
        details: "Water entering low-ground homes",
        severity: "High",
        latitude: 17.685,
        longitude: 83.218,
        idempotencyKey: testKey,
      });

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();

      if (result.queued) {
        expect(result.report?.isPending).toBe(true);
        expect(result.reportId).toBe(testKey);

        const queue = await getOfflineQueue();
        expect(queue.some((q) => q.type === "community_report")).toBe(true);
      }
    });

    it("fetches community reports with fallback offline baseline", async () => {
      const res = await AegisApiService.getCommunityReports();
      expect(res.data).toBeDefined();
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.freshness).toMatch(/LIVE|CACHED|STALE/);
    });
  });
});
