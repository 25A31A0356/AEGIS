/**
 * AGIES ALERT - Backend LocationService
 * Handles geocoding registry, reverse geocoding, and user saved location persistence.
 */

export interface SavedLocationEntity {
  id: string;
  name: string;
  category: 'home' | 'work' | 'family' | 'other';
  coordinates: [number, number];
  stateName: string;
  district: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  weatherSnippet?: string;
}

export class LocationService {
  private static savedLocations: SavedLocationEntity[] = [
    {
      id: 'loc-1',
      name: 'Home (Mumbai Suburban)',
      category: 'home',
      coordinates: [19.0760, 72.8777],
      stateName: 'Maharashtra',
      district: 'Mumbai Suburban',
      riskScore: 78,
      riskLevel: 'High',
      weatherSnippet: '31°C • Heavy Showers',
    },
    {
      id: 'loc-2',
      name: 'Office (Bandra-Kurla Complex)',
      category: 'work',
      coordinates: [19.0596, 72.8656],
      stateName: 'Maharashtra',
      district: 'Mumbai City',
      riskScore: 65,
      riskLevel: 'Medium',
      weatherSnippet: '30°C • Thunderstorms',
    },
    {
      id: 'loc-3',
      name: 'Parents (Pune Kothrud)',
      category: 'family',
      coordinates: [18.5074, 73.8077],
      stateName: 'Maharashtra',
      district: 'Pune',
      riskScore: 28,
      riskLevel: 'Low',
      weatherSnippet: '27°C • Overcast',
    },
    {
      id: 'loc-4',
      name: 'Coastal Site (Puri Beach)',
      category: 'other',
      coordinates: [19.8135, 85.8312],
      stateName: 'Odisha',
      district: 'Puri',
      riskScore: 92,
      riskLevel: 'Critical',
      weatherSnippet: '29°C • Cyclone Watch',
    },
  ];

  public static async getSavedLocations(): Promise<SavedLocationEntity[]> {
    return [...this.savedLocations];
  }

  public static async addSavedLocation(loc: Omit<SavedLocationEntity, 'id'>): Promise<SavedLocationEntity> {
    const newLocation: SavedLocationEntity = {
      ...loc,
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.savedLocations.unshift(newLocation);
    return newLocation;
  }

  public static async deleteSavedLocation(id: string): Promise<boolean> {
    const len = this.savedLocations.length;
    this.savedLocations = this.savedLocations.filter((l) => l.id !== id);
    return this.savedLocations.length !== len;
  }
}
