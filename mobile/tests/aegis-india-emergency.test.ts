import { describe, it, expect } from "vitest";
import {
  ALL_INDIA_EMERGENCY_SERVICES,
  getIndiaEmergencyServicesData,
  formatISTDateTime,
  formatRelativeTimeIST,
} from "@/lib/india-emergency-data";
import { IndiaEmergencyService } from "@/lib/services/aegis-types";

describe("Pan-India Emergency Services & Disaster Authorities", () => {
  it("includes all verified 24x7 National Helplines (112, 100, 108, 101, 1091, 1078, 1098, 1930)", () => {
    const nationalServices = ALL_INDIA_EMERGENCY_SERVICES.filter((s: IndiaEmergencyService) => s.isNational);
    const numbers = nationalServices.map((s: IndiaEmergencyService) => s.number);

    expect(numbers).toContain("112");
    expect(numbers).toContain("100");
    expect(numbers).toContain("108");
    expect(numbers).toContain("101");
    expect(numbers).toContain("1091");
    expect(numbers).toContain("1078");
    expect(numbers).toContain("1098");
    expect(numbers).toContain("1930");
  });

  it("filters state emergency services by state code and includes national fallback", () => {
    const apServices = getIndiaEmergencyServicesData("AP");
    expect(apServices.some((s: IndiaEmergencyService) => s.name.includes("Andhra Pradesh"))).toBe(true);
    expect(apServices.some((s: IndiaEmergencyService) => s.number === "112")).toBe(true);

    const mhServices = getIndiaEmergencyServicesData("MH");
    expect(mhServices.some((s: IndiaEmergencyService) => s.name.includes("Maharashtra"))).toBe(true);

    const odServices = getIndiaEmergencyServicesData("OD");
    expect(odServices.some((s: IndiaEmergencyService) => s.name.includes("Odisha"))).toBe(true);
  });

  it("formats dates and relative times accurately in Indian Standard Time (IST UTC+5:30)", () => {
    // 2026-09-20T08:00:00.000Z is 13:30 (1:30 PM) in IST
    const utcIso = "2026-09-20T08:00:00.000Z";
    const istFormatted = formatISTDateTime(utcIso);

    expect(istFormatted.fullFormatted).toContain("IST");
    expect(istFormatted.fullFormatted).toContain("2026");

    const relTimeNow = formatRelativeTimeIST(new Date().toISOString());
    expect(relTimeNow).toBe("Just now");

    const relTimePast = formatRelativeTimeIST(new Date(Date.now() - 300000).toISOString());
    expect(relTimePast).toBe("5m ago");
  });
});
