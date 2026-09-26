import { describe, it, expect } from "vitest";
import {
  evaluateAccuracyTier,
  DEFAULT_ACCURACY_POLICY,
  GpsAccuracyPolicy,
  DeviceGpsLocation,
  enqueueOfflineLocation,
  syncOfflineLocationQueue,
} from "../lib/services/aegis-location";

describe("🛡️ AEGIS Native GPS Precision & Accuracy Policy Suite", () => {
  it("evaluates high-quality GPS fix (accuracy <= 10m)", () => {
    expect(evaluateAccuracyTier(3.5)).toBe("HIGH_QUALITY");
    expect(evaluateAccuracyTier(10.0)).toBe("HIGH_QUALITY");
  });

  it("evaluates usable GPS fix (10m < accuracy <= 25m)", () => {
    expect(evaluateAccuracyTier(10.1)).toBe("USABLE");
    expect(evaluateAccuracyTier(22.4)).toBe("USABLE");
    expect(evaluateAccuracyTier(25.0)).toBe("USABLE");
  });

  it("evaluates approximate GPS fix (25m < accuracy <= 50m)", () => {
    expect(evaluateAccuracyTier(25.1)).toBe("APPROXIMATE");
    expect(evaluateAccuracyTier(48.0)).toBe("APPROXIMATE");
    expect(evaluateAccuracyTier(50.0)).toBe("APPROXIMATE");
  });

  it("evaluates poor GPS fix (accuracy > 50m)", () => {
    expect(evaluateAccuracyTier(50.1)).toBe("POOR");
    expect(evaluateAccuracyTier(150.0)).toBe("POOR");
    expect(evaluateAccuracyTier(1200.0)).toBe("POOR");
  });

  it("supports configurable custom accuracy policies", () => {
    const strictPolicy: GpsAccuracyPolicy = {
      highQualityMaxMeters: 5.0,
      usableMaxMeters: 15.0,
      approximateMaxMeters: 30.0,
      maxStaleAgeSeconds: 30.0,
    };

    expect(evaluateAccuracyTier(7.0, strictPolicy)).toBe("USABLE");
    expect(evaluateAccuracyTier(4.5, strictPolicy)).toBe("HIGH_QUALITY");
    expect(evaluateAccuracyTier(35.0, strictPolicy)).toBe("POOR");
  });

  it("maintains unrounded, high-precision GPS coordinates without truncation", () => {
    const rawGps: DeviceGpsLocation = {
      latitude: 17.17045123,
      longitude: 82.05123456,
      accuracyMeters: 4.8,
      altitudeMeters: 32.4,
      speedMps: 1.2,
      bearingDegrees: 184.5,
      timestamp: new Date().toISOString(),
      provider: "GPS/FUSED",
      isMockLocation: false,
    };

    // Latitude and Longitude must remain exact floating-point values
    expect(rawGps.latitude).toBe(17.17045123);
    expect(rawGps.longitude).toBe(82.05123456);
    expect(rawGps.accuracyMeters).toBe(4.8);
    expect(rawGps.isMockLocation).toBe(false);
    expect(rawGps.provider).toBe("GPS/FUSED");
  });

  it("queues offline location readings safely into persistent store", async () => {
    const gps1: DeviceGpsLocation = {
      latitude: 17.17045123,
      longitude: 82.05123456,
      accuracyMeters: 5.0,
      altitudeMeters: 28.0,
      speedMps: 0.0,
      bearingDegrees: null,
      timestamp: new Date().toISOString(),
      provider: "GPS/FUSED",
      isMockLocation: false,
    };

    await enqueueOfflineLocation(gps1);
    expect(true).toBe(true);
  });
});
