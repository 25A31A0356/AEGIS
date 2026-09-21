/**
 * AGIES ALERT - Backend MapService
 * Provides GIS layers, Doppler radar storm cells, lightning strikes, and active evacuation shelters.
 */

export interface MapEventPoint {
  id: string;
  type: string;
  title: string;
  coordinates: [number, number];
  severity: string;
  status: string;
  radiusMeters?: number;
}

export interface MapLayersPayload {
  radar: {
    cells: Array<{
      id: string;
      center: [number, number];
      intensity: 'light' | 'moderate' | 'heavy';
      radiusMeters: number;
      dbz: number;
      movementHeading: string;
      speedKmh: number;
    }>;
  };
  lightning: {
    strikes: Array<{
      id: string;
      coordinates: [number, number];
      timestamp: string;
      peakCurrentKa: number;
    }>;
  };
  shelters: Array<{
    id: string;
    name: string;
    coordinates: [number, number];
    capacity: number;
    occupancy: number;
    status: 'open' | 'standby' | 'full';
  }>;
}

export class MapService {
  public static async getMapEvents(lat?: number, lng?: number): Promise<MapEventPoint[]> {
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

  public static async getMapLayers(lat?: number, lng?: number): Promise<MapLayersPayload> {
    const cLat = lat || 19.0760;
    const cLng = lng || 72.8777;

    return {
      radar: {
        cells: [
          { id: 'rad-1', center: [cLat + 0.08, cLng + 0.06], intensity: 'heavy', radiusMeters: 9000, dbz: 54, movementHeading: 'ENE (65°)', speedKmh: 28 },
          { id: 'rad-2', center: [cLat + 0.04, cLng + 0.03], intensity: 'moderate', radiusMeters: 18000, dbz: 42, movementHeading: 'ENE (60°)', speedKmh: 26 },
          { id: 'rad-3', center: [cLat - 0.02, cLng - 0.04], intensity: 'light', radiusMeters: 28000, dbz: 26, movementHeading: 'NE (50°)', speedKmh: 22 },
        ],
      },
      lightning: {
        strikes: [
          { id: 'lt-1', coordinates: [cLat + 0.075, cLng + 0.055], timestamp: '1 min ago', peakCurrentKa: -42 },
          { id: 'lt-2', coordinates: [cLat + 0.09, cLng + 0.07], timestamp: '2 min ago', peakCurrentKa: 31 },
          { id: 'lt-3', coordinates: [cLat + 0.03, cLng + 0.04], timestamp: '3 min ago', peakCurrentKa: -18 },
        ],
      },
      shelters: [
        { id: 'sh-1', name: 'District Multi-Purpose Cyclone Shelter', coordinates: [cLat - 0.02, cLng + 0.04], capacity: 1500, occupancy: 320, status: 'open' },
        { id: 'sh-2', name: 'Municipal Relief & Medical Center', coordinates: [cLat + 0.05, cLng - 0.03], capacity: 2000, occupancy: 850, status: 'open' },
      ],
    };
  }
}
