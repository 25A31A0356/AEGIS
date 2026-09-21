export type HazardNature = 'forecast' | 'warning' | 'incident';

export type HazardCategory =
  | 'flood'
  | 'flash_flood'
  | 'cyclone'
  | 'thunderstorm'
  | 'lightning'
  | 'heatwave'
  | 'coldwave'
  | 'dense_fog'
  | 'landslide'
  | 'earthquake'
  | 'drought'
  | 'building_collapse'
  | 'industrial_fire'
  | 'chemical_spill'
  | 'road_accident'
  | 'dam_overflow'
  | 'wildfire';

export type HazardSeverity = 'critical' | 'warning' | 'moderate' | 'minor' | 'safe';

export type HazardStatus = 'active' | 'monitoring' | 'resolved' | 'escalated';

export interface TimelineEvent {
  time: string;
  stage: 'Risk Detected' | 'Advisory Issued' | 'Warning Upgraded' | 'Incident Reported' | 'Response Deployed' | 'Contained' | 'All Clear';
  description: string;
  source: string;
}

export interface SafetyAction {
  title: string;
  instruction: string;
  icon?: string;
  urgent?: boolean;
}

export interface HazardItem {
  id: string;
  title: string;
  category: HazardCategory;
  categoryName: string;
  isHumanMade?: boolean;
  nature: HazardNature; // Forecast vs Warning vs Incident
  severity: HazardSeverity;
  status: HazardStatus;
  headline: string;
  description: string;
  location: {
    state: string;
    district: string;
    city?: string;
    coordinates: [number, number]; // [lat, lng]
    radiusKm?: number;
    affectedZones?: string[];
  };
  source: {
    agency: string; // e.g., 'IMD New Delhi', 'NDMA India', 'CWC Flood Directorate', 'INCOIS', 'Telangana State SDMA'
    bulletinId: string;
    publishedAt: string;
    validUntil: string;
  };
  metrics?: {
    intensity?: string;
    windSpeedKmph?: number;
    rainfallMm?: number;
    floodLevelMeters?: number;
    dangerLevelMeters?: number;
    heatIndexCelsius?: number;
    magnitudeRichter?: number;
    populationAtRisk?: number;
  };
  timeline: TimelineEvent[];
  safetyAdvice: SafetyAction[];
  emergencyContacts: {
    name: string;
    phone: string;
  }[];
}
