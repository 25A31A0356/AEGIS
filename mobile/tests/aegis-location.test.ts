import { describe, expect, it } from "vitest";
import {
  sanitizeCoordinates,
  DEFAULT_FALLBACK_LOCATION,
  evaluateAccuracyTier,
} from "../lib/services/aegis-location";

describe("Aegis Location Service & Privacy", () => {
  it("sanitizes coordinates to 3 decimal places (~100m) to preserve user privacy", () => {
    const rawLat = 17.68684920194;
    const rawLng = 83.21852940123;

    const sanitized = sanitizeCoordinates(rawLat, rawLng);

    expect(sanitized.latitude).toBe(17.687);
    expect(sanitized.longitude).toBe(83.219);
  });

  it("provides valid default fallback location when GPS is unavailable", () => {
    expect(DEFAULT_FALLBACK_LOCATION.latitude).toBeDefined();
    expect(DEFAULT_FALLBACK_LOCATION.longitude).toBeDefined();
    expect(DEFAULT_FALLBACK_LOCATION.label).toContain("Sector");
  });

  it("evaluates high accuracy fix correctly", () => {
    expect(evaluateAccuracyTier(4.5)).toBe("HIGH_QUALITY");
    expect(evaluateAccuracyTier(18.0)).toBe("USABLE");
    expect(evaluateAccuracyTier(35.0)).toBe("APPROXIMATE");
    expect(evaluateAccuracyTier(100.0)).toBe("POOR");
  });
});
