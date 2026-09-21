import { EventEmitter } from "events";
import {
  SosIncident,
  SosIncidentStatus,
  SosEmergencyCategory,
  CreateSosPayload,
  NearbySosOffer,
  SosResponder,
  SosRouteData,
  SosRouteStep,
  AegisRealtimeEvent,
  SosMapMarker,
  RecentActivity,
  HazardSeverity,
  SafeCheckInRecord,
  SasGridSector,
} from "../lib/services/aegis-types";
import { formatISTDateTime } from "../lib/india-emergency-data";
import * as db from "./db";

/**
 * Calculates Great-Circle Distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Generates intermediate navigation steps and coordinate polyline between responder and destination
 */
export function generateSosRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): SosRouteData {
  const distanceKm = calculateDistanceKm(startLat, startLng, destLat, destLng);
  const etaMinutes = Math.max(1, Math.round((distanceKm / 32) * 60));

  const pointsCount = 6;
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= pointsCount; i++) {
    const fraction = i / pointsCount;
    const curveOffset = Math.sin(fraction * Math.PI) * 0.0018;
    const lat = startLat + (destLat - startLat) * fraction + curveOffset;
    const lng = startLng + (destLng - startLng) * fraction - curveOffset;
    coordinates.push([parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]);
  }

  const steps: SosRouteStep[] = [
    {
      instruction: "Head toward emergency destination along safe transit corridor",
      distanceMeters: Math.round(distanceKm * 400),
      durationSeconds: Math.round(etaMinutes * 20),
    },
    {
      instruction: "Proceed with caution through verified elevated route",
      distanceMeters: Math.round(distanceKm * 400),
      durationSeconds: Math.round(etaMinutes * 25),
    },
    {
      instruction: "Approach requester live location on scene",
      distanceMeters: Math.round(distanceKm * 200),
      durationSeconds: Math.round(etaMinutes * 15),
    },
  ];

  return {
    coordinates,
    distanceKm,
    etaMinutes,
    steps,
    provider: "Aegis Emergency Dispatch Routing Engine",
  };
}

class SosService {
  private emitter = new EventEmitter();
  private incidents: Map<string, SosIncident> = new Map();
  private idempotencyMap: Map<string, SosIncident> = new Map();
  private safeCheckIns: SafeCheckInRecord[] = [];
  private declinedOffers: Map<string, Set<string>> = new Map();

  constructor() {
    this.emitter.setMaxListeners(100);
    this.loadPersistedData();
  }

  private async loadPersistedData() {
    try {
      const dbBeacons = await db.getSosBeacons(50);
      if (dbBeacons && dbBeacons.length > 0) {
        dbBeacons.forEach((b) => {
          const id = b.trackingId || `sos-${b.id}`;
          if (!this.incidents.has(id)) {
            this.incidents.set(id, {
              id,
              trackingId: b.trackingId || `AEGIS-SOS-${b.id}`,
              requesterId: String(b.userId || "usr-anon"),
              requesterName: b.requesterName || "Citizen User",
              category: (b.hazard as any) || "general",
              note: b.note || "Emergency assistance requested",
              peopleCount: b.people || 1,
              bloodGroup: b.bloodGroup || undefined,
              medicalNotes: b.medicalNotes || undefined,
              location: {
                latitude: b.latitude || 17.6868,
                longitude: b.longitude || 83.2185,
                accuracy: b.accuracy || 5,
                address: b.address || "Field Location",
                district: b.district || "Visakhapatnam",
                state: b.state || "Andhra Pradesh",
              },
              searchRadiusKm: 10,
              status: (b.status as any) || "MATCHING",
              createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
            });
          }
        });
      }

      const dbPings = await db.getSafePings(50);
      if (dbPings && dbPings.length > 0) {
        this.safeCheckIns = dbPings.map((p) => ({
          id: `ping-${p.id}`,
          userId: p.userId ? String(p.userId) : undefined,
          userName: p.userName || "Aegis Citizen",
          timestamp: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
          timestampFormattedIST: formatISTDateTime(p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString()).fullFormatted,
          location: {
            latitude: p.latitude || 17.6868,
            longitude: p.longitude || 83.2185,
            address: p.address || "Field Location",
          },
          relatedSosId: p.relatedSosId || undefined,
          status: "SAFE",
          message: p.message,
          contactsNotified: [p.contact],
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.warn("[SosService] Failed to load persisted SOS records:", e);
    }
  }

  public async createIncident(payload: CreateSosPayload, requester?: { id: string; name: string }): Promise<SosIncident> {
    if (payload.idempotencyKey && this.idempotencyMap.has(payload.idempotencyKey)) {
      return this.idempotencyMap.get(payload.idempotencyKey)!;
    }

    const now = new Date();
    const trackingCode = Math.floor(100000 + Math.random() * 900000);
    const trackingId = `AEGIS-SOS-${trackingCode}`;
    const incidentId = `sos-${now.getTime()}-${Math.floor(Math.random() * 1000)}`;

    const incident: SosIncident = {
      id: incidentId,
      trackingId,
      requesterId: requester?.id || payload.requesterId || `usr-${Date.now().toString(36)}`,
      requesterName: requester?.name || payload.requesterName || "Citizen Requester",
      category: payload.category || "general",
      note: payload.note || "Emergency distress signal broadcast",
      peopleCount: payload.peopleCount || 1,
      bloodGroup: payload.bloodGroup,
      medicalNotes: payload.medicalNotes,
      location: {
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy || 5,
        address: payload.address || `${payload.latitude.toFixed(4)}°N, ${payload.longitude.toFixed(4)}°E`,
        area: payload.area || "Sector Area",
        district: payload.district || "District Center",
        state: payload.state || "State",
      },
      searchRadiusKm: payload.searchRadiusKm || 10,
      status: "MATCHING",
      familyAlert: payload.familyContacts && payload.familyContacts.length > 0
        ? {
            notifiedCount: payload.familyContacts.length,
            contacts: payload.familyContacts.map((c) => `${c.name} (${c.phone})`),
            dispatchedAt: now.toISOString(),
            status: "SENT",
          }
        : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // 1. Insert into Database
    try {
      await db.createSosBeacon({
        trackingId,
        userId: requester?.id ? parseInt(requester.id, 10) || undefined : undefined,
        requesterName: requester?.name || "Citizen Requester",
        hazard: payload.category,
        note: payload.note,
        people: payload.peopleCount || 1,
        bloodGroup: payload.bloodGroup,
        medicalNotes: payload.medicalNotes,
        status: "MATCHING",
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy,
        address: payload.address,
        district: payload.district,
        state: payload.state,
      });
    } catch (dbErr) {
      console.warn("[SosService] DB insert warning for SOS beacon:", dbErr);
    }

    // 2. Insert into Recent Activities
    try {
      await db.createRecentActivity({
        type: "sos_beacon",
        title: `EMERGENCY SOS: ${payload.category.toUpperCase()}`,
        subtitle: `${payload.address || "Live Location"} • ${payload.peopleCount || 1} people in distress`,
        severity: "CRITICAL",
        status: "MATCHING",
        locationLabel: payload.address || "Live Location",
        latitude: payload.latitude,
        longitude: payload.longitude,
        relatedId: trackingId,
      });
    } catch (actErr) {
      console.warn("[SosService] Activity insert warning:", actErr);
    }

    this.incidents.set(incidentId, incident);
    if (payload.idempotencyKey) {
      this.idempotencyMap.set(payload.idempotencyKey, incident);
    }

    this.emitter.emit("event", {
      type: "sos.created",
      timestamp: now.toISOString(),
      data: incident,
    });

    return incident;
  }

  public getIncident(id: string): SosIncident | undefined {
    return this.incidents.get(id);
  }

  public listActiveIncidents(filter?: {
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    excludeRequesterId?: string;
  }): SosIncident[] {
    let result = Array.from(this.incidents.values()).filter(
      (inc) => inc.status !== "SAFE_RESOLVED" && inc.status !== "CANCELLED" && inc.status !== "EXPIRED"
    );

    if (filter?.excludeRequesterId) {
      result = result.filter((inc) => inc.requesterId !== filter.excludeRequesterId);
    }

    if (filter?.latitude !== undefined && filter?.longitude !== undefined) {
      const radius = filter.radiusKm || 25;
      result = result.filter((inc) => {
        const dist = calculateDistanceKm(filter.latitude!, filter.longitude!, inc.location.latitude, inc.location.longitude);
        return dist <= radius;
      });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getNearbyOffersForResponder(responderId: string, lat: number, lng: number): (NearbySosOffer & { approximateDistanceKm?: number; area?: string })[] {
    const activeList = this.listActiveIncidents({ latitude: lat, longitude: lng, radiusKm: 15, excludeRequesterId: responderId });
    const declined = this.declinedOffers.get(responderId) || new Set();

    return activeList
      .filter((inc) => inc.status === "MATCHING" || inc.status === "OFFERED")
      .filter((inc) => !declined.has(inc.id))
      .map((inc) => {
        const dist = calculateDistanceKm(lat, lng, inc.location.latitude, inc.location.longitude);
        const eta = Math.max(1, Math.round((dist / 30) * 60));
        const initials = inc.requesterName
          ? inc.requesterName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          : "U";

        const areaName = inc.location.area || "Harbor Basin Sector 02";

        return {
          sosId: inc.id,
          category: inc.category,
          title: `SOS: ${inc.category.toUpperCase()} Distress Signal`,
          severity: "CRITICAL" as HazardSeverity,
          distanceKm: dist,
          approximateDistanceKm: dist,
          area: areaName,
          estimatedArrivalMinutes: eta,
          peopleCount: inc.peopleCount,
          urgencyReason: inc.note || "Emergency responder dispatch needed",
          maskedLocation: {
            area: areaName,
            district: inc.location.district || "District",
            state: inc.location.state || "State",
            approximateLatitude: Math.round(inc.location.latitude * 100) / 100,
            approximateLongitude: Math.round(inc.location.longitude * 100) / 100,
          },
          requesterInitials: initials,
          timestamp: inc.createdAt,
          expiresInSeconds: 300,
        };
      });
  }

  public acceptSos(
    sosId: string,
    responderInfo: {
      id: string;
      name: string;
      phone?: string;
      badge?: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      address?: string;
    }
  ): { success: boolean; incident?: SosIncident & { assignedResponder?: SosResponder }; route?: SosRouteData; authorizedLocation?: any; alreadyAccepted?: boolean; error?: string } {
    const inc = this.incidents.get(sosId);
    if (!inc) return { success: false, error: "SOS incident not found" };

    if (inc.status !== "MATCHING" && inc.status !== "OFFERED") {
      return { success: false, alreadyAccepted: true, error: "This SOS has already been accepted." };
    }

    const dist = calculateDistanceKm(responderInfo.latitude, responderInfo.longitude, inc.location.latitude, inc.location.longitude);
    const eta = Math.max(1, Math.round((dist / 32) * 60));

    const responder: SosResponder = {
      id: responderInfo.id,
      name: responderInfo.name,
      phone: responderInfo.phone,
      badge: responderInfo.badge || "Verified Community First Responder",
      latitude: responderInfo.latitude,
      longitude: responderInfo.longitude,
      accuracy: responderInfo.accuracy,
      address: responderInfo.address,
      assignedAt: new Date().toISOString(),
      distanceKm: dist,
      etaMinutes: eta,
      status: "EN_ROUTE",
    };

    const route = generateSosRoute(responderInfo.latitude, responderInfo.longitude, inc.location.latitude, inc.location.longitude);

    inc.status = "RESPONDER_EN_ROUTE";
    inc.responder = responder;
    (inc as any).assignedResponder = responder;
    inc.routeToDestination = route;
    inc.updatedAt = new Date().toISOString();

    this.emitter.emit("event", {
      type: "sos.accepted",
      timestamp: inc.updatedAt,
      data: { incident: inc, responder, route },
    });

    return {
      success: true,
      incident: inc as any,
      route,
      authorizedLocation: inc.location,
    };
  }

  public declineSos(sosId: string, responderId: string): { success: boolean } {
    if (!this.declinedOffers.has(responderId)) {
      this.declinedOffers.set(responderId, new Set());
    }
    this.declinedOffers.get(responderId)!.add(sosId);
    return { success: true };
  }

  public updateLocation(
    sosId: string,
    role: "responder" | "requester",
    coord: { latitude: number; longitude: number; accuracy?: number; address?: string }
  ): { success: boolean; incident?: SosIncident & { assignedResponder?: SosResponder } } {
    const inc = this.incidents.get(sosId);
    if (!inc) return { success: false };

    if (role === "responder" && (inc.responder || (inc as any).assignedResponder)) {
      const resp = inc.responder || (inc as any).assignedResponder;
      resp.latitude = coord.latitude;
      resp.longitude = coord.longitude;
      resp.accuracy = coord.accuracy;
      if (coord.address) resp.address = coord.address;

      const dist = calculateDistanceKm(coord.latitude, coord.longitude, inc.location.latitude, inc.location.longitude);
      resp.distanceKm = dist;
      resp.etaMinutes = Math.max(1, Math.round((dist / 32) * 60));

      if (dist <= 0.05) {
        inc.status = "ON_SITE";
        resp.status = "ON_SITE";
      }

      inc.responder = resp;
      (inc as any).assignedResponder = resp;

      // Recalculate route polyline
      inc.routeToDestination = generateSosRoute(coord.latitude, coord.longitude, inc.location.latitude, inc.location.longitude);
    } else if (role === "requester") {
      inc.location.latitude = coord.latitude;
      inc.location.longitude = coord.longitude;
      inc.location.accuracy = coord.accuracy;
      if (coord.address) inc.location.address = coord.address;
    }

    inc.updatedAt = new Date().toISOString();

    this.emitter.emit("event", {
      type: "sos.location_updated",
      timestamp: inc.updatedAt,
      data: { incident: inc, role },
    });

    return { success: true, incident: inc as any };
  }

  public updateStatus(sosId: string, status: SosIncidentStatus, reason?: string): { success: boolean; incident?: SosIncident & { cancellationReason?: string } } {
    const inc = this.incidents.get(sosId);
    if (!inc) return { success: false };

    inc.status = status;
    inc.updatedAt = new Date().toISOString();
    if (status === "SAFE_RESOLVED" || (status as string) === "RESOLVED") {
      inc.resolvedAt = inc.updatedAt;
    }
    if (status === "CANCELLED" && reason) {
      (inc as any).cancellationReason = reason;
    }

    this.emitter.emit("event", {
      type: status === "SAFE_RESOLVED" || (status as string) === "RESOLVED" ? "sos.resolved" : status === "CANCELLED" ? "sos.cancelled" : "sos.updated",
      timestamp: inc.updatedAt,
      data: inc,
    });

    return { success: true, incident: inc as any };
  }

  public createSafeCheckIn(input: {
    userId?: string;
    userName?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    state?: string;
    district?: string;
    message?: string;
    relatedSosId?: string;
    contactsNotified?: string[];
    shelterId?: string;
    shelterName?: string;
    idempotencyKey?: string;
  }): SafeCheckInRecord {
    const now = new Date();
    const id = `checkin-${now.getTime()}-${Math.floor(Math.random() * 1000)}`;

    const checkIn: SafeCheckInRecord = {
      id,
      userId: input.userId,
      userName: input.userName || "Aegis User",
      timestamp: now.toISOString(),
      timestampFormattedIST: formatISTDateTime(now.toISOString()).fullFormatted,
      location: {
        latitude: input.latitude || 17.6868,
        longitude: input.longitude || 83.2185,
        address: input.address || "Field Location",
        state: input.state,
        district: input.district,
      },
      relatedSosId: input.relatedSosId,
      status: "SAFE",
      message: input.message || "I am currently safe.",
      contactsNotified: input.contactsNotified || ["Family & Emergency Circle"],
      shelterId: input.shelterId,
      shelterName: input.shelterName,
      familyNotifiedCount: input.contactsNotified ? input.contactsNotified.length : 1,
      idempotencyKey: input.idempotencyKey,
      createdAt: now.toISOString(),
    };

    // Insert into DB
    try {
      void db.createSafePing({
        userId: input.userId ? parseInt(input.userId, 10) || undefined : undefined,
        userName: input.userName || "Aegis User",
        contact: (input.contactsNotified || ["Family"])[0],
        message: checkIn.message,
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address,
        relatedSosId: input.relatedSosId,
        status: "synced",
      });

      void db.createRecentActivity({
        type: "safe_checkin",
        title: `Safe Check-In: ${input.userName || "Citizen"}`,
        subtitle: `${input.address || "Live Location"} • Status: Safe`,
        severity: "LOW",
        status: "SAFE",
        locationLabel: input.address || "Live Location",
        latitude: input.latitude,
        longitude: input.longitude,
        userId: input.userId ? parseInt(input.userId, 10) || undefined : undefined,
        relatedId: id,
      });
    } catch (e) {
      console.warn("[SosService] Safe checkin DB write warning:", e);
    }

    this.safeCheckIns.unshift(checkIn);

    this.emitter.emit("event", {
      type: "safe.reported",
      timestamp: now.toISOString(),
      data: checkIn,
    });

    return checkIn;
  }

  public getSosMapMarkers(options?: { role?: "citizen" | "responder" | "admin"; userId?: string; state?: string }): SosMapMarker[] {
    const list = Array.from(this.incidents.values()).filter((inc) => inc.status !== "SAFE_RESOLVED" && inc.status !== "CANCELLED");

    return list.map((inc) => {
      const isOwner = options?.userId && inc.requesterId === options.userId;
      const isAdminOrResponder = options?.role === "responder" || options?.role === "admin";
      const showExact = isOwner || isAdminOrResponder;

      return {
        id: `map-${inc.id}`,
        sosId: inc.id,
        category: inc.category,
        title: `Active SOS: ${inc.category.toUpperCase()}`,
        severity: "CRITICAL",
        status: inc.status,
        state: inc.location.state || "State",
        district: inc.location.district || "District",
        area: inc.location.area || "Sector",
        coordinates: {
          latitude: showExact ? inc.location.latitude : Math.round(inc.location.latitude * 100) / 100,
          longitude: showExact ? inc.location.longitude : Math.round(inc.location.longitude * 100) / 100,
        },
        isMasked: !showExact,
        peopleCount: inc.peopleCount,
        timestamp: inc.createdAt,
        freshness: "LIVE",
        deepLinkUrl: `/sos/${inc.id}`,
      };
    });
  }

  public getRecentActivities(limit: number = 25): RecentActivity[] {
    const items: RecentActivity[] = [];

    // 1. SOS Incidents
    this.incidents.forEach((inc) => {
      items.push({
        id: `act-sos-${inc.id}`,
        type: "sos_beacon",
        title: `EMERGENCY SOS: ${inc.category.toUpperCase()}`,
        summary: `${inc.location.area || inc.location.district || "Field Sector"} • Status: ${inc.status}`,
        severity: "CRITICAL",
        timestamp: inc.createdAt,
        timestampFormattedIST: formatISTDateTime(inc.createdAt).fullFormatted,
        relativeTime: "Active",
        locationName: inc.location.address || inc.location.area || "Location",
        state: inc.location.state,
        district: inc.location.district,
        coordinates: { latitude: inc.location.latitude, longitude: inc.location.longitude },
        status: inc.status,
        source: "Aegis Emergency Dispatch Network",
        deepLinkUrl: `/sos/${inc.id}`,
      });
    });

    // 2. Safe Check-Ins
    this.safeCheckIns.forEach((chk) => {
      items.push({
        id: `act-ping-${chk.id}`,
        type: "safe_checkin",
        title: `Safe Check-In: ${chk.userName || "Citizen"}`,
        summary: chk.message || "Reported Safe and Accessible",
        severity: "LOW",
        timestamp: chk.timestamp,
        timestampFormattedIST:
          typeof chk.timestampFormattedIST === "string"
            ? chk.timestampFormattedIST
            : chk.timestampFormattedIST?.fullFormatted || formatISTDateTime(chk.timestamp).fullFormatted,
        relativeTime: "Recent",
        locationName: chk.location.address || "Sector Location",
        state: chk.location.state,
        district: chk.location.district,
        coordinates: { latitude: chk.location.latitude, longitude: chk.location.longitude },
        status: "DELIVERED",
        source: "Aegis Safe Beacon",
        deepLinkUrl: `/beacon?mode=ping`,
      });
    });

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, limit);
  }

  public registerRealtimeListener(handler: (event: any) => void): () => void {
    this.emitter.on("event", handler);
    return () => {
      this.emitter.off("event", handler);
    };
  }
}

export const sosService = new SosService();
