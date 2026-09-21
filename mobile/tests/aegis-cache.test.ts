import { describe, expect, it, beforeEach } from "vitest";
import {
  formatLastUpdated,
  calculateFreshness,
  setCachedData,
  getCachedData,
  clearCachedData,
  queueOfflineAction,
  getOfflineQueue,
  removeQueuedAction,
} from "../lib/services/aegis-cache";

describe("Aegis Cache & Freshness Engine", () => {
  beforeEach(async () => {
    await clearCachedData();
  });

  describe("formatLastUpdated", () => {
    it("formats recent timestamp as 'Just now'", () => {
      const now = Date.now();
      expect(formatLastUpdated(now)).toBe("LAST UPDATED: Just now");
    });

    it("formats timestamp 15 minutes ago as '15m ago'", () => {
      const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
      expect(formatLastUpdated(fifteenMinsAgo)).toBe("LAST UPDATED: 15m ago");
    });

    it("formats timestamp 3 hours ago as '3h ago'", () => {
      const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
      expect(formatLastUpdated(threeHoursAgo)).toBe("LAST UPDATED: 3h ago");
    });

    it("handles invalid dates gracefully", () => {
      expect(formatLastUpdated("invalid-date")).toBe("LAST UPDATED: Unknown");
    });
  });

  describe("calculateFreshness", () => {
    const ttlMs = 15 * 60 * 1000; // 15 mins

    it("returns LIVE when age is within TTL", () => {
      const timestamp = Date.now() - 5 * 60 * 1000; // 5 mins ago
      expect(calculateFreshness(timestamp, ttlMs)).toBe("LIVE");
    });

    it("returns CACHED when age is between 1x and 4x TTL", () => {
      const timestamp = Date.now() - 30 * 60 * 1000; // 30 mins ago
      expect(calculateFreshness(timestamp, ttlMs)).toBe("CACHED");
    });

    it("returns STALE when age exceeds 4x TTL", () => {
      const timestamp = Date.now() - 120 * 60 * 1000; // 2 hours ago
      expect(calculateFreshness(timestamp, ttlMs)).toBe("STALE");
    });
  });

  describe("setCachedData & getCachedData", () => {
    it("stores and retrieves typed data from cache", async () => {
      const sampleData = { temperature: 28, humidity: 70 };
      await setCachedData("test_weather", sampleData, 60000, "Test Source");

      const cached = await getCachedData<typeof sampleData>("test_weather");
      expect(cached).not.toBeNull();
      expect(cached?.data.temperature).toBe(28);
      expect(cached?.data.humidity).toBe(70);
      expect(cached?.freshness).toBe("LIVE");
      expect(cached?.source).toBe("Test Source");
    });

    it("returns null for non-existent cache key", async () => {
      const cached = await getCachedData("non_existent_key");
      expect(cached).toBeNull();
    });
  });

  describe("Offline Queue", () => {
    it("queues and retrieves offline actions", async () => {
      const action = await queueOfflineAction("safe_ping", {
        contact: "Mom (+91 98765 43210)",
        message: "I am safe",
      });

      expect(action.id).toBeDefined();
      expect(action.type).toBe("safe_ping");

      const queue = await getOfflineQueue();
      expect(queue.some((q) => q.id === action.id)).toBe(true);

      await removeQueuedAction(action.id);
      const updatedQueue = await getOfflineQueue();
      expect(updatedQueue.some((q) => q.id === action.id)).toBe(false);
    });
  });
});
