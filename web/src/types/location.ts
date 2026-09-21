export type GeoScope = 'india' | 'asia' | 'global';

export interface StateRiskData {
  id: string; // e.g. "TS"
  name: string; // "Telangana"
  type: 'state' | 'ut';
  capital: string;
  populationCrores: number;
  centerCoordinates: [number, number]; // [lat, lng]
  riskLevel: 'critical' | 'warning' | 'moderate' | 'low';
  riskScore: number; // 0 to 100
  activeHazardsCount: number;
  activeWarningsCount: number;
  activeSOSCount: number;
  primaryThreat: string;
  currentTemp: number;
  condition: string;
  sdmaHelpline: string;
  keyDistricts: {
    name: string;
    risk: 'critical' | 'warning' | 'moderate' | 'low';
    hazardType?: string;
  }[];
}

export interface SafeShelter {
  id: string;
  name: string;
  type: 'Cyclone Shelter' | 'Flood Relief Camp' | 'Hospital / Trauma Center' | 'NDRF Battalion Base' | 'Community Hall Evacuation Center';
  state: string;
  district: string;
  locationName: string;
  coordinates: [number, number];
  capacityPersons: number;
  currentOccupancy: number;
  contactNumber: string;
  facilities: string[];
  status: 'operational' | 'ready' | 'full';
}
