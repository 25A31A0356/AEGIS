export type SOSEmergencyType =
  | 'flash_flood_stranding'
  | 'building_collapse'
  | 'cyclone_shelter_needed'
  | 'medical_critical'
  | 'landslide_roadblock'
  | 'industrial_fire'
  | 'electrical_hazard'
  | 'general_distress';

export type SOSTriageStatus =
  | 'PENDING'
  | 'MATCHING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'RESPONDER_EN_ROUTE'
  | 'ON_SITE'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'EXPIRED'
  // Legacy alias compatibility
  | 'incoming'
  | 'acknowledged'
  | 'dispatching'
  | 'on_scene'
  | 'resolved'
  | 'cancelled';

export interface SOSTimelineEvent {
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  instruction?: string;
  distanceMeters?: number;
}

export interface SOSAssignedUnit {
  unitId?: string;
  unitName: string;
  callsign?: string;
  unitType: 'NDRF Quick Response Team' | 'NDRF Rescue Boat' | 'SDRF Boat Crew' | 'State Emergency Ambulance (108)' | 'Fire & Rescue Service' | 'Disaster Civil Defence' | string;
  commanderName?: string;
  commanderContact?: string;
  contactPhone: string;
  etaMinutes: number;
  distanceKm: number;
  responderCoordinates?: [number, number];
  lastPing?: string;
}

export interface SOSBeacon {
  id: string; // e.g. "SOS-TS-8821"
  anonymousAlias: string; // e.g. "Beacon #TS-8821 (App User)"
  phoneMasked: string; // e.g. "+91 98**** 4421"
  rawPhone?: string;
  timestamp: string;
  emergencyType: SOSEmergencyType | string;
  emergencyTitle: string;
  locationName: string;
  district: string;
  state: string;
  coordinates: [number, number]; // [lat, lng]
  gpsAccuracyMeters: number;
  batteryPercent: number;
  altitudeMeters?: number;
  personsCount: number;
  medicalConditions?: string;
  specialNeeds?: string;
  triageStatus: SOSTriageStatus;
  severity: 'critical' | 'warning' | 'moderate';
  assignedUnit?: SOSAssignedUnit;
  timeline: SOSTimelineEvent[];
  routeCoordinates?: [number, number][];
  routeSteps?: {
    stepIndex: number;
    instruction: string;
    distanceText: string;
    durationText: string;
    roadName: string;
  }[];
  isLiveBackend?: boolean;
}
