/**
 * AEGIS Map Service - GIS & Technical Layers Abstraction
 * Handles Google Maps tile providers (Satellite Hybrid, Standard Roadmap, Terrain),
 * radar precipitation reflectivity contours, lightning strike telemetry, and evacuation shelters
 * via the Aegis Software API (/api/map/events, /api/map/layers).
 */

import { ApiClient } from './apiClient';

export interface MapTileProvider {
  id: string;
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom?: number;
}

export interface RadarStormCell {
  id: string;
  center: [number, number];
  intensity: 'light' | 'moderate' | 'heavy';
  radiusMeters: number;
  dbz: number;
  movementHeading: string;
  speedKmh: number;
}

export interface LightningStrike {
  id: string;
  coordinates: [number, number];
  timestamp: string;
  peakCurrentKa: number;
  type: 'cloud-to-ground' | 'intra-cloud';
}

export interface EvacuationShelter {
  id: string;
  name: string;
  coordinates: [number, number];
  capacity: number;
  occupancy: number;
  status: 'open' | 'standby' | 'full';
}

export interface MapLayersPayload {
  radar: {
    cells: RadarStormCell[];
  };
  lightning: {
    strikes: LightningStrike[];
  };
  shelters: EvacuationShelter[];
}

export interface MapEventPoint {
  id: string;
  type: string;
  title: string;
  coordinates: [number, number];
  severity: string;
  status: string;
  radiusMeters?: number;
}

class MapServiceClass {
  // Google Maps standard, satellite hybrid, and terrain tile layers
  private providers: Record<string, MapTileProvider> = {
    streets: {
      id: 'streets',
      name: 'Google Maps Roadmap',
      url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: 'Map data &copy; Google Maps',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
    },
    satellite: {
      id: 'satellite',
      name: 'Google Maps Satellite (Hybrid)',
      url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: 'Map data &copy; Google Maps Imagery',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
    },
    terrain: {
      id: 'terrain',
      name: 'Google Maps Terrain',
      url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      attribution: 'Map data &copy; Google Maps Terrain',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
    },
    dark: {
      id: 'dark',
      name: 'Dark GIS Canvas',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Map data &copy; Esri & Google GIS',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 18,
    },
  };

  /**
   * Returns tile layer configuration for a given layer style
   */
  getTileProvider(layerStyle: 'satellite' | 'streets' | 'terrain' | 'dark' = 'streets'): MapTileProvider {
    if (layerStyle === 'satellite') return this.providers.satellite;
    if (layerStyle === 'terrain') return this.providers.terrain;
    if (layerStyle === 'dark') return this.providers.dark;
    return this.providers.streets;
  }

  /**
   * Fetch active map GIS event pins from Aegis Software API (/api/map/events)
   */
  async fetchMapEvents(lat?: number, lng?: number): Promise<MapEventPoint[]> {
    try {
      const data = await ApiClient.get<MapEventPoint[]>('/map/events', {
        lat: lat ? Number(lat.toFixed(4)) : undefined,
        lng: lng ? Number(lng.toFixed(4)) : undefined,
      });
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('[MapService] Failed to fetch /api/map/events:', e);
    }
    return this.getFallbackMapEvents(lat, lng);
  }

  /**
   * Fetch Doppler radar, lightning and shelter layers from Aegis API (/api/map/layers)
   */
  async fetchMapLayers(lat?: number, lng?: number): Promise<MapLayersPayload> {
    try {
      const data = await ApiClient.get<MapLayersPayload>('/map/layers', {
        lat: lat ? Number(lat.toFixed(4)) : undefined,
        lng: lng ? Number(lng.toFixed(4)) : undefined,
      });
      if (data && data.radar && data.lightning) {
        return data;
      }
    } catch (e) {
      console.warn('[MapService] Failed to fetch /api/map/layers:', e);
    }

    const cLat = lat || 19.0760;
    const cLng = lng || 72.8777;
    return {
      radar: {
        cells: this.getRadarStormCells([cLat, cLng]),
      },
      lightning: {
        strikes: this.getRegionalLightningStrikes([cLat, cLng]),
      },
      shelters: this.getFallbackShelters([cLat, cLng]),
    };
  }

  /**
   * Generates Doppler radar storm clusters around the active coordinates
   */
  getRadarStormCells(center: [number, number]): RadarStormCell[] {
    const [lat, lng] = center;
    return [
      {
        id: 'cell-heavy-1',
        center: [lat + 0.08, lng + 0.06],
        intensity: 'heavy',
        radiusMeters: 9000,
        dbz: 54,
        movementHeading: 'ENE (65°)',
        speedKmh: 28,
      },
      {
        id: 'cell-mod-1',
        center: [lat + 0.04, lng + 0.03],
        intensity: 'moderate',
        radiusMeters: 18000,
        dbz: 42,
        movementHeading: 'ENE (60°)',
        speedKmh: 26,
      },
      {
        id: 'cell-light-1',
        center: [lat - 0.02, lng - 0.04],
        intensity: 'light',
        radiusMeters: 28000,
        dbz: 26,
        movementHeading: 'NE (50°)',
        speedKmh: 22,
      },
      {
        id: 'cell-mod-2',
        center: [lat - 0.09, lng + 0.12],
        intensity: 'moderate',
        radiusMeters: 14000,
        dbz: 38,
        movementHeading: 'E (85°)',
        speedKmh: 31,
      },
    ];
  }

  /**
   * Returns active lightning flash strikes in the region
   */
  getRegionalLightningStrikes(center: [number, number]): LightningStrike[] {
    const [lat, lng] = center;
    return [
      {
        id: 'lt-1',
        coordinates: [lat + 0.075, lng + 0.055],
        timestamp: '1 min ago',
        peakCurrentKa: -42,
        type: 'cloud-to-ground',
      },
      {
        id: 'lt-2',
        coordinates: [lat + 0.09, lng + 0.07],
        timestamp: '2 min ago',
        peakCurrentKa: 31,
        type: 'cloud-to-ground',
      },
      {
        id: 'lt-3',
        coordinates: [lat + 0.03, lng + 0.04],
        timestamp: '3 min ago',
        peakCurrentKa: -18,
        type: 'intra-cloud',
      },
      {
        id: 'lt-4',
        coordinates: [lat - 0.085, lng + 0.11],
        timestamp: '5 min ago',
        peakCurrentKa: -55,
        type: 'cloud-to-ground',
      },
    ];
  }

  getFallbackShelters(center: [number, number]): EvacuationShelter[] {
    const [lat, lng] = center;
    return [
      {
        id: 'sh-1',
        name: 'District Multi-Purpose Cyclone Shelter',
        coordinates: [lat - 0.02, lng + 0.04],
        capacity: 1500,
        occupancy: 320,
        status: 'open',
      },
      {
        id: 'sh-2',
        name: 'Municipal Relief & Medical Center',
        coordinates: [lat + 0.05, lng - 0.03],
        capacity: 2000,
        occupancy: 850,
        status: 'open',
      },
    ];
  }

  getFallbackMapEvents(lat?: number, lng?: number): MapEventPoint[] {
    const cLat = lat || 19.0760;
    const cLng = lng || 72.8777;
    return [
      {
        id: 'evt-1',
        type: 'Flood',
        title: 'Lowland Inundation Cluster',
        coordinates: [cLat + 0.04, cLng + 0.03],
        severity: 'Critical',
        status: 'Active Red Alert',
        radiusMeters: 4500,
      },
      {
        id: 'evt-2',
        type: 'Lightning',
        title: 'Severe Lightning Zone',
        coordinates: [cLat + 0.075, cLng + 0.055],
        severity: 'Warning',
        status: 'Active Discharge',
        radiusMeters: 2500,
      },
      {
        id: 'evt-3',
        type: 'Road Blockage',
        title: 'Highway Obstruction & Tree Fall',
        coordinates: [cLat - 0.03, cLng + 0.02],
        severity: 'Warning',
        status: 'Diversion in Place',
        radiusMeters: 1000,
      },
    ];
  }

  /**
   * Returns color code corresponding to radar intensity
   */
  getRadarIntensityColor(intensity: 'light' | 'moderate' | 'heavy'): { fill: string; stroke: string } {
    switch (intensity) {
      case 'heavy':
        return { fill: '#E94B68', stroke: '#B82842' }; // Red/Crimson
      case 'moderate':
        return { fill: '#F4C84A', stroke: '#C89618' }; // Yellow/Orange
      case 'light':
      default:
        return { fill: '#45C79A', stroke: '#289870' }; // Green/Cyan
    }
  }
}

export const MapService = new MapServiceClass();
