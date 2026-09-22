/**
 * AEGIS Map Service - GIS & Technical Layers Abstraction
 * Handles Google Maps & OSM tile providers (Satellite Hybrid, Standard Roadmap, Terrain),
 * radar precipitation reflectivity contours, lightning strike telemetry, and evacuation shelters
 * via the Aegis Software API (/api/map/events, /api/map/layers).
 * Strict Zero Fake Production Data Policy: Empty arrays returned when telemetry is inactive.
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
  // Tile layer providers
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
    osm: {
      id: 'osm',
      name: 'OpenStreetMap Standard',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    },
  };

  getTileProvider(layerType: string = 'streets'): MapTileProvider {
    return this.providers[layerType] || this.providers.streets;
  }

  getAvailableTileProviders(): MapTileProvider[] {
    return Object.values(this.providers);
  }

  /**
   * Fetch active emergency points from Aegis API (/api/map/events)
   */
  async fetchMapEvents(lat?: number, lng?: number): Promise<MapEventPoint[]> {
    try {
      const data = await ApiClient.get<MapEventPoint[]>('/map/events', {
        lat: lat ? Number(lat.toFixed(4)) : undefined,
        lng: lng ? Number(lng.toFixed(4)) : undefined,
      });
      if (Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('[MapService] /api/map/events unavailable:', e);
    }
    return [];
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
      console.warn('[MapService] /api/map/layers unavailable:', e);
    }

    return {
      radar: {
        cells: [],
      },
      lightning: {
        strikes: [],
      },
      shelters: [],
    };
  }

  getRadarStormCells(_center?: [number, number]): RadarStormCell[] {
    return [];
  }

  getRegionalLightningStrikes(_center?: [number, number]): LightningStrike[] {
    return [];
  }

  getRadarIntensityColor(intensity: 'light' | 'moderate' | 'heavy' | string): { fill: string; stroke: string } {
    switch (intensity) {
      case 'heavy':
        return { fill: '#DC2626', stroke: '#991B1B' };
      case 'moderate':
        return { fill: '#F59E0B', stroke: '#D97706' };
      case 'light':
      default:
        return { fill: '#3B82F6', stroke: '#2563EB' };
    }
  }

  getDbzColor(dbz: number): string {
    if (dbz >= 50) return '#DC2626';
    if (dbz >= 40) return '#F97316';
    if (dbz >= 30) return '#FBBF24';
    if (dbz >= 20) return '#34D399';
    return '#60A5FA';
  }
}

export const MapService = new MapServiceClass();
