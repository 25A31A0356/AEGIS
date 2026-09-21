import { describe, it, expect } from "vitest";
import {
  sosService,
  calculateDistanceKm,
  generateSosRoute,
} from "../server/sosService";
import { AegisApiService } from "../lib/services/aegis-api";
import { CreateSosPayload } from "../lib/services/aegis-types";

describe("Aegis SOS Responder & Proximity Dispatch", () => {
  describe("1. Haversine Spatial Distance & Routing Engine", () => {
    it("accurately calculates distance between Vizag GPS coordinates", () => {
      // Station Road (17.684, 83.219) to Beach Road (17.712, 83.315) ~ 10.6 km
      const distance = calculateDistanceKm(17.684, 83.219, 17.712, 83.315);
      expect(distance).toBeGreaterThan(9.5);
      expect(distance).toBeLessThan(12.0);
    });

    it("generates realistic emergency navigation polyline, distance and ETA", () => {
      const route = generateSosRoute(17.684, 83.219, 17.698, 83.235);
      expect(route.distanceKm).toBeGreaterThan(0);
      expect(route.etaMinutes).toBeGreaterThanOrEqual(1);
      expect(route.coordinates.length).toBeGreaterThanOrEqual(6);
      expect(route.provider).toContain("Aegis");
    });
  });

  describe("2. Authoritative SOS Incident Creation & Idempotency", () => {
    it("creates an authoritative SOS incident with 10 km initial radius and family alert", async () => {
      const payload: CreateSosPayload = {
        category: "medical",
        note: "Severe asthma distress, need portable nebulizer/oxygen.",
        peopleCount: 1,
        bloodGroup: "O+",
        latitude: 17.6868,
        longitude: 83.2185,
        address: "Sector 04 High Ground Alley",
        area: "Sector 04",
        familyContacts: [
          { name: "Suresh K.", phone: "+919876543210", relationship: "Brother" },
        ],
        requesterId: "usr-req-test-01",
        requesterName: "Pooja K.",
      };

      const incident = await sosService.createIncident(payload);
      expect(incident.id).toMatch(/^sos-/);
      expect(incident.status).toBe("MATCHING");
      expect(incident.searchRadiusKm).toBe(10);
      expect(incident.category).toBe("medical");
      expect(incident.familyAlert?.status).toBe("SENT");
      expect(incident.familyAlert?.notifiedCount).toBe(1);
    });

    it("prevents duplicate creation using idempotency keys", async () => {
      const idemKey = `idem-test-sos-${Date.now()}`;
      const payload: CreateSosPayload = {
        category: "trapped",
        note: "Stuck in building basement water ingress.",
        latitude: 17.691,
        longitude: 83.225,
        idempotencyKey: idemKey,
      };

      const first = await sosService.createIncident(payload);
      const second = await sosService.createIncident(payload);
      expect(first.id).toBe(second.id);
    });
  });

  describe("3. Proximity Matching & Privacy Preservation", () => {
    it("offers masked alert to eligible responders within 10 km without leaking private coordinates", async () => {
      const incident = await sosService.createIncident({
        category: "flood",
        note: "Water rising rapidly.",
        latitude: 17.700,
        longitude: 83.220,
        area: "Harbor Basin Sector 02",
        requesterId: "usr-req-flood-99",
      });

      // Candidate responder located 2 km away
      const offers = sosService.getNearbyOffersForResponder(
        "resp-nearby-01",
        17.715,
        83.225
      );

      const targetOffer = offers.find((o) => o.sosId === incident.id);
      expect(targetOffer).toBeDefined();
      expect(targetOffer?.approximateDistanceKm).toBeLessThan(5);
      expect(targetOffer?.area).toBe("Harbor Basin Sector 02");
      expect(targetOffer?.category).toBe("flood");
      // Confirm exact latitude/longitude is not directly in the masked offer structure
      expect((targetOffer as any).latitude).toBeUndefined();
    });

    it("excludes requester from receiving their own SOS offer", async () => {
      const incident = await sosService.createIncident({
        category: "accident",
        latitude: 17.680,
        longitude: 83.210,
        requesterId: "usr-self-test",
      });

      const offers = sosService.getNearbyOffersForResponder(
        "usr-self-test",
        17.680,
        83.210
      );
      const ownOffer = offers.find((o) => o.sosId === incident.id);
      expect(ownOffer).toBeUndefined();
    });

    it("respects responder decline and does not re-offer the declined incident", async () => {
      const incident = await sosService.createIncident({
        category: "fire",
        latitude: 17.695,
        longitude: 83.230,
      });

      const respId = "resp-busy-volunteer";
      const beforeDecline = sosService.getNearbyOffersForResponder(respId, 17.696, 83.231);
      expect(beforeDecline.some((o) => o.sosId === incident.id)).toBe(true);

      // Decline offer
      sosService.declineSos(incident.id, respId);

      const afterDecline = sosService.getNearbyOffersForResponder(respId, 17.696, 83.231);
      expect(afterDecline.some((o) => o.sosId === incident.id)).toBe(false);
    });
  });

  describe("4. First-Come Mutex Acceptance & Competing Accept Conflict", () => {
    it("successfully assigns the first responder, calculates route, and reveals authorized location", async () => {
      const incident = await sosService.createIncident({
        category: "medical",
        latitude: 17.685,
        longitude: 83.215,
        address: "Flat 302, Green Valley Apartments",
      });

      const acceptRes = sosService.acceptSos(incident.id, {
        id: "resp-alice-first",
        name: "Alice M. (Certified EMT)",
        phone: "+919123456780",
        badge: "Paramedic Volunteer",
        latitude: 17.700,
        longitude: 83.225,
      });

      expect(acceptRes.success).toBe(true);
      expect(acceptRes.incident?.status).toBe("RESPONDER_EN_ROUTE");
      expect(acceptRes.incident?.assignedResponder?.id).toBe("resp-alice-first");
      expect(acceptRes.route).toBeDefined();
      expect(acceptRes.authorizedLocation?.address).toBe("Flat 302, Green Valley Apartments");
    });

    it("rejects competing second responder when incident is already claimed", async () => {
      const incident = await sosService.createIncident({
        category: "general",
        latitude: 17.680,
        longitude: 83.210,
      });

      // 1. Responder A accepts first
      const firstRes = sosService.acceptSos(incident.id, {
        id: "resp-first-hero",
        name: "First Responder",
        latitude: 17.685,
        longitude: 83.215,
      });
      expect(firstRes.success).toBe(true);

      // 2. Responder B tries to accept competing
      const secondRes = sosService.acceptSos(incident.id, {
        id: "resp-second-candidate",
        name: "Second Responder",
        latitude: 17.686,
        longitude: 83.216,
      });

      expect(secondRes.success).toBe(false);
      expect(secondRes.alreadyAccepted).toBe(true);
      expect(secondRes.error).toBe("This SOS has already been accepted.");
    });
  });

  describe("5. Live Location Updates & Automatic On-Site Detection", () => {
    it("updates responder live location, recalculates route, and detects on-site arrival", async () => {
      const incident = await sosService.createIncident({
        category: "cyclone",
        latitude: 17.690,
        longitude: 83.220,
      });

      sosService.acceptSos(incident.id, {
        id: "resp-mobile-hero",
        name: "Mobile Rescue Volunteer",
        latitude: 17.710,
        longitude: 83.240,
      });

      // Update location as responder approaches destination
      const update1 = sosService.updateLocation(incident.id, "responder", {
        latitude: 17.695,
        longitude: 83.225,
      });
      expect(update1.success).toBe(true);
      expect(update1.incident?.assignedResponder?.distanceKm).toBeLessThan(1.5);

      // Arrival within 30 meters
      const updateArrived = sosService.updateLocation(incident.id, "responder", {
        latitude: 17.69001,
        longitude: 83.22001,
      });
      expect(updateArrived.success).toBe(true);
      expect(updateArrived.incident?.status).toBe("ON_SITE");
      expect(updateArrived.incident?.assignedResponder?.status).toBe("ON_SITE");
    });
  });

  describe("6. Incident Lifecycle: Resolve and Cancel", () => {
    it("resolves SOS incident and records resolution timestamp", async () => {
      const incident = await sosService.createIncident({
        category: "general",
        latitude: 17.685,
        longitude: 83.215,
      });

      const resolved = sosService.updateStatus(incident.id, "RESOLVED");
      expect(resolved.success).toBe(true);
      expect(resolved.incident?.status).toBe("RESOLVED");
      expect(resolved.incident?.resolvedAt).toBeDefined();
    });

    it("cancels SOS incident and records reason", async () => {
      const incident = await sosService.createIncident({
        category: "general",
        latitude: 17.685,
        longitude: 83.215,
      });

      const cancelled = sosService.updateStatus(incident.id, "CANCELLED", "Water receded safely.");
      expect(cancelled.success).toBe(true);
      expect(cancelled.incident?.status).toBe("CANCELLED");
      expect(cancelled.incident?.cancellationReason).toBe("Water receded safely.");
    });
  });

  describe("7. Client API Service & Offline Queue Resilience", () => {
    it("creates SOS incident with fallback offline queue when network is offline", async () => {
      const res = await AegisApiService.createSosIncident({
        category: "medical",
        note: "Offline test incident",
        latitude: 17.685,
        longitude: 83.215,
      });

      expect(res.success).toBe(true);
      expect(res.sosId).toBeDefined();
      expect(res.incident?.category).toBe("medical");
    });
  });
});
