import { describe, expect, it, beforeEach } from "vitest";
import { AegisApiService } from "../lib/services/aegis-api";
import { clearCachedData } from "../lib/services/aegis-cache";

describe("Aegis API Service Layer", () => {
  beforeEach(async () => {
    await clearCachedData();
  });

  describe("getWeather", () => {
    it("returns complete weather data satisfying all required weather metrics", async () => {
      const response = await AegisApiService.getWeather(17.6868, 83.2185);

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.temperature).toBeDefined();
      expect(typeof response.data.temperature).toBe("number");
      expect(response.data.apparentTemperature).toBeDefined();
      expect(response.data.humidity).toBeDefined();
      expect(response.data.windSpeedKmH).toBeDefined();
      expect(response.data.rainfallMm).toBeDefined();
      expect(response.data.visibilityKm).toBeDefined();
      expect(response.data.weatherCode).toBeDefined();
      expect(response.data.weatherLabel).toBeDefined();
      expect(Array.isArray(response.data.forecast)).toBe(true);
      expect(response.data.forecast.length).toBeGreaterThanOrEqual(5);
      expect(response.source).toBeDefined();
      expect(["LIVE", "CACHED", "STALE"]).toContain(response.freshness);
      expect(response.lastUpdatedFormatted).toBeDefined();
    });
  });

  describe("getHazardAlerts", () => {
    it("returns verified regional hazard alerts with structured fields", async () => {
      const response = await AegisApiService.getHazardAlerts(17.6868, 83.2185);

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      const firstAlert = response.data[0];
      expect(firstAlert.id).toBeDefined();
      expect(firstAlert.type).toBeDefined();
      expect(firstAlert.title).toBeDefined();
      expect(["LOW", "MODERATE", "HIGH", "CRITICAL"]).toContain(firstAlert.severity);
      expect(firstAlert.affectedLocation).toBeDefined();
      expect(firstAlert.affectedLocation.name).toBeDefined();
      expect(firstAlert.description).toBeDefined();
      expect(firstAlert.issuedAt).toBeDefined();
      expect(firstAlert.expiresAt).toBeDefined();
      expect(firstAlert.source).toBeDefined();
      expect(firstAlert.status).toBeDefined();
    });
  });

  describe("getShelters", () => {
    it("returns verified high-ground evacuation shelters", async () => {
      const response = await AegisApiService.getShelters(17.6868, 83.2185);

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      const shelter = response.data[0];
      expect(shelter.id).toBeDefined();
      expect(shelter.name).toBeDefined();
      expect(shelter.elevationMeters).toBeGreaterThan(0);
      expect(shelter.totalCapacity).toBeGreaterThan(0);
      expect(shelter.amenities).toBeDefined();
      expect(shelter.amenities.drinkingWater).toBeDefined();
    });
  });

  describe("getHospitals", () => {
    it("returns emergency hospitals and trauma facilities", async () => {
      const response = await AegisApiService.getHospitals(17.6868, 83.2185);

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      const hospital = response.data[0];
      expect(hospital.id).toBeDefined();
      expect(hospital.name).toBeDefined();
      expect(hospital.openBeds).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Safe Ping, SOS Beacon & Community Report", () => {
    it("submits Safe Ping check-in cleanly", async () => {
      const res = await AegisApiService.submitSafePing({
        contact: "Family Circle (+91 98765 43210)",
        message: "I am safe and reached shelter",
        latitude: 17.6868,
        longitude: 83.2185,
      });

      expect(res.success).toBe(true);
      expect(res.message).toBeDefined();
    });

    it("submits SOS Beacon distress cleanly", async () => {
      const res = await AegisApiService.submitSosBeacon({
        hazard: "Waterlogging",
        people: 3,
        note: "Trapped near road corner",
        latitude: 17.6868,
        longitude: 83.2185,
      });

      expect(res.success).toBe(true);
      expect(res.message).toBeDefined();
    });

    it("submits Community Hazard Report cleanly", async () => {
      const res = await AegisApiService.submitCommunityReport({
        hazard: "Road Blocked",
        severity: "High",
        details: "Tree down across expressway",
        latitude: 17.6868,
        longitude: 83.2185,
      });

      expect(res.success).toBe(true);
      expect(res.message).toBeDefined();
    });
  });
});
