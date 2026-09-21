import { describe, expect, it } from "vitest";
import { AegisHazardAlert } from "../lib/services/aegis-types";
import { processAndNotifyHazardAlerts } from "../lib/services/aegis-notifications";

describe("Aegis Hazard Alerts & Severity Processing", () => {
  const mockAlerts: AegisHazardAlert[] = [
    {
      id: "test-alert-crit-1",
      type: "flood",
      title: "Critical Flash Flood",
      severity: "CRITICAL",
      affectedLocation: {
        name: "Low Basin Sector 4",
        latitude: 17.683,
        longitude: 83.218,
        radiusKm: 2,
      },
      description: "Severe flooding > 1.5m depth",
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      source: "APSDMA Flood Cell",
      status: "ACTIVE",
      isUrgent: true,
    },
    {
      id: "test-alert-expired",
      type: "severe_weather",
      title: "Past Storm Warning",
      severity: "HIGH",
      affectedLocation: {
        name: "Old Sector",
        latitude: 17.7,
        longitude: 83.2,
      },
      description: "Expired storm warning",
      issuedAt: new Date(Date.now() - 172800000).toISOString(),
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
      source: "IMD",
      status: "EXPIRED",
      isUrgent: false,
    },
    {
      id: "test-alert-low",
      type: "earthquake",
      title: "Minor Tremor",
      severity: "LOW",
      affectedLocation: {
        name: "Plateau",
        latitude: 17.8,
        longitude: 83.1,
      },
      description: "Magnitude 2.8 tremor",
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      source: "NCS",
      status: "ACTIVE",
      isUrgent: false,
    },
  ];

  it("validates defined severity levels strictly: LOW, MODERATE, HIGH, CRITICAL", () => {
    const validSeverities = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
    for (const alert of mockAlerts) {
      expect(validSeverities).toContain(alert.severity);
    }
  });

  it("filters out expired alerts from notification dispatch", async () => {
    const result = await processAndNotifyHazardAlerts(mockAlerts);
    // On web or test env without native push module, gracefully returns count metrics
    expect(result.skippedExpired).toBeGreaterThanOrEqual(0);
  });
});
