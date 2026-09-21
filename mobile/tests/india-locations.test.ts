import { describe, it, expect } from "vitest";
import {
  INDIA_STATES_AND_UTS,
  ALL_INDIAN_DISTRICTS,
  POPULAR_INDIAN_REGIONS,
  searchIndianLocations,
  getDistrictsForState,
  findNearestDistrict,
  calculateDistanceKm,
} from "@/lib/india-locations";

describe("Pan-India Geographic Directory (28 States, 8 UTs, 780+ Districts)", () => {
  it("includes all 28 States and 8 Union Territories (36 administrative entities)", () => {
    expect(INDIA_STATES_AND_UTS.length).toBe(36);
    
    const states = INDIA_STATES_AND_UTS.filter((s) => !s.isUT);
    const uts = INDIA_STATES_AND_UTS.filter((s) => s.isUT);
    
    expect(states.length).toBe(28);
    expect(uts.length).toBe(8);

    const stateNames = states.map((s) => s.name);
    expect(stateNames).toContain("Andhra Pradesh");
    expect(stateNames).toContain("Maharashtra");
    expect(stateNames).toContain("Tamil Nadu");
    expect(stateNames).toContain("Uttar Pradesh");
    expect(stateNames).toContain("West Bengal");
    expect(stateNames).toContain("Kerala");
    expect(stateNames).toContain("Karnataka");
    expect(stateNames).toContain("Gujarat");
    expect(stateNames).toContain("Assam");
    expect(stateNames).toContain("Odisha");
    expect(stateNames).toContain("Rajasthan");

    const utNames = uts.map((u) => u.name);
    expect(utNames).toContain("Delhi");
    expect(utNames).toContain("Jammu and Kashmir");
    expect(utNames).toContain("Ladakh");
    expect(utNames).toContain("Andaman and Nicobar Islands");
    expect(utNames).toContain("Puducherry");
    expect(utNames).toContain("Chandigarh");
  });

  it("covers 780+ administrative districts with valid GPS centroid coordinates", () => {
    expect(ALL_INDIAN_DISTRICTS.length).toBeGreaterThanOrEqual(780);

    for (const district of ALL_INDIAN_DISTRICTS) {
      expect(district.id).toBeTruthy();
      expect(district.name).toBeTruthy();
      expect(district.state).toBeTruthy();

      // Latitude must be within India bounding box (6.0° N to 38.0° N)
      expect(district.latitude).toBeGreaterThanOrEqual(6.0);
      expect(district.latitude).toBeLessThanOrEqual(38.0);

      // Longitude must be within India bounding box (68.0° E to 98.0° E)
      expect(district.longitude).toBeGreaterThanOrEqual(68.0);
      expect(district.longitude).toBeLessThanOrEqual(98.0);
    }
  });

  it("provides popular hazard-prone coastal and metro regions for quick access", () => {
    expect(POPULAR_INDIAN_REGIONS.length).toBeGreaterThanOrEqual(8);
    const regionNames = POPULAR_INDIAN_REGIONS.map((r) => r.name);
    expect(regionNames).toContain("Visakhapatnam");
    expect(regionNames).toContain("Mumbai City");
    expect(regionNames).toContain("Chennai");
    expect(regionNames).toContain("Kolkata");
    expect(regionNames).toContain("New Delhi");
  });

  it("performs instant search across 780+ districts with case insensitivity and partial matching", () => {
    const vizagResults = searchIndianLocations("visakha");
    expect(vizagResults.length).toBeGreaterThan(0);
    expect(vizagResults[0].name).toBe("Visakhapatnam");
    expect(vizagResults[0].state).toBe("Andhra Pradesh");

    const mumbaiResults = searchIndianLocations("mumbai");
    expect(mumbaiResults.length).toBeGreaterThan(0);
    expect(mumbaiResults.some((r) => r.name.includes("Mumbai"))).toBe(true);

    const varanasiResults = searchIndianLocations("varanasi");
    expect(varanasiResults.length).toBeGreaterThan(0);
    expect(varanasiResults[0].name).toBe("Varanasi");
    expect(varanasiResults[0].state).toBe("Uttar Pradesh");

    const lehResults = searchIndianLocations("leh");
    expect(lehResults.length).toBeGreaterThan(0);
    expect(lehResults[0].name).toBe("Leh");
    expect(lehResults[0].state).toBe("Ladakh");
  });

  it("retrieves districts for state accurately", () => {
    const tamilNaduDistricts = getDistrictsForState("Tamil Nadu");
    expect(tamilNaduDistricts.length).toBeGreaterThanOrEqual(35);
    for (const d of tamilNaduDistricts) {
      expect(d.state).toBe("Tamil Nadu");
    }

    const assamDistricts = getDistrictsForState("Assam");
    expect(assamDistricts.length).toBeGreaterThanOrEqual(30);
    for (const d of assamDistricts) {
      expect(d.state).toBe("Assam");
    }
  });

  it("finds the nearest district accurately using haversine GPS calculations", () => {
    // Visakhapatnam GPS (17.6868, 83.2185)
    const vizagNearest = findNearestDistrict(17.6868, 83.2185);
    expect(vizagNearest.district.name).toBe("Visakhapatnam");
    expect(vizagNearest.distanceKm).toBeLessThan(15);

    // New Delhi GPS (28.6139, 77.2090)
    const delhiNearest = findNearestDistrict(28.6139, 77.2090);
    expect(delhiNearest.district.state).toBe("Delhi");
    expect(delhiNearest.distanceKm).toBeLessThan(25);

    // Chennai GPS (13.0827, 80.2707)
    const chennaiNearest = findNearestDistrict(13.0827, 80.2707);
    expect(chennaiNearest.district.name).toBe("Chennai");
    expect(chennaiNearest.distanceKm).toBeLessThan(15);
  });

  it("calculates accurate distance between coordinates", () => {
    // Distance between Delhi (28.6139, 77.2090) and Mumbai (19.0760, 72.8777) ~ 1150 km
    const dist = calculateDistanceKm(28.6139, 77.2090, 19.0760, 72.8777);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1250);
  });
});
