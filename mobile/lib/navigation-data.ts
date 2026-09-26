export type RouteSafetyStatus =
  | "Recommended Safe Corridor"
  | "Fastest Elevated Bypass"
  | "Contingency High-Ground Trail"
  | "Route Submerged / Impassable";

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface ShelterAmenity {
  drinkingWater: boolean;
  medicalStation: boolean;
  powerBackup: boolean;
  foodSupply: boolean;
  sanitation: boolean;
}

export interface VerifiedShelter {
  id: string;
  name: string;
  type: "Government Cyclone Shelter" | "Community High Hall" | "School Campus Safe Haven" | "Hospital Evacuation Center";
  address: string;
  coordinates: GeoPoint;
  totalCapacity: number;
  occupiedCapacity: number;
  elevationMeters: number;
  distanceKm: number;
  estimatedMinutes: number;
  amenities: ShelterAmenity;
  contactPerson: string;
  contactNumber: string;
  status: "OPEN" | "NEAR_CAPACITY" | "FULL";
  badge: string;
}

export interface NavigationStep {
  id: string;
  instruction: string;
  distanceMeters: number;
  elevationGainM: number;
  icon: "straight" | "turn-right" | "turn-left" | "ascend-ridge" | "cross-bridge" | "arrive";
  hazardNote?: string;
  completed?: boolean;
}

export interface EvacuationRouteOption {
  id: string;
  name: string;
  sectorCode: string;
  shelterCode: string;
  tag: string;
  travelMode: "Walking" | "Vehicle / Emergency Transport" | "Elevated Skywalk";
  distanceKm: number;
  estimatedTimeMinutes: number;
  elevationPeakM: number;
  elevationDeltaM: number;
  safetyStatus: RouteSafetyStatus;
  statusTone: "green" | "blue" | "orange" | "red";
  hazardsAvoided: string[];
  waypoints: [number, number][];
  elevationProfile: { distanceKm: number; elevationM: number; waterLevelM: number }[];
  turnSteps: NavigationStep[];
}

export interface InundationRiskZone {
  id: string;
  name: string;
  waterDepthM: number;
  status: "CRITICAL FLOODING" | "MODERATE WATERLOGGING" | "RISING RUNOFF";
  coordinates: [number, number][];
}

export const DEFAULT_USER_LOCATION: GeoPoint = {
  lat: 17.170,
  lng: 82.050,
  label: "Jaggampeta Station",
};

export interface EmergencyPlace {
  id: string;
  name: string;
  category: "hospital" | "hazard" | "shelter" | "custom" | "sos";
  type: string;
  address: string;
  coordinates: GeoPoint;
  elevationMeters: number;
  contactNumber?: string;
  status: string;
  statusColor?: string;
  badge: string;
  details: string;
  hazardDepthM?: number;
  openBeds?: number;
  totalCapacity?: number;
  sosId?: string;
  deepLinkUrl?: string;
  isMasked?: boolean;
  distanceKm?: number;
  estimatedMinutes?: number;
}

export const EMERGENCY_HOSPITALS: EmergencyPlace[] = [
  {
    id: "hosp-1",
    name: "Central District Hospital & Trauma Center",
    category: "hospital",
    type: "24x7 Emergency Trauma & ICU",
    address: "Medical Enclave, North Hill Road",
    coordinates: { lat: 17.7345, lng: 83.212 },
    elevationMeters: 62,
    contactNumber: "+91 891 256 9999",
    status: "OPEN (18 ICU Beds Available)",
    statusColor: "#188038",
    badge: "24/7 Trauma Ready",
    details: "Equipped with power backup, flood emergency triage, emergency oxygen and blood bank.",
    openBeds: 18,
    totalCapacity: 250,
  },
  {
    id: "hosp-2",
    name: "Apex Emergency Medical Center",
    category: "hospital",
    type: "Multi-Specialty Emergency Hospital",
    address: "Ridge Crest Avenue, Sector 10",
    coordinates: { lat: 17.718, lng: 83.242 },
    elevationMeters: 55,
    contactNumber: "+91 891 278 4321",
    status: "OPEN (34 Beds Available)",
    statusColor: "#188038",
    badge: "Surgical & Pediatric ER",
    details: "High-ground access, functional ambulances, and emergency surgical team on standby.",
    openBeds: 34,
    totalCapacity: 180,
  },
  {
    id: "hosp-3",
    name: "Care Red Cross Flood Triage Clinic",
    category: "hospital",
    type: "Disaster Medical Outpost",
    address: "Higher Plateau East, Sector 08",
    coordinates: { lat: 17.702, lng: 83.258 },
    elevationMeters: 49,
    contactNumber: "+91 891 254 1102",
    status: "OPEN (45 Beds Available)",
    statusColor: "#188038",
    badge: "Rapid First Aid & Triage",
    details: "Specialized in waterborne treatment, wound dressing, and emergency vaccinations.",
    openBeds: 45,
    totalCapacity: 100,
  },
];

export const HAZARD_ZONES_POI: EmergencyPlace[] = [
  {
    id: "haz-1",
    name: "Sector 4 Low Basin Creek Zone",
    category: "hazard",
    type: "Critical Flood Basin",
    address: "Low Basin Creek Rd, Sector 4",
    coordinates: { lat: 17.683, lng: 83.218 },
    elevationMeters: 14,
    status: "⛔ IMPASSABLE (1.6m Water Depth)",
    statusColor: "#D93025",
    badge: "Extreme Drowning Danger",
    details: "Severe flash flood runoff. Road is completely submerged. Do not attempt crossing.",
    hazardDepthM: 1.6,
  },
  {
    id: "haz-2",
    name: "Railway Underpass Submersion",
    category: "hazard",
    type: "Waterlogged Underpass",
    address: "Central Railway Underpass Junction",
    coordinates: { lat: 17.696, lng: 83.218 },
    elevationMeters: 12,
    status: "⛔ SUBMERGED (2.1m Water Depth)",
    statusColor: "#D93025",
    badge: "Vehicles Trapped",
    details: "Underpass is flooded over 2 meters. Avoid all traffic through this underbridge.",
    hazardDepthM: 2.1,
  },
  {
    id: "haz-3",
    name: "Downed High-Voltage Line Zone",
    category: "hazard",
    type: "Electrical Hazard Area",
    address: "Old Trunk Road Corner",
    coordinates: { lat: 17.691, lng: 83.235 },
    elevationMeters: 22,
    status: "⚡ DANGER (Electrocution Risk)",
    statusColor: "#D93025",
    badge: "Live Wire in Water",
    details: "Power transformer collapse with live electrical leakage into standing water.",
    hazardDepthM: 0.5,
  },
];

export const VERIFIED_SHELTERS: VerifiedShelter[] = [
  {
    id: "shelter-1",
    name: "APSDMA Ridge High-Ground Shelter",
    type: "Government Cyclone Shelter",
    address: "Ridge Crest Highway, Sector 12",
    coordinates: { lat: 17.7212, lng: 83.2481 },
    totalCapacity: 850,
    occupiedCapacity: 340,
    elevationMeters: 54,
    distanceKm: 4.2,
    estimatedMinutes: 18,
    amenities: {
      drinkingWater: true,
      medicalStation: true,
      powerBackup: true,
      foodSupply: true,
      sanitation: true,
    },
    contactPerson: "Dr. K. Ramanathan (NDMA Liaison)",
    contactNumber: "+91 891 254 7890",
    status: "OPEN",
    badge: "Primary High-Ground Hub",
  },
  {
    id: "shelter-2",
    name: "Central District Hospital Bunker",
    type: "Hospital Evacuation Center",
    address: "Medical Enclave, North Hill",
    coordinates: { lat: 17.7345, lng: 83.212 },
    totalCapacity: 600,
    occupiedCapacity: 495,
    elevationMeters: 62,
    distanceKm: 5.8,
    estimatedMinutes: 24,
    amenities: {
      drinkingWater: true,
      medicalStation: true,
      powerBackup: true,
      foodSupply: true,
      sanitation: true,
    },
    contactPerson: "Capt. S. Varma (Medical Triage)",
    contactNumber: "+91 891 254 1102",
    status: "NEAR_CAPACITY",
    badge: "ICU & Trauma Equipped",
  },
  {
    id: "shelter-3",
    name: "St. Xavier Community Multi-Purpose Hall",
    type: "Community High Hall",
    address: "Higher Plateau Rd, Sector 07",
    coordinates: { lat: 17.698, lng: 83.265 },
    totalCapacity: 400,
    occupiedCapacity: 110,
    elevationMeters: 48,
    distanceKm: 3.5,
    estimatedMinutes: 15,
    amenities: {
      drinkingWater: true,
      medicalStation: false,
      powerBackup: true,
      foodSupply: true,
      sanitation: true,
    },
    contactPerson: "Sister Maria (Volunteer Coordinator)",
    contactNumber: "+91 891 254 9921",
    status: "OPEN",
    badge: "Pet & Family Friendly",
  },
];

export const EVACUATION_ROUTES: EvacuationRouteOption[] = [
  {
    id: "route-1",
    name: "Ridge Highway Safe Corridor",
    sectorCode: "SEC 04",
    shelterCode: "SHL 01",
    tag: "RECOMMENDED SAFE CORRIDOR",
    travelMode: "Walking",
    distanceKm: 4.2,
    estimatedTimeMinutes: 18,
    elevationPeakM: 54,
    elevationDeltaM: +36,
    safetyStatus: "Recommended Safe Corridor",
    statusTone: "green",
    hazardsAvoided: [
      "Zero waterlogging on elevated ridge",
      "Bypasses 1.4m submerged Sector 4 underpass",
      "NDRF search-and-rescue patrol deployed on corridor",
    ],
    waypoints: [
      [17.6868, 83.2185],
      [17.693, 83.224],
      [17.702, 83.231],
      [17.711, 83.239],
      [17.7212, 83.2481],
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 18, waterLevelM: 19.4 },
      { distanceKm: 0.9, elevationM: 26, waterLevelM: 18.0 },
      { distanceKm: 2.1, elevationM: 38, waterLevelM: 16.5 },
      { distanceKm: 3.3, elevationM: 47, waterLevelM: 15.0 },
      { distanceKm: 4.2, elevationM: 54, waterLevelM: 14.0 },
    ],
    turnSteps: [
      {
        id: "step-1",
        instruction: "Head North-East away from Low-Basin Creek onto Sector 4 Link",
        distanceMeters: 400,
        elevationGainM: +4,
        icon: "straight",
        hazardNote: "Avoid low storm-drains on left shoulder",
      },
      {
        id: "step-2",
        instruction: "Turn RIGHT onto Elevated Ridge Embankment Road",
        distanceMeters: 850,
        elevationGainM: +12,
        icon: "turn-right",
        hazardNote: "Pavement is dry and elevated above flood datum",
      },
      {
        id: "step-3",
        instruction: "Ascend the North Ridge Viaduct toward Sector 12",
        distanceMeters: 1400,
        elevationGainM: +14,
        icon: "ascend-ridge",
        hazardNote: "Follow illuminated solar hazard markers",
      },
      {
        id: "step-4",
        instruction: "Cross the Reinforced Elevated Canal Bridge",
        distanceMeters: 600,
        elevationGainM: +2,
        icon: "cross-bridge",
        hazardNote: "Bridge inspected & verified sound by APSDMA",
      },
      {
        id: "step-5",
        instruction: "Arrive at APSDMA High-Ground Shelter Main Gate",
        distanceMeters: 950,
        elevationGainM: +4,
        icon: "arrive",
        hazardNote: "Registration desk & medical intake on arrival",
      },
    ],
  },
  {
    id: "route-2",
    name: "Eastern Bypass Outer Ring",
    sectorCode: "SEC 07",
    shelterCode: "SHL 03",
    tag: "FASTEST ELEVATED BYPASS",
    travelMode: "Vehicle / Emergency Transport",
    distanceKm: 5.6,
    estimatedTimeMinutes: 22,
    elevationPeakM: 48,
    elevationDeltaM: +30,
    safetyStatus: "Fastest Elevated Bypass",
    statusTone: "blue",
    hazardsAvoided: [
      "4-lane wide asphalt with high runoff drainage",
      "Emergency EV shuttles operating on outer perimeter",
    ],
    waypoints: [
      [17.6868, 83.2185],
      [17.684, 83.232],
      [17.689, 83.249],
      [17.698, 83.265],
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 18, waterLevelM: 19.4 },
      { distanceKm: 1.5, elevationM: 28, waterLevelM: 18.2 },
      { distanceKm: 3.4, elevationM: 41, waterLevelM: 16.0 },
      { distanceKm: 5.6, elevationM: 48, waterLevelM: 14.5 },
    ],
    turnSteps: [
      {
        id: "step-2-1",
        instruction: "Depart current zone via Outer Ring feeder ramp",
        distanceMeters: 600,
        elevationGainM: +5,
        icon: "straight",
      },
      {
        id: "step-2-2",
        instruction: "Merge onto Eastern Bypass Expressway (Lane 1 & 2 only)",
        distanceMeters: 2800,
        elevationGainM: +18,
        icon: "turn-left",
        hazardNote: "Watch for emergency vehicle convoys",
      },
      {
        id: "step-2-3",
        instruction: "Take Exit 7B toward St. Xavier Plateau",
        distanceMeters: 1200,
        elevationGainM: +7,
        icon: "turn-right",
      },
      {
        id: "step-2-4",
        instruction: "Arrive at St. Xavier Multi-Purpose Hall",
        distanceMeters: 1000,
        elevationGainM: +0,
        icon: "arrive",
      },
    ],
  },
  {
    id: "route-3",
    name: "North Hill Medical High-Road",
    sectorCode: "SEC 12",
    shelterCode: "SHL 02",
    tag: "CONTINGENCY HIGH-GROUND TRAIL",
    travelMode: "Walking",
    distanceKm: 6.2,
    estimatedTimeMinutes: 28,
    elevationPeakM: 62,
    elevationDeltaM: +44,
    safetyStatus: "Contingency High-Ground Trail",
    statusTone: "orange",
    hazardsAvoided: [
      "Maximum elevation gain (+44m) above all storm surge levels",
      "Direct pathway to trauma & ICU medical facilities",
    ],
    waypoints: [
      [17.6868, 83.2185],
      [17.701, 83.215],
      [17.718, 83.213],
      [17.7345, 83.212],
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 18, waterLevelM: 19.4 },
      { distanceKm: 1.8, elevationM: 32, waterLevelM: 17.5 },
      { distanceKm: 4.1, elevationM: 49, waterLevelM: 15.2 },
      { distanceKm: 6.2, elevationM: 62, waterLevelM: 13.0 },
    ],
    turnSteps: [
      {
        id: "step-3-1",
        instruction: "Ascend North Ridge steps away from ground basin",
        distanceMeters: 800,
        elevationGainM: +14,
        icon: "ascend-ridge",
      },
      {
        id: "step-3-2",
        instruction: "Proceed along Medical Hill Ridgeline Parkway",
        distanceMeters: 3400,
        elevationGainM: +22,
        icon: "straight",
      },
      {
        id: "step-3-3",
        instruction: "Arrive at Central District Hospital Bunker",
        distanceMeters: 2000,
        elevationGainM: +8,
        icon: "arrive",
      },
    ],
  },
];

export const INUNDATION_ZONES: InundationRiskZone[] = [
  {
    id: "inun-1",
    name: "Sector 4 Low Basin Creek Zone",
    waterDepthM: 1.6,
    status: "CRITICAL FLOODING",
    coordinates: [
      [17.682, 83.212],
      [17.689, 83.215],
      [17.685, 83.226],
      [17.678, 83.221],
    ],
  },
  {
    id: "inun-2",
    name: "Railway Underpass Submersion",
    waterDepthM: 2.1,
    status: "CRITICAL FLOODING",
    coordinates: [
      [17.695, 83.217],
      [17.699, 83.219],
      [17.697, 83.225],
      [17.693, 83.223],
    ],
  },
];
