/**
 * AEGIS ALERT - Central SOS Backend Service
 * Authoritative single source of truth for emergency distress signals, multi-agency dispatch triage,
 * live responder location updates, and realtime event broadcasting.
 */

import { RealtimeHub } from './RealtimeHub';
import { AuditLogger } from './AuditLogger';
import { SanitizationMiddleware } from '../middleware/sanitizationMiddleware';

export type CanonicalSOSTriageStatus =
  | 'PENDING'
  | 'MATCHING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'RESPONDER_EN_ROUTE'
  | 'ON_SITE'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface SOSResponderUnit {
  unitId: string;
  unitName: string;
  callsign?: string;
  unitType: 'NDRF Quick Response Team' | 'NDRF Rescue Boat' | 'SDRF Boat Crew' | 'State Emergency Ambulance (108)' | 'Fire & Rescue Service' | 'Disaster Civil Defence' | string;
  commanderName?: string;
  commanderContact?: string;
  contactPhone: string;
  etaMinutes: number;
  distanceKm: number;
  responderCoordinates: [number, number];
  lastPing: string;
}

export interface SOSTimelineRecord {
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
}

export interface SOSBeaconRecord {
  id: string;
  anonymousAlias: string;
  phoneMasked: string;
  rawPhone?: string;
  timestamp: string;
  emergencyType: string;
  emergencyTitle: string;
  locationName: string;
  district: string;
  state: string;
  coordinates: [number, number];
  gpsAccuracyMeters: number;
  batteryPercent: number;
  altitudeMeters?: number;
  personsCount: number;
  medicalConditions?: string;
  specialNeeds?: string;
  triageStatus: CanonicalSOSTriageStatus;
  severity: 'critical' | 'warning' | 'moderate';
  assignedUnit?: SOSResponderUnit;
  routeCoordinates?: [number, number][];
  timeline: SOSTimelineRecord[];
  createdAt: string;
  updatedAt: string;
}

export class SOSBackendService {
  private static beacons: SOSBeaconRecord[] = [];

  /**
   * Generates simulated intermediate road waypoints between two coordinates
   */
  public static calculateRouteWaypoints(origin: [number, number], destination: [number, number]): [number, number][] {
    const [lat1, lng1] = origin;
    const [lat2, lng2] = destination;
    const waypoints: [number, number][] = [];
    const steps = 6;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const jitterLat = i > 0 && i < steps ? Math.sin(i * 2.8) * 0.0025 : 0;
      const jitterLng = i > 0 && i < steps ? Math.cos(i * 2.8) * 0.0025 : 0;
      waypoints.push([
        Number((lat1 + (lat2 - lat1) * t + jitterLat).toFixed(6)),
        Number((lng1 + (lng2 - lng1) * t + jitterLng).toFixed(6)),
      ]);
    }
    return waypoints;
  }

  /**
   * Get all SOS beacons with optional status filter and privacy masking
   */
  public static async getBeacons(filter?: { status?: string; isOperator?: boolean }): Promise<SOSBeaconRecord[]> {
    let result = [...this.beacons];

    if (filter?.status && filter.status !== 'all') {
      const target = filter.status.toUpperCase();
      result = result.filter((b) => b.triageStatus.toUpperCase() === target);
    }

    // Mask sensitive contact details if not verified emergency operator
    if (!filter?.isOperator) {
      result = result.map((b) => {
        const copy = { ...b };
        delete copy.rawPhone;
        return copy;
      });
    }

    return result;
  }

  /**
   * Get specific SOS beacon by ID
   */
  public static async getBeaconById(id: string, isOperator: boolean = false): Promise<SOSBeaconRecord | null> {
    const match = this.beacons.find((b) => b.id.toLowerCase() === id.toLowerCase());
    if (!match) return null;

    const copy = { ...match };
    if (!isOperator) {
      delete copy.rawPhone;
    }
    return copy;
  }

  /**
   * Get SOS beacons near geographic coordinates
   */
  public static async getNearbyBeacons(lat: number, lng: number, radiusKm: number = 50): Promise<SOSBeaconRecord[]> {
    return this.beacons.filter((b) => {
      const dist = this.calculateDistanceKm([lat, lng], b.coordinates);
      return dist <= radiusKm && b.triageStatus !== 'RESOLVED' && b.triageStatus !== 'CANCELLED';
    });
  }

  /**
   * Create new SOS distress signal (triggered from Aegis App or Web)
   */
  public static maskPhoneNumber(rawPhone?: string): string {
    if (!rawPhone) return '+91 98**** 0000';
    const clean = rawPhone.trim();
    const digitsOnly = clean.replace(/\D/g, '');
    const last4 = digitsOnly.slice(-4) || '0000';
    const prefix = clean.startsWith('+91') ? '+91 98' : clean.slice(0, 5);
    return `${prefix}**** ${last4}`;
  }

  /**
   * Create new SOS distress signal (triggered from Aegis App or Web)
   */
  public static async createSOS(payload: any, clientIp: string = '127.0.0.1'): Promise<SOSBeaconRecord> {
    const stateCode = payload.stateCode || payload.state?.substring(0, 2).toUpperCase() || 'IN';
    const id = `SOS-${stateCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const rawPhone = payload.phone || '+91 98000 00000';
    const phoneMasked = this.maskPhoneNumber(rawPhone);

    const lat = Number(payload.coordinates?.[0] || payload.latitude || 19.076);
    const lng = Number(payload.coordinates?.[1] || payload.longitude || 72.8777);

    const newBeacon: SOSBeaconRecord = {
      id,
      anonymousAlias: `Beacon #${id.replace('SOS-', '')} (App User)`,
      phoneMasked,
      rawPhone,
      timestamp: now,
      emergencyType: SanitizationMiddleware.stripHtmlTags(payload.emergencyType || 'general_distress'),
      emergencyTitle: SanitizationMiddleware.stripHtmlTags(
        payload.emergencyTitle || `Emergency Distress Signal (${payload.locationName || payload.district || 'Current GPS'})`
      ),
      locationName: SanitizationMiddleware.stripHtmlTags(payload.locationName || 'GPS Location Coordinates'),
      district: SanitizationMiddleware.stripHtmlTags(payload.district || 'Local District'),
      state: SanitizationMiddleware.stripHtmlTags(payload.state || 'India'),
      coordinates: [lat, lng],
      gpsAccuracyMeters: Number(payload.gpsAccuracyMeters || 5.0),
      batteryPercent: Number(payload.batteryPercent || 85),
      personsCount: Number(payload.personsCount || 1),
      medicalConditions: payload.medicalConditions ? SanitizationMiddleware.stripHtmlTags(payload.medicalConditions) : undefined,
      specialNeeds: payload.specialNeeds ? SanitizationMiddleware.stripHtmlTags(payload.specialNeeds) : undefined,
      triageStatus: 'PENDING',
      severity: 'critical',
      timeline: [
        {
          timestamp: new Date().toLocaleTimeString(),
          actor: 'Citizen Aegis Alert Mobile Client',
          action: 'Distress Beacon Initialized',
          notes: 'High priority push received via encrypted emergency protocol.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.beacons.unshift(newBeacon);

    AuditLogger.log({
      action: 'SOS_SIGNAL_CREATED',
      severity: 'SECURITY_ALERT',
      clientIp,
      resourceId: id,
      details: {
        district: newBeacon.district,
        emergencyType: newBeacon.emergencyType,
        persons: newBeacon.personsCount,
      },
    });

    // Broadcast realtime event
    RealtimeHub.broadcast({
      id: `evt-sos-create-${Date.now()}`,
      type: 'SOS_CREATED',
      timestamp: now,
      data: {
        eventType: 'SOS_CREATED',
        beacon: { ...newBeacon, rawPhone: undefined },
      },
    });

    return newBeacon;
  }

  /**
   * Dispatcher acknowledges SOS
   */
  public static async acknowledgeSOS(
    id: string,
    actorName: string = 'Command Center Dispatcher',
    notes?: string
  ): Promise<SOSBeaconRecord | null> {
    const beacon = this.beacons.find((b) => b.id.toLowerCase() === id.toLowerCase());
    if (!beacon) return null;

    beacon.triageStatus = 'ACCEPTED';
    beacon.updatedAt = new Date().toISOString();
    beacon.timeline.unshift({
      timestamp: new Date().toLocaleTimeString(),
      actor: actorName,
      action: 'Distress Signal Acknowledged by Operations Desk',
      notes: notes || 'Operator verifying closest emergency response staging base.',
    });

    RealtimeHub.broadcast({
      id: `evt-sos-ack-${Date.now()}`,
      type: 'SOS_ACCEPTED',
      timestamp: beacon.updatedAt,
      data: {
        eventType: 'SOS_ACCEPTED',
        beaconId: beacon.id,
        triageStatus: beacon.triageStatus,
        beacon: { ...beacon, rawPhone: undefined },
      },
    });

    return beacon;
  }

  /**
   * Assign and dispatch responder unit
   */
  public static async dispatchUnit(
    id: string,
    unitData?: any,
    actorName: string = 'Command Center Dispatcher'
  ): Promise<SOSBeaconRecord | null> {
    const beacon = this.beacons.find((b) => b.id.toLowerCase() === id.toLowerCase());
    if (!beacon) return null;

    const responderCoords: [number, number] = unitData?.responderCoordinates || [
      beacon.coordinates[0] + 0.022,
      beacon.coordinates[1] - 0.019,
    ];

    const distKm = this.calculateDistanceKm(responderCoords, beacon.coordinates);
    const etaMins = unitData?.etaMinutes !== undefined ? unitData.etaMinutes : Math.max(3, Math.round((distKm / 35) * 60));
    const route = this.calculateRouteWaypoints(responderCoords, beacon.coordinates);

    beacon.triageStatus = 'RESPONDER_EN_ROUTE';
    const assignedUnit: SOSResponderUnit = {
      unitId: unitData?.unitId || `UNIT-${Math.floor(100 + Math.random() * 900)}`,
      unitName: unitData?.unitName || 'NDRF Quick Response Team Alpha',
      callsign: unitData?.callsign || unitData?.unitName || 'NDRF-ALPHA-01',
      unitType: unitData?.unitType || 'NDRF Quick Response Team',
      commanderName: unitData?.commanderName || 'Officer In Charge',
      commanderContact: unitData?.commanderContact || unitData?.contactPhone || '+91 112',
      contactPhone: unitData?.commanderContact || unitData?.contactPhone || '+91 112',
      etaMinutes: etaMins,
      distanceKm: distKm,
      responderCoordinates: responderCoords,
      lastPing: new Date().toISOString(),
    };
    beacon.assignedUnit = assignedUnit;
    beacon.routeCoordinates = route;
    beacon.updatedAt = new Date().toISOString();

    const unitDisplayName = assignedUnit.callsign || assignedUnit.unitName;
    beacon.timeline.unshift({
      timestamp: new Date().toLocaleTimeString(),
      actor: actorName,
      action: `Unit Dispatched: ${unitDisplayName}`,
      notes: unitData?.notes || `Rescue unit deployed with estimated ETA of ${etaMins} mins (${distKm} km).`,
    });

    RealtimeHub.broadcast({
      id: `evt-sos-dispatch-${Date.now()}`,
      type: 'SOS_RESPONDER_MOVING',
      timestamp: beacon.updatedAt,
      data: {
        eventType: 'SOS_RESPONDER_MOVING',
        beaconId: beacon.id,
        triageStatus: beacon.triageStatus,
        assignedUnit: beacon.assignedUnit,
        routeCoordinates: route,
        beacon: { ...beacon, rawPhone: undefined },
      },
    });

    return beacon;
  }

  /**
   * Update live moving location of assigned responder unit
   */
  public static async updateResponderLocation(
    id: string,
    responderCoordinates: [number, number],
    etaMinutes?: number,
    distanceKm?: number
  ): Promise<SOSBeaconRecord | null> {
    const beacon = this.beacons.find((b) => b.id.toLowerCase() === id.toLowerCase());
    if (!beacon || !beacon.assignedUnit) return null;

    beacon.assignedUnit.responderCoordinates = responderCoordinates;
    beacon.assignedUnit.lastPing = new Date().toISOString();

    const dist = distanceKm !== undefined ? distanceKm : this.calculateDistanceKm(responderCoordinates, beacon.coordinates);
    const eta = etaMinutes !== undefined ? etaMinutes : Math.max(1, Math.round((dist / 35) * 60));

    beacon.assignedUnit.distanceKm = dist;
    beacon.assignedUnit.etaMinutes = eta;
    beacon.routeCoordinates = this.calculateRouteWaypoints(responderCoordinates, beacon.coordinates);
    beacon.updatedAt = new Date().toISOString();

    RealtimeHub.broadcast({
      id: `evt-sos-mov-${Date.now()}`,
      type: 'SOS_RESPONDER_MOVING',
      timestamp: beacon.updatedAt,
      data: {
        eventType: 'SOS_RESPONDER_MOVING',
        beaconId: beacon.id,
        responderCoordinates,
        etaMinutes: eta,
        distanceKm: dist,
        routeCoordinates: beacon.routeCoordinates,
      },
    });

    return beacon;
  }

  /**
   * Update live location of requester beacon
   */
  public static async updateRequesterLocation(
    id: string,
    coordinates: [number, number],
    accuracyMeters?: number,
    batteryPercent?: number
  ): Promise<SOSBeaconRecord | null> {
    const beacon = this.beacons.find((b) => b.id.toLowerCase() === id.toLowerCase());
    if (!beacon) return null;

    beacon.coordinates = coordinates;
    if (accuracyMeters !== undefined) beacon.gpsAccuracyMeters = accuracyMeters;
    if (batteryPercent !== undefined) beacon.batteryPercent = batteryPercent;
    beacon.updatedAt = new Date().toISOString();

    if (beacon.assignedUnit) {
      beacon.routeCoordinates = this.calculateRouteWaypoints(beacon.assignedUnit.responderCoordinates, coordinates);
    }

    RealtimeHub.broadcast({
      id: `evt-sos-loc-${Date.now()}`,
      type: 'SOS_LOCATION_UPDATED',
      timestamp: beacon.updatedAt,
      data: {
        eventType: 'SOS_LOCATION_UPDATED',
        beaconId: beacon.id,
        coordinates,
        gpsAccuracyMeters: beacon.gpsAccuracyMeters,
        batteryPercent: beacon.batteryPercent,
        routeCoordinates: beacon.routeCoordinates,
      },
    });

    return beacon;
  }

  /**
   * Mark responder arrived on scene
   */
  public static async markOnSite(id: string, actorName: string = 'Responder Unit'): Promise<SOSBeaconRecord | null> {
    const beacon = this.beacons.find((b) => b.id.toLowerCase() === id.toLowerCase());
    if (!beacon) return null;

    beacon.triageStatus = 'ON_SITE';
    beacon.updatedAt = new Date().toISOString();
    beacon.timeline.unshift({
      timestamp: new Date().toLocaleTimeString(),
      actor: actorName,
      action: 'Rescue Team Arrived On-Site',
      notes: 'Initial contact established with stranded individuals.',
    });

    RealtimeHub.broadcast({
      id: `evt-sos-onsite-${Date.now()}`,
      type: 'SOS_ON_SITE',
      timestamp: beacon.updatedAt,
      data: {
        eventType: 'SOS_ON_SITE',
        beaconId: beacon.id,
        triageStatus: beacon.triageStatus,
        beacon: { ...beacon, rawPhone: undefined },
      },
    });

    return beacon;
  }

  /**
   * Resolve distress incident
   */
  public static async resolveSOS(
    id: string,
    actorName: string = 'Command Center Dispatcher',
    notes?: string
  ): Promise<SOSBeaconRecord | null> {
    const beacon = this.beacons.find((b) => b.id.toLowerCase() === id.toLowerCase());
    if (!beacon) return null;

    beacon.triageStatus = 'RESOLVED';
    beacon.updatedAt = new Date().toISOString();
    beacon.timeline.unshift({
      timestamp: new Date().toLocaleTimeString(),
      actor: actorName,
      action: 'Distress Incident Successfully Resolved',
      notes: notes || 'All individuals safely evacuated to designated relief camp.',
    });

    RealtimeHub.broadcast({
      id: `evt-sos-res-${Date.now()}`,
      type: 'SOS_RESOLVED',
      timestamp: beacon.updatedAt,
      data: {
        eventType: 'SOS_RESOLVED',
        beaconId: beacon.id,
        triageStatus: beacon.triageStatus,
        beacon: { ...beacon, rawPhone: undefined },
      },
    });

    return beacon;
  }

  /**
   * Cancel distress beacon
   */
  public static async cancelSOS(
    id: string,
    actorName: string = 'User / Operator',
    reason?: string
  ): Promise<SOSBeaconRecord | null> {
    const beacon = this.beacons.find((b) => b.id.toLowerCase() === id.toLowerCase());
    if (!beacon) return null;

    beacon.triageStatus = 'CANCELLED';
    beacon.updatedAt = new Date().toISOString();
    beacon.timeline.unshift({
      timestamp: new Date().toLocaleTimeString(),
      actor: actorName,
      action: 'Distress Signal Cancelled',
      notes: reason || 'Beacon deactivated by user.',
    });

    RealtimeHub.broadcast({
      id: `evt-sos-can-${Date.now()}`,
      type: 'SOS_CANCELLED',
      timestamp: beacon.updatedAt,
      data: {
        eventType: 'SOS_CANCELLED',
        beaconId: beacon.id,
        triageStatus: beacon.triageStatus,
        beacon: { ...beacon, rawPhone: undefined },
      },
    });

    return beacon;
  }

  private static calculateDistanceKm(c1: [number, number], c2: [number, number]): number {
    const [lat1, lon1] = c1;
    const [lat2, lon2] = c2;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }
}
