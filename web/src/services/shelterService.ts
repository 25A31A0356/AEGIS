/**
 * AEGIS ALERT - Central Frontend Shelter & Relief Zone Service
 * Connects Aegis Web to /api/v1/shelters and /api/v1/map-data?layers=shelters.
 * Manages live shelter capacities, amenities, and spatial proximity lookups.
 */

import { ApiClient } from './apiClient';
import { RealtimeService, RealtimeEvent } from './realtimeService';

export interface SafeShelter {
  id: string;
  name: string;
  type: 'RELIEF_SHELTER' | 'HOSPITAL' | 'SAFE_HAVEN' | 'EVACUATION_CENTER' | 'CYCLONE_SHELTER';
  coordinates: [number, number];
  address: string;
  district: string;
  state: string;
  capacity: number;
  currentOccupancy: number;
  availableBeds?: number;
  contactPhone: string;
  amenities: string[];
  isActive: boolean;
}

const STORAGE_KEY = 'aegis_shelters_cache_v1';

export class ShelterService {
  private static shelters: SafeShelter[] = [];
  private static listeners: Array<(shelters: SafeShelter[]) => void> = [];
  private static isInitialized = false;

  static {
    this.shelters = this.loadFromStorage();
    this.setupRealtimeListeners();
  }

  private static loadFromStorage(): SafeShelter[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }

  private static saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.shelters));
    } catch {
      // ignore
    }
  }

  private static setupRealtimeListeners(): void {
    RealtimeService.subscribe((evt: RealtimeEvent) => {
      const type = evt.event_type || evt.type || '';
      if (type === 'SHELTER_UPDATED' || type === 'SHELTER_CAPACITY_CHANGED') {
        const payload = evt.payload || evt.data || {};
        if (payload.id) {
          const idx = this.shelters.findIndex((s) => s.id === payload.id);
          if (idx >= 0) {
            this.shelters[idx] = { ...this.shelters[idx], ...payload };
            this.saveToStorage();
            this.notifyListeners();
          }
        }
      }
    });
  }

  public static async fetchShelters(forceFresh: boolean = false): Promise<SafeShelter[]> {
    try {
      const res = await ApiClient.get<any>('/shelters', undefined, { skipCache: forceFresh, timeoutMs: 5000 });
      const rawList = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        const liveShelters: SafeShelter[] = rawList.map((s: any) => ({
          id: s.id || `shelter-${Math.random().toString(36).substring(2, 7)}`,
          name: s.name || 'Emergency Disaster Relief Shelter',
          type: (s.zone_type || s.type || 'RELIEF_SHELTER') as any,
          coordinates: [s.latitude || 20.5937, s.longitude || 78.9629],
          address: s.address || 'Designated High-Elevation Safe Hub',
          district: s.district || 'Local District',
          state: s.state || 'India',
          capacity: s.capacity || 1000,
          currentOccupancy: s.current_occupancy ?? s.currentOccupancy ?? 0,
          availableBeds: Math.max(0, (s.capacity || 1000) - (s.current_occupancy ?? s.currentOccupancy ?? 0)),
          contactPhone: s.contact_phone || '1078 (NDMA Emergency Helpline)',
          amenities: Array.isArray(s.amenities) ? s.amenities : ['FOOD', 'WATER', 'FIRST_AID', 'POWER_BACKUP'],
          isActive: s.is_active ?? true,
        }));

        this.shelters = liveShelters;
        this.isInitialized = true;
        this.saveToStorage();
        this.notifyListeners();
        return [...this.shelters];
      }
    } catch (e) {
      console.warn('[ShelterService] Failed to fetch live shelters from API, using cached data:', e);
    }

    this.isInitialized = true;
    return [...this.shelters];
  }

  public static getShelters(): SafeShelter[] {
    if (!this.isInitialized && this.shelters.length === 0) {
      this.fetchShelters();
    }
    return [...this.shelters];
  }

  public static subscribe(listener: (shelters: SafeShelter[]) => void): () => void {
    this.listeners.push(listener);
    if (this.shelters.length > 0) {
      listener([...this.shelters]);
    } else {
      this.fetchShelters().then(listener);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    const clone = [...this.shelters];
    this.listeners.forEach((l) => {
      try {
        l(clone);
      } catch (err) {
        console.error('[ShelterService] Listener error:', err);
      }
    });
  }
}
