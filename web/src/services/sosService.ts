import { STATE_VICTIM_BEACONS } from '../data/stateVictimBeacons';
/**
 * AEGIS ALERT - Central Frontend SOS Service
 * Connects Aegis Web to the Aegis Software SOS API and Realtime Event Stream.
 * Handles beacon lifecycle transitions, responder location tracking, and reactive updates.
 * Implements 1-minute auto-refresh cycle and stale message pruning.
 */

import { ApiClient } from './apiClient';
import { RealtimeService, RealtimeEvent } from './realtimeService';
import { SOSBeacon, SOSTriageStatus } from '../types/sos';

const STORAGE_KEY = 'aegis_user_sos_beacons_v5';

export function normalizeBeaconState(stateName?: string, district?: string, coords?: [number, number]): string {
  if (stateName && stateName.trim() && stateName.toLowerCase() !== 'india' && stateName.toLowerCase() !== 'all') {
    const s = stateName.trim();
    if (s.toLowerCase().includes('andhra')) return 'Andhra Pradesh';
    if (s.toLowerCase().includes('odisha') || s.toLowerCase().includes('orissa')) return 'Odisha';
    if (s.toLowerCase().includes('maharashtra')) return 'Maharashtra';
    if (s.toLowerCase().includes('kerala')) return 'Kerala';
    if (s.toLowerCase().includes('tamil')) return 'Tamil Nadu';
    if (s.toLowerCase().includes('delhi')) return 'Delhi NCR';
    if (s.toLowerCase().includes('west bengal') || s.toLowerCase().includes('bengal')) return 'West Bengal';
    if (s.toLowerCase().includes('assam')) return 'Assam';
    if (s.toLowerCase().includes('gujarat')) return 'Gujarat';
    if (s.toLowerCase().includes('karnataka')) return 'Karnataka';
    return s;
  }
  const dist = (district || '').toLowerCase();
  const [lat, lng] = coords || [17.6868, 83.2185];

  if (dist.includes('visakhapatnam') || dist.includes('vijayawada') || dist.includes('krishna') || dist.includes('guntur') || (lat >= 14 && lat <= 19.5 && lng >= 80 && lng <= 84.5)) {
    return 'Andhra Pradesh';
  }
  if (dist.includes('mumbai') || dist.includes('pune') || dist.includes('nagpur') || (lat >= 18 && lat <= 20.5 && lng >= 72 && lng <= 75.5)) {
    return 'Maharashtra';
  }
  if (dist.includes('puri') || dist.includes('bhubaneswar') || dist.includes('cuttack') || (lat >= 19.5 && lat <= 22.5 && lng >= 84.5 && lng <= 87.5)) {
    return 'Odisha';
  }
  if (dist.includes('chennai') || dist.includes('coimbatore') || dist.includes('madurai') || (lat >= 8.5 && lat <= 13.5 && lng >= 78.5 && lng <= 80.5)) {
    return 'Tamil Nadu';
  }
  if (dist.includes('delhi') || dist.includes('ncr') || (lat >= 28.3 && lat <= 28.9 && lng >= 76.8 && lng <= 77.5)) {
    return 'Delhi NCR';
  }
  if (dist.includes('wayanad') || dist.includes('kochi') || dist.includes('trivandrum') || (lat >= 8.2 && lat <= 12.8 && lng >= 75.2 && lng <= 77.4)) {
    return 'Kerala';
  }
  if (dist.includes('morbi') || dist.includes('ahmedabad') || dist.includes('surat') || (lat >= 20.8 && lat <= 24.5 && lng >= 69 && lng <= 73.5)) {
    return 'Gujarat';
  }
  if (dist.includes('nagaon') || dist.includes('guwahati') || dist.includes('kaliabor') || (lat >= 25 && lat <= 28 && lng >= 90 && lng <= 95.5)) {
    return 'Assam';
  }
  if (dist.includes('gosaba') || dist.includes('kolkata') || dist.includes('sundarbans') || (lat >= 21.5 && lat <= 24.5 && lng >= 87.5 && lng <= 89.5)) {
    return 'West Bengal';
  }
  if (dist.includes('madikeri') || dist.includes('kodagu') || dist.includes('bengaluru') || (lat >= 12 && lat <= 16 && lng >= 74 && lng <= 78)) {
    return 'Karnataka';
  }
  return 'Andhra Pradesh';
}

export class SOSService {
  private static beacons: SOSBeacon[] = [];
  private static listeners: Array<(beacons: SOSBeacon[]) => void> = [];
  private static isInitialized = false;
  private static autoRefreshIntervalId: any = null;

  static {
    this.beacons = this.loadFromStorage();
    this.setupRealtimeListeners();
    this.startAutoRefreshCycle();
  }

  private static loadFromStorage(): SOSBeacon[] {
    if (typeof localStorage === 'undefined') return [...STATE_VICTIM_BEACONS];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validIds = new Set(STATE_VICTIM_BEACONS.map(b => b.id));
          const list: SOSBeacon[] = [];
          
          // Seed standard state victim beacons
          for (const sv of STATE_VICTIM_BEACONS) {
            const match = parsed.find((p: any) => p && p.id === sv.id);
            if (match) {
              list.push({ ...sv, ...match, state: sv.state });
            } else {
              list.push(sv);
            }
          }

          // Append any newly created user beacons
          for (const p of parsed) {
            if (p && p.id && !validIds.has(p.id)) {
              list.push({
                ...p,
                state: normalizeBeaconState(p.state, p.district, p.coordinates),
              });
            }
          }
          return list;
        }
      }
    } catch {
      // ignore
    }
    return [...STATE_VICTIM_BEACONS];
  }

  private static saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.beacons.slice(0, 50)));
    } catch {
      // ignore
    }
  }

  /**
   * 1-Minute Auto-Refresh Timer
   */
  public static startAutoRefreshCycle(): void {
    if (this.autoRefreshIntervalId) {
      clearInterval(this.autoRefreshIntervalId);
    }

    // Refresh every 60 seconds (1 minute)
    this.autoRefreshIntervalId = setInterval(() => {
      this.pruneStaleBeacons();
      this.fetchBeaconsFromApi(true).catch(() => {});
    }, 60000);
  }

  /**
   * Prune stale, expired, or long-resolved SOS messages
   */
  public static pruneStaleBeacons(): void {
    // Retain default victim beacons and only prune temporary user beacons that were resolved > 15m ago
    const stateBeaconIds = new Set(STATE_VICTIM_BEACONS.map(b => b.id));
    const filtered = this.beacons.filter((b) => {
      if (stateBeaconIds.has(b.id)) return true;
      if (b.triageStatus === 'RESOLVED' || b.triageStatus === 'CANCELLED') {
        const timestamp = new Date(b.timestamp).getTime();
        if (!isNaN(timestamp) && timestamp < (Date.now() - 15 * 60 * 1000)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length !== this.beacons.length) {
      this.beacons = filtered;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  private static setupRealtimeListeners(): void {
    RealtimeService.onStatusChange((status) => {
      if (status === 'LIVE') {
        this.fetchBeaconsFromApi(true).catch(() => {});
      }
    });

    const handleSOSEvent = (evt: RealtimeEvent) => {
      const eventData = evt.data || {};
      const eventType = eventData.eventType || evt.type;
      const beaconId = eventData.beaconId || eventData.beacon?.id || eventData.id;

      if ((eventType === 'SOS_CREATED' || eventType === 'SOS_DISPATCHED') && eventData.beacon) {
        const b = eventData.beacon;
        this.upsertBeacon({
          ...b,
          state: normalizeBeaconState(b.state, b.district, b.coordinates),
          isLiveBackend: true,
        });
      } else if (eventType === 'SOS_OFFERED' && beaconId) {
        this.updateLocalBeacon(beaconId, {
          triageStatus: eventData.triageStatus || 'MATCHING',
          ...(eventData.beacon || {}),
        });
      } else if ((eventType === 'SOS_ACCEPTED' || eventType === 'SOS_ACKNOWLEDGED') && beaconId) {
        this.updateLocalBeacon(beaconId, {
          triageStatus: eventData.triageStatus || 'ACCEPTED',
          assignedUnit: eventData.assignedUnit,
          routeCoordinates: eventData.routeCoordinates,
          ...(eventData.beacon || {}),
        });
      } else if ((eventType === 'SOS_RESPONDER_MOVING' || eventType === 'SOS_RESPONDER_ASSIGNED') && beaconId) {
        const target = this.beacons.find((b) => b.id === beaconId);
        if (target) {
          const updatedUnit = target.assignedUnit
            ? {
                ...target.assignedUnit,
                responderCoordinates: eventData.responderCoordinates || target.assignedUnit.responderCoordinates,
                etaMinutes: eventData.etaMinutes !== undefined ? eventData.etaMinutes : target.assignedUnit.etaMinutes,
                distanceKm: eventData.distanceKm !== undefined ? eventData.distanceKm : target.assignedUnit.distanceKm,
                lastPing: new Date().toISOString(),
              }
            : eventData.assignedUnit;

          this.updateLocalBeacon(beaconId, {
            triageStatus: eventData.triageStatus || target.triageStatus || 'RESPONDER_EN_ROUTE',
            assignedUnit: updatedUnit,
            routeCoordinates: eventData.routeCoordinates || target.routeCoordinates,
            ...(eventData.beacon || {}),
          });
        }
      } else if ((eventType === 'SOS_LOCATION_UPDATED' || eventType === 'SOS_UPDATED') && beaconId) {
        this.updateLocalBeacon(beaconId, {
          coordinates: eventData.coordinates,
          gpsAccuracyMeters: eventData.gpsAccuracyMeters,
          batteryPercent: eventData.batteryPercent,
          routeCoordinates: eventData.routeCoordinates,
        });
      } else if (eventType === 'SOS_ON_SITE' && beaconId) {
        this.updateLocalBeacon(beaconId, {
          triageStatus: 'ON_SITE',
          ...(eventData.beacon || {}),
        });
      } else if (eventType === 'SOS_RESOLVED' && beaconId) {
        this.updateLocalBeacon(beaconId, {
          triageStatus: 'RESOLVED',
          ...(eventData.beacon || {}),
        });
      } else if (eventType === 'SOS_CANCELLED' && beaconId) {
        this.updateLocalBeacon(beaconId, {
          triageStatus: 'CANCELLED',
          ...(eventData.beacon || {}),
        });
      }
    };

    RealtimeService.subscribe((evt) => {
      if (evt.type.startsWith('SOS_') || evt.data?.eventType?.startsWith('SOS_')) {
        handleSOSEvent(evt);
      }
    });
  }

  private static upsertBeacon(beacon: SOSBeacon): void {
    const normalized = {
      ...beacon,
      state: normalizeBeaconState(beacon.state, beacon.district, beacon.coordinates),
    };
    const existingIndex = this.beacons.findIndex((b) => b.id === normalized.id);
    if (existingIndex >= 0) {
      this.beacons[existingIndex] = { ...this.beacons[existingIndex], ...normalized };
    } else {
      this.beacons.unshift(normalized);
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  private static updateLocalBeacon(id: string, updates: Partial<SOSBeacon>): void {
    const target = this.beacons.find((b) => b.id === id);
    if (target) {
      Object.assign(target, updates);
      if (updates.state || updates.district || updates.coordinates) {
        target.state = normalizeBeaconState(target.state, target.district, target.coordinates);
      }
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Fetch active SOS beacons from the central Aegis API with fallback to cache/demo
   */
  public static async fetchBeaconsFromApi(forceFresh: boolean = false): Promise<SOSBeacon[]> {
    try {
      const res = await ApiClient.get<any>('/sos', undefined, { skipCache: forceFresh, timeoutMs: 4500 });
      const rawList = Array.isArray(res) ? res : (res?.beacons || res?.data || []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        const liveBeacons: SOSBeacon[] = rawList.map((b: any) => {
          const coords: [number, number] = (b.latitude && b.longitude) ? [b.latitude, b.longitude] : (b.coordinates || [17.6868, 83.2185]);
          const stateVal = normalizeBeaconState(b.state, b.district, coords);
          return {
            id: b.id || `SOS-${Math.random().toString(36).substring(2, 7)}`,
            anonymousAlias: b.caller_name || b.anonymousAlias || `Citizen #${b.id?.substring(0, 6)}`,
            phoneMasked: b.caller_phone_masked || b.phoneMasked || 'CONFIDENTIAL',
            timestamp: b.created_at || b.timestamp || new Date().toISOString(),
            emergencyType: (b.emergency_type || b.emergencyType || 'general') as any,
            emergencyTitle: b.short_message || b.emergencyTitle || 'Emergency Distress Signal',
            locationName: b.address || b.locationName || 'Live GPS Coordinates',
            district: b.district || 'Visakhapatnam',
            state: stateVal,
            coordinates: coords,
            gpsAccuracyMeters: b.accuracy_meters || b.gpsAccuracyMeters || 10.0,
            batteryPercent: b.battery_percent ?? b.batteryPercent ?? 100,
            personsCount: b.casualties_count || b.personsCount || 1,
            triageStatus: (b.status || b.triageStatus || 'PENDING') as SOSTriageStatus,
            severity: (b.severity?.toLowerCase() || 'critical') as any,
            timeline: b.timeline || [
              {
                timestamp: b.created_at ? new Date(b.created_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
                actor: 'Central Emergency Dispatch Core',
                action: `Distress Signal Registered (${b.status || 'PENDING'})`,
                notes: b.short_message || 'Beacon active in central PostGIS spatial index.',
              }
            ],
            isLiveBackend: true,
          };
        });

        // Merge live beacons with state victim beacons
        const merged: SOSBeacon[] = [...STATE_VICTIM_BEACONS];
        for (const lb of liveBeacons) {
          if (!merged.some(m => m.id === lb.id)) {
            merged.unshift(lb);
          }
        }

        this.beacons = merged;
        this.isInitialized = true;
        this.saveToStorage();
        this.notifyListeners();
        return [...this.beacons];
      }
    } catch (e) {
      console.warn('[SOSService] Failed to fetch live SOS from backend API, using cached data:', e);
    }

    if (this.beacons.length === 0) {
      this.beacons = [...STATE_VICTIM_BEACONS];
    }
    this.isInitialized = true;
    return [...this.beacons];
  }

  public static getBeacons(): SOSBeacon[] {
    if (!this.isInitialized && this.beacons.length === 0) {
      this.fetchBeaconsFromApi();
    }
    return [...this.beacons];
  }

  public static getBeaconById(id: string): SOSBeacon | undefined {
    return this.beacons.find((b) => b.id.toLowerCase() === id.toLowerCase());
  }

  /**
   * Update SOS Triage State across backend API and local store
   */
  public static async updateTriageStatus(
    id: string,
    newStatus: SOSTriageStatus,
    actorName: string = 'Command Center Operator',
    notes?: string
  ): Promise<SOSBeacon | undefined> {
    const beacon = this.beacons.find((b) => b.id === id);
    if (!beacon) return undefined;

    let endpoint = `/sos/${id}/acknowledge`;
    if (newStatus === 'dispatching' || newStatus === 'ACCEPTED' || newStatus === 'RESPONDER_EN_ROUTE') {
      endpoint = `/sos/${id}/dispatch`;
    } else if (newStatus === 'on_scene' || newStatus === 'ON_SITE') {
      endpoint = `/sos/${id}/arrive`;
    } else if (newStatus === 'resolved' || newStatus === 'RESOLVED') {
      endpoint = `/sos/${id}/resolve`;
    } else if (newStatus === 'cancelled' || newStatus === 'CANCELLED') {
      endpoint = `/sos/${id}/cancel`;
    }

    try {
      const res = await ApiClient.post<SOSBeacon>(endpoint, { actor: actorName, notes });
      if (res) {
        this.upsertBeacon({ ...res, isLiveBackend: true });
        return res;
      }
    } catch (e) {
      console.warn(`[SOSService] API update failed for ${endpoint}, applying local optimistic transition:`, e);
    }

    // Local optimistic fallback
    beacon.triageStatus = newStatus;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const actionText =
      newStatus === 'acknowledged' || newStatus === 'MATCHING'
        ? 'Distress Beacon Acknowledged by Operations Desk'
        : newStatus === 'dispatching' || newStatus === 'RESPONDER_EN_ROUTE'
        ? 'Emergency Response Unit Dispatched En Route'
        : newStatus === 'on_scene' || newStatus === 'ON_SITE'
        ? 'Rescue Unit Arrived On Scene'
        : newStatus === 'resolved' || newStatus === 'RESOLVED'
        ? 'Incident Resolved & Extracted to Safety'
        : newStatus === 'cancelled' || newStatus === 'CANCELLED'
        ? 'Distress Signal Cancelled'
        : 'Status Updated';

    beacon.timeline.unshift({
      timestamp: timeStr,
      actor: actorName,
      action: actionText,
      notes: notes || `Triage transitioned to ${newStatus.toUpperCase()}`,
    });

    this.saveToStorage();
    this.notifyListeners();
    return { ...beacon };
  }

  /**
   * Trigger new SOS distress beacon via backend API
   */
  public static async createSOSBeacon(beaconData: Partial<SOSBeacon>): Promise<SOSBeacon> {
    const coords = beaconData.coordinates || [17.6868, 83.2185];
    const resolvedState = normalizeBeaconState(beaconData.state, beaconData.district, coords);

    try {
      const idempotencyKey = `web-sos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const res = await ApiClient.post<any>('/sos', {
        caller_name: beaconData.anonymousAlias || 'Citizen in Distress',
        caller_phone: '+919999999999',
        emergency_type: beaconData.emergencyType || 'general',
        severity: (beaconData.severity || 'CRITICAL').toUpperCase(),
        short_message: beaconData.emergencyTitle || 'Web Portal Emergency Distress Signal',
        latitude: coords[0],
        longitude: coords[1],
        accuracy_meters: beaconData.gpsAccuracyMeters || 10.0,
        address: beaconData.locationName || '',
        district: beaconData.district || 'Visakhapatnam',
        state: resolvedState,
        battery_percent: beaconData.batteryPercent ?? 100,
        casualties_count: beaconData.personsCount || 1,
        idempotency_key: idempotencyKey,
      });

      if (res) {
        const createdBeacon: SOSBeacon = {
          id: res.id,
          anonymousAlias: res.caller_name || beaconData.anonymousAlias || 'Citizen in Distress',
          phoneMasked: 'CONFIDENTIAL',
          timestamp: res.created_at || new Date().toISOString(),
          emergencyType: (res.emergency_type || beaconData.emergencyType || 'general') as any,
          emergencyTitle: res.short_message || beaconData.emergencyTitle || 'Distress Beacon Initialized',
          locationName: res.address || beaconData.locationName || 'Live GPS Coordinates',
          district: res.district || beaconData.district || 'Visakhapatnam',
          state: resolvedState,
          coordinates: (res.latitude && res.longitude) ? [res.latitude, res.longitude] : coords,
          gpsAccuracyMeters: res.accuracy_meters || 10.0,
          batteryPercent: res.battery_percent ?? 100,
          personsCount: res.casualties_count || 1,
          triageStatus: (res.status || 'PENDING') as SOSTriageStatus,
          severity: 'critical',
          timeline: [
            {
              timestamp: new Date().toLocaleTimeString(),
              actor: 'Central Emergency Dispatch Core',
              action: 'Distress Beacon Initialized',
              notes: 'Distress registered in central PostGIS database.',
            }
          ],
          isLiveBackend: true,
        };

        this.upsertBeacon(createdBeacon);
        return createdBeacon;
      }
    } catch (e) {
      console.warn('[SOSService] Backend createSOS failed, creating local beacon:', e);
    }

    // Fallback local beacon creation
    const id = `SOS-IN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBeacon: SOSBeacon = {
      id,
      anonymousAlias: `Beacon #${id.replace('SOS-', '')} (Active User)`,
      phoneMasked: '+91 98**** 1122',
      timestamp: new Date().toISOString(),
      emergencyType: beaconData.emergencyType || 'flash_flood_stranding',
      emergencyTitle: beaconData.emergencyTitle || 'Emergency Distress Beacon Received',
      locationName: beaconData.locationName || 'Current User GPS Coordinates',
      district: beaconData.district || 'Visakhapatnam',
      state: resolvedState,
      coordinates: coords,
      gpsAccuracyMeters: 5.0,
      batteryPercent: 82,
      personsCount: beaconData.personsCount || 1,
      triageStatus: 'PENDING',
      severity: 'critical',
      timeline: [
        {
          timestamp: new Date().toLocaleTimeString(),
          actor: 'AEGIS Web Incident Sentinel',
          action: 'Distress Beacon Initialized',
          notes: 'High priority push received via secure emergency protocol.',
        },
      ],
      isLiveBackend: false,
      ...beaconData,
    };

    this.upsertBeacon(newBeacon);
    return newBeacon;
  }

  public static clearAllBeacons(): void {
    this.beacons = [...STATE_VICTIM_BEACONS];
    this.saveToStorage();
    this.notifyListeners();
  }

  public static subscribe(listener: (beacons: SOSBeacon[]) => void): () => void {
    this.listeners.push(listener);
    if (this.beacons.length > 0) {
      listener([...this.beacons]);
    } else {
      this.fetchBeaconsFromApi().then(listener);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    const clone = [...this.beacons];
    this.listeners.forEach((l) => {
      try {
        l(clone);
      } catch (err) {
        console.error('[SOSService] Subscriber notify error:', err);
      }
    });
  }
}
