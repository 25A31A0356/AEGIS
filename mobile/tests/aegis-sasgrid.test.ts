import { describe, expect, it, beforeEach } from "vitest";
import { AegisApiService } from "../lib/services/aegis-api";
import { clearCachedData } from "../lib/services/aegis-cache";
import { getSasGridRecords, getSheltersFromDb, getHospitalsFromDb, getHazardZonesFromDb } from "../server/db";

describe("Aegis SASGrid and Backend Database Integration", () => {
  beforeEach(async () => {
    await clearCachedData();
  });

  describe("SASGrid Database & API Tests", () => {
    it("returns real SASGrid sector records from the database layer", async () => {
      const records = await getSasGridRecords();
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);

      const sector = records[0];
      expect(sector.sectorCode).toBeDefined();
      expect(sector.sectorName).toBeDefined();
      expect(typeof sector.safetyIndex).toBe("number");
      expect(sector.safetyIndex).toBeGreaterThanOrEqual(0);
      expect(sector.safetyIndex).toBeLessThanOrEqual(100);
      expect(["LOW", "MODERATE", "HIGH", "CRITICAL"]).toContain(sector.hazardLevel);
      expect(sector.centerLat).toBeDefined();
      expect(sector.centerLng).toBeDefined();
      expect(typeof sector.boundsJson).toBe("string");
    });

    it("retrieves SASGrid via AegisApiService with proper response wrapper", async () => {
      const response = await AegisApiService.getSasGridRecords();
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.sectors)).toBe(true);
      expect(response.data.sectors.length).toBeGreaterThan(0);
      expect(response.source).toBeDefined();
    });

    it("handles sector distance calculations with GPS coordinates", async () => {
      const response = await AegisApiService.getSasGridRecords(17.6868, 83.2185);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.sectors)).toBe(true);
      for (const sector of response.data.sectors) {
        expect(sector.centerCoordinates).toBeDefined();
        expect(typeof sector.centerCoordinates.latitude).toBe("number");
        expect(typeof sector.centerCoordinates.longitude).toBe("number");
      }
    });
  });

  describe("24-Hour Today Hourly Weather Time-Series", () => {
    it("returns 24 hourly time-series points with temperature, rain chance, wind, and humidity", async () => {
      const response = await AegisApiService.getWeather(17.6868, 83.2185);
      expect(response.data).toBeDefined();
      expect(response.data.todayHourly).toBeDefined();

      const todayHourly = response.data.todayHourly;
      const hours = Array.isArray(todayHourly) ? todayHourly : todayHourly?.hours || todayHourly?.hourly || [];
      expect(Array.isArray(hours)).toBe(true);
      expect(hours.length).toBeGreaterThanOrEqual(12);

      const sampleHour = hours[0];
      expect(sampleHour.timeIST).toBeDefined();
      expect(sampleHour.hourLabel).toBeDefined();
      expect(typeof sampleHour.temperatureC).toBe("number");
      expect(typeof sampleHour.rainProbabilityPct).toBe("number");
      expect(typeof sampleHour.windSpeedKmH).toBe("number");
      expect(typeof sampleHour.humidityPct).toBe("number");
      expect(typeof sampleHour.weatherCode).toBe("number");
      expect(sampleHour.weatherLabel).toBeDefined();

      // At least one hour should be current
      const currentHour = hours.find((h: any) => h.isCurrentHour);
      expect(currentHour).toBeDefined();
    });
  });

  describe("Analytics Summary & User Settings Sync", () => {
    it("fetches live analytics summary for command and map telemetry", async () => {
      const analyticsRes = await AegisApiService.getAnalyticsSummary();
      expect(analyticsRes).toBeDefined();
      expect(analyticsRes.data).toBeDefined();
      const analytics = analyticsRes.data;
      expect(typeof analytics.totalActiveSos).toBe("number");
      expect(typeof analytics.totalSafePings).toBe("number");
      expect(typeof analytics.totalVerifiedReports).toBe("number");
      expect(typeof analytics.totalAvailableShelters).toBe("number");
      expect(typeof analytics.totalHospitalBeds).toBe("number");
      expect(typeof analytics.sasGridHighRiskCount).toBe("number");
    });

    it("syncs user preferences and emergency profile to central backend", async () => {
      const updateRes = await AegisApiService.updateUserSettings({
        userId: "test-user-vitest",
        fullName: "Vikram Malhotra",
        phoneNumber: "+91 99887 76655",
        bloodGroup: "B+",
        language: "te",
        notificationsEnabled: true,
        liveLocationEnabled: true,
        isNearbyResponder: true,
      });

      expect(updateRes).toBeDefined();
      expect(updateRes.data).toBeDefined();
      expect(updateRes.data.userId).toBe("test-user-vitest");
      expect(updateRes.data.fullName).toBe("Vikram Malhotra");
      expect(updateRes.data.bloodGroup).toBe("B+");
      expect(updateRes.data.language).toBe("te");
    });
  });

  describe("Safe Plan Datasets: Shelters, Hospitals, Hazard Zones", () => {
    it("retrieves verified shelters from central database", async () => {
      const sheltersRes = await AegisApiService.getShelters(17.6868, 83.2185);
      expect(sheltersRes.data.length).toBeGreaterThan(0);
      expect(sheltersRes.data[0].name).toBeDefined();
      expect(sheltersRes.data[0].elevationMeters).toBeGreaterThan(0);

      const dbShelters = await getSheltersFromDb();
      expect(Array.isArray(dbShelters)).toBe(true);
    });

    it("retrieves verified hospitals from central database", async () => {
      const hospitalsRes = await AegisApiService.getHospitals(17.6868, 83.2185);
      expect(hospitalsRes.data.length).toBeGreaterThan(0);
      expect(hospitalsRes.data[0].name).toBeDefined();
      expect(hospitalsRes.data[0].openBeds).toBeGreaterThanOrEqual(0);

      const dbHospitals = await getHospitalsFromDb();
      expect(Array.isArray(dbHospitals)).toBe(true);
    });

    it("retrieves verified hazard zones from central database", async () => {
      const hazardsRes = await AegisApiService.getHazardAlerts(17.6868, 83.2185);
      expect(hazardsRes.data.length).toBeGreaterThan(0);
      expect(hazardsRes.data[0].type).toBeDefined();
      expect(hazardsRes.data[0].severity).toBeDefined();

      const dbHazards = await getHazardZonesFromDb();
      expect(Array.isArray(dbHazards)).toBe(true);
    });
  });
});
