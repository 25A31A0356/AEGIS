export interface WindStreamline {
  id: string;
  name: string;
  type: 'upstream_jet' | 'cyclonic_inflow' | 'monsoon_current' | 'trade_wind' | 'orographic_lee' | 'downstream_outflow';
  flowType: 'upstream' | 'downstream' | 'recirculating';
  originRegion: string;
  destinationRegion: string;
  avgSpeedKmh: number;
  maxGustKmh: number;
  altitudeLevel: 'surface' | '850hpa' | '500hpa' | '250hpa';
  beaufortScale: string;
  color: string;
  points: [number, number][]; // Lat, Lng polyline points
  description: string;
}

export interface HeavyWindWarningZone {
  id: string;
  title: string;
  category: 'SEVERE_CYCLONIC_GALE' | 'COASTAL_SQUALL' | 'JET_STREAM_SHEAR' | 'OROGRAPHIC_GUST';
  severity: 'extreme' | 'severe' | 'moderate';
  center: [number, number];
  radiusMeters: number;
  polygon?: [number, number][];
  currentWindKmh: number;
  peakGustKmh: number;
  affectedStates: string[];
  alertMessage: string;
}

export interface AnemometerStation {
  id: string;
  stationName: string;
  state: string;
  coordinates: [number, number];
  windSpeedKmh: number;
  gustSpeedKmh: number;
  directionDegrees: number;
  cardinalDirection: string;
  flowRole: 'Upstream Feeder' | 'Convergence Vortex' | 'Downstream Advection' | 'Lee Trough';
  upstreamOrigin: string;
  downstreamTarget: string;
  barometricPressureHpa: number;
  beaufortCategory: string;
  status: 'NORMAL' | 'STRONG_BREEZE' | 'GALE_WARNING' | 'HURRICANE_FORCE';
}

export interface IsobarLine {
  id: string;
  pressureHpa: number;
  points: [number, number][];
}

// 1. Comprehensive Wind Streamlines & Air Currents across India
export const INDIA_WIND_STREAMLINES: WindStreamline[] = [
  // A. Cyclonic Inflow into Cyclone DANA (Bay of Bengal) - Upstream converging to Downstream
  {
    id: 'stream-bob-cyclonic-main',
    name: 'Bay of Bengal Cyclonic Inflow (Cyclone DANA)',
    type: 'cyclonic_inflow',
    flowType: 'upstream',
    originRegion: 'South-Central Bay of Bengal (9.0°N, 90.0°E)',
    destinationRegion: 'Cyclone DANA Eye Vortex (16.8°N, 86.4°E)',
    avgSpeedKmh: 110,
    maxGustKmh: 145,
    altitudeLevel: 'surface',
    beaufortScale: 'Violent Storm (Force 11)',
    color: '#DC2626',
    points: [
      [8.5, 91.5],
      [10.2, 90.0],
      [12.4, 88.8],
      [14.5, 87.8],
      [16.2, 87.0],
      [16.8, 86.4],
    ],
    description: 'Violent spiraling cyclonic feeder stream transporting high-enthalpy moisture into Cyclone DANA eye-wall.',
  },
  {
    id: 'stream-bob-cyclonic-feeder-east',
    name: 'Eastern Andaman Moisture Conveyor',
    type: 'cyclonic_inflow',
    flowType: 'upstream',
    originRegion: 'Andaman Sea / Tenasserim Coast',
    destinationRegion: 'North Bay of Bengal Convection Band',
    avgSpeedKmh: 85,
    maxGustKmh: 105,
    altitudeLevel: 'surface',
    beaufortScale: 'Severe Gale (Force 9)',
    color: '#EA580C',
    points: [
      [11.5, 94.0],
      [13.8, 92.5],
      [15.8, 90.2],
      [17.5, 88.5],
      [18.0, 87.2],
    ],
    description: 'Strong easterly inflow channeling oceanic moisture from Andaman Sea into outer rainbands.',
  },
  {
    id: 'stream-bob-outflow-ap-odisha',
    name: 'Coastal Andhra-Odisha Squall Outflow',
    type: 'downstream_outflow',
    flowType: 'downstream',
    originRegion: 'Cyclone DANA Northern Quadrant (17.5°N, 86.0°E)',
    destinationRegion: 'North AP & South Odisha Coastal Belt (Srikakulam, Gopalpur, Puri)',
    avgSpeedKmh: 95,
    maxGustKmh: 125,
    altitudeLevel: 'surface',
    beaufortScale: 'Storm Force (Force 10)',
    color: '#DC2626',
    points: [
      [17.0, 86.2],
      [17.8, 85.2],
      [18.5, 84.6],
      [19.2, 84.9],
      [19.8, 85.5],
      [20.5, 86.5],
    ],
    description: 'Downstream heavy squall arc driving severe surge waves and torrential precipitation onto AP & Odisha shores.',
  },

  // B. Subtropical Westerly Jet Stream (Northern India - Upstream to Downstream)
  {
    id: 'stream-jet-north-1',
    name: 'Subtropical Westerly Jet Stream (Core)',
    type: 'upstream_jet',
    flowType: 'upstream',
    originRegion: 'Hindu Kush & Karakoram High Plateau',
    destinationRegion: 'Indo-Gangetic Plain to Brahmaputra Basin',
    avgSpeedKmh: 135,
    maxGustKmh: 175,
    altitudeLevel: '250hpa',
    beaufortScale: 'Hurricane Force (Force 12+ Jet)',
    color: '#9333EA',
    points: [
      [34.2, 73.5],
      [32.8, 76.0],
      [30.5, 78.5],
      [28.8, 82.0],
      [27.2, 86.0],
      [26.5, 90.5],
      [26.8, 94.5],
    ],
    description: 'High-altitude upper-tropospheric westerly jet stream steering synoptic troughs and western disturbances.',
  },
  {
    id: 'stream-jet-gangetic-corridor',
    name: 'Indo-Gangetic Low-Level Westerly Flow',
    type: 'upstream_jet',
    flowType: 'downstream',
    originRegion: 'Punjab & Haryana Plains',
    destinationRegion: 'West Bengal Delta & Bay of Bengal Head',
    avgSpeedKmh: 42,
    maxGustKmh: 60,
    altitudeLevel: 'surface',
    beaufortScale: 'Moderate to Fresh Breeze (Force 5)',
    color: '#3B82F6',
    points: [
      [30.7, 76.8],
      [29.2, 78.2],
      [27.5, 80.5],
      [26.2, 83.5],
      [25.4, 86.8],
      [23.8, 88.5],
      [22.2, 89.2],
    ],
    description: 'Downstream continental air current advecting dry northern air towards the Bengal delta.',
  },

  // C. South-West Arabian Sea Monsoon Air Current (Upstream Oceanic Flow)
  {
    id: 'stream-arabian-sw-1',
    name: 'South-West Arabian Sea Main Branch',
    type: 'monsoon_current',
    flowType: 'upstream',
    originRegion: 'Somali Jet & Central Arabian Sea',
    destinationRegion: 'Konkan & Malabar Coast (Western Ghats Barrier)',
    avgSpeedKmh: 58,
    maxGustKmh: 75,
    altitudeLevel: 'surface',
    beaufortScale: 'Near Gale (Force 7)',
    color: '#0284C7',
    points: [
      [9.0, 68.0],
      [11.5, 71.0],
      [13.8, 73.2],
      [15.5, 73.8],
      [17.2, 73.4],
      [19.0, 72.8],
    ],
    description: 'Upstream oceanic air stream loaded with moisture impinging perpendicularly onto the Western Ghats.',
  },
  {
    id: 'stream-deccan-lee-trough',
    name: 'Deccan Plateau Downstream Rain-Shadow Current',
    type: 'orographic_lee',
    flowType: 'downstream',
    originRegion: 'Western Ghats Ridge Crest (Mahabaleshwar - Coorg)',
    destinationRegion: 'Marathwada, Telangana & Rayalaseema Plains',
    avgSpeedKmh: 35,
    maxGustKmh: 50,
    altitudeLevel: 'surface',
    beaufortScale: 'Moderate Breeze (Force 4)',
    color: '#10B981',
    points: [
      [16.8, 74.2],
      [17.3, 76.5],
      [17.6, 78.8],
      [17.4, 80.8],
    ],
    description: 'Descending downstream föhn-like adiabatic airflow traversing the semi-arid interior plateau.',
  },

  // D. North-East / Himalayan Downslope Air Current
  {
    id: 'stream-ne-downslope',
    name: 'Brahmaputra Valley Easterly Air Stream',
    type: 'upstream_jet',
    flowType: 'upstream',
    originRegion: 'Eastern Himalayas / Arunachal Ridge',
    destinationRegion: 'Assam Valley to Bangladesh Plain',
    avgSpeedKmh: 28,
    maxGustKmh: 45,
    altitudeLevel: 'surface',
    beaufortScale: 'Gentle to Moderate Breeze (Force 3-4)',
    color: '#059669',
    points: [
      [27.8, 95.5],
      [26.8, 93.8],
      [26.2, 91.5],
      [25.5, 89.8],
    ],
    description: 'Downslope katabatic breeze channeled through the narrow Assam corridor.',
  },

  // E. Gujarat & Rann of Kutch Offshore Gale Current
  {
    id: 'stream-gujarat-coastal-gale',
    name: 'Saurashtra-Kutch Coastal Offshore Stream',
    type: 'monsoon_current',
    flowType: 'upstream',
    originRegion: 'Northern Arabian Sea / Gulf of Kutch',
    destinationRegion: 'Saurashtra Peninsula & Gulf of Khambhat',
    avgSpeedKmh: 52,
    maxGustKmh: 68,
    altitudeLevel: 'surface',
    beaufortScale: 'Moderate Gale (Force 7)',
    color: '#F59E0B',
    points: [
      [23.2, 68.2],
      [22.5, 69.8],
      [21.2, 70.8],
      [20.8, 72.5],
    ],
    description: 'Strong coastal gust corridor producing choppy sea conditions and strong wind shear.',
  },

  // F. South Peninsular Cross-Equatorial Trade Wind
  {
    id: 'stream-south-peninsula-trade',
    name: 'Palk Strait & Gulf of Mannar Trade Stream',
    type: 'trade_wind',
    flowType: 'downstream',
    originRegion: 'Equatorial Indian Ocean',
    destinationRegion: 'Tamil Nadu Coast (Rameswaram to Chennai)',
    avgSpeedKmh: 45,
    maxGustKmh: 62,
    altitudeLevel: 'surface',
    beaufortScale: 'Strong Breeze (Force 6)',
    color: '#0D9488',
    points: [
      [6.8, 79.5],
      [8.5, 79.2],
      [10.2, 79.8],
      [12.0, 80.3],
      [13.5, 80.5],
    ],
    description: 'High-velocity trade wind jet funneled between Sri Lanka and the Tamil Nadu coastline.',
  },
];

// 2. Heavy Wind & Severe Gale Warning Zones
export const HEAVY_WIND_WARNING_ZONES: HeavyWindWarningZone[] = [
  {
    id: 'warn-cyclone-dana-core',
    title: 'Extreme Cyclonic Gale & Squall Zone (Cyclone DANA Core)',
    category: 'SEVERE_CYCLONIC_GALE',
    severity: 'extreme',
    center: [16.8, 86.4],
    radiusMeters: 210000,
    currentWindKmh: 130,
    peakGustKmh: 145,
    affectedStates: ['Bay of Bengal Maritime Zone', 'Andhra Pradesh Offshore', 'Odisha Offshore'],
    alertMessage: 'Violent destructive gale winds exceeding 130 km/h with phenomenal sea conditions. Total ban on fishing & maritime operations.',
  },
  {
    id: 'warn-coastal-ap-odisha-squall',
    title: 'North AP & South Odisha Coastal Heavy Squall Arc',
    category: 'COASTAL_SQUALL',
    severity: 'severe',
    center: [18.5, 84.8],
    radiusMeters: 130000,
    currentWindKmh: 85,
    peakGustKmh: 110,
    affectedStates: ['Andhra Pradesh (Srikakulam, Vizianagaram, Visakhapatnam)', 'Odisha (Ganjam, Puri, Gajapati)'],
    alertMessage: 'Squall wind speed reaching 80-95 km/h gusting to 110 km/h. Danger of uprooting trees, power lines, and thatched roofs.',
  },
  {
    id: 'warn-himalayan-jet-shear',
    title: 'Himalayan High Altitude Ridge Wind Shear Zone',
    category: 'JET_STREAM_SHEAR',
    severity: 'moderate',
    center: [32.5, 77.0],
    radiusMeters: 160000,
    currentWindKmh: 75,
    peakGustKmh: 95,
    affectedStates: ['Himachal Pradesh', 'Uttarakhand', 'Jammu & Kashmir', 'Ladakh'],
    alertMessage: 'Intense cross-mountain wind shear causing severe turbulence and localized blizzard gusts along passes.',
  },
  {
    id: 'warn-western-ghats-gusts',
    title: 'Western Ghats Orographic High Wind Corridor',
    category: 'OROGRAPHIC_GUST',
    severity: 'moderate',
    center: [14.2, 74.8],
    radiusMeters: 110000,
    currentWindKmh: 55,
    peakGustKmh: 72,
    affectedStates: ['Karnataka Coast', 'Kerala', 'Goa', 'Maharashtra (Konkan)'],
    alertMessage: 'Strong onshore gusts with heavy swell along the coastline. Small crafts advised not to venture into deep sea.',
  },
];

// 3. Meteorological Anemometer Observation Stations Across India
export const INDIA_ANEMOMETER_STATIONS: AnemometerStation[] = [
  {
    id: 'stn-vskp',
    stationName: 'Visakhapatnam Port & Doppler Obs',
    state: 'Andhra Pradesh',
    coordinates: [17.6868, 83.2185],
    windSpeedKmh: 78,
    gustSpeedKmh: 96,
    directionDegrees: 65,
    cardinalDirection: 'ENE',
    flowRole: 'Downstream Advection',
    upstreamOrigin: 'Cyclone DANA Outer Cloud Band (BoB)',
    downstreamTarget: 'Eastern Ghats Coastal Slopes',
    barometricPressureHpa: 994,
    beaufortCategory: 'Strong Gale (Force 9)',
    status: 'GALE_WARNING',
  },
  {
    id: 'stn-kalingapatnam',
    stationName: 'Kalingapatnam Coastal Observatory',
    state: 'Andhra Pradesh',
    coordinates: [18.34, 84.13],
    windSpeedKmh: 92,
    gustSpeedKmh: 115,
    directionDegrees: 55,
    cardinalDirection: 'NE',
    flowRole: 'Downstream Advection',
    upstreamOrigin: 'Cyclone DANA Northern Core',
    downstreamTarget: 'North Coastal Andhra Corridor',
    barometricPressureHpa: 988,
    beaufortCategory: 'Storm Force (Force 10)',
    status: 'HURRICANE_FORCE',
  },
  {
    id: 'stn-gopalpur',
    stationName: 'Gopalpur Coastal Radar Station',
    state: 'Odisha',
    coordinates: [19.26, 84.91],
    windSpeedKmh: 88,
    gustSpeedKmh: 110,
    directionDegrees: 45,
    cardinalDirection: 'NE',
    flowRole: 'Downstream Advection',
    upstreamOrigin: 'Cyclone DANA Eye-Wall Sector',
    downstreamTarget: 'Rushikulya River Basin',
    barometricPressureHpa: 990,
    beaufortCategory: 'Severe Gale (Force 9)',
    status: 'GALE_WARNING',
  },
  {
    id: 'stn-bhubaneswar',
    stationName: 'Bhubaneswar Meteorological Center',
    state: 'Odisha',
    coordinates: [20.2961, 85.8245],
    windSpeedKmh: 58,
    gustSpeedKmh: 75,
    directionDegrees: 70,
    cardinalDirection: 'ENE',
    flowRole: 'Downstream Advection',
    upstreamOrigin: 'North-West Bay of Bengal Squalls',
    downstreamTarget: 'Mahanadi Delta',
    barometricPressureHpa: 1002,
    beaufortCategory: 'Near Gale (Force 7)',
    status: 'GALE_WARNING',
  },
  {
    id: 'stn-delhi',
    stationName: 'New Delhi Safdarjung Regional HQ',
    state: 'Delhi NCR',
    coordinates: [28.5844, 77.2066],
    windSpeedKmh: 24,
    gustSpeedKmh: 36,
    directionDegrees: 295,
    cardinalDirection: 'WNW',
    flowRole: 'Upstream Feeder',
    upstreamOrigin: 'Punjab & Thar Desert Boundary',
    downstreamTarget: 'Upper Gangetic Plain (UP)',
    barometricPressureHpa: 1012,
    beaufortCategory: 'Moderate Breeze (Force 4)',
    status: 'NORMAL',
  },
  {
    id: 'stn-mumbai',
    stationName: 'Mumbai Colaba Observatory',
    state: 'Maharashtra',
    coordinates: [18.9067, 72.8147],
    windSpeedKmh: 42,
    gustSpeedKmh: 56,
    directionDegrees: 245,
    cardinalDirection: 'WSW',
    flowRole: 'Upstream Feeder',
    upstreamOrigin: 'Central Arabian Sea Air Mass',
    downstreamTarget: 'Western Ghats Windward Escarpment',
    barometricPressureHpa: 1008,
    beaufortCategory: 'Strong Breeze (Force 6)',
    status: 'STRONG_BREEZE',
  },
  {
    id: 'stn-kolkata',
    stationName: 'Kolkata Alipore Met Center',
    state: 'West Bengal',
    coordinates: [22.5333, 88.3333],
    windSpeedKmh: 52,
    gustSpeedKmh: 68,
    directionDegrees: 80,
    cardinalDirection: 'ENE',
    flowRole: 'Convergence Vortex',
    upstreamOrigin: 'Head Bay of Bengal Feeder Stream',
    downstreamTarget: 'Sundarbans Biosphere',
    barometricPressureHpa: 1004,
    beaufortCategory: 'Moderate Gale (Force 7)',
    status: 'GALE_WARNING',
  },
  {
    id: 'stn-chennai',
    stationName: 'Chennai Meenambakkam Center',
    state: 'Tamil Nadu',
    coordinates: [12.9941, 80.1809],
    windSpeedKmh: 38,
    gustSpeedKmh: 50,
    directionDegrees: 25,
    cardinalDirection: 'NNE',
    flowRole: 'Downstream Advection',
    upstreamOrigin: 'South-West Bay Trough',
    downstreamTarget: 'Coromandel Coastal Plain',
    barometricPressureHpa: 1009,
    beaufortCategory: 'Fresh Breeze (Force 5)',
    status: 'NORMAL',
  },
  {
    id: 'stn-kochi',
    stationName: 'Kochi Naval Air Station',
    state: 'Kerala',
    coordinates: [9.9312, 76.2673],
    windSpeedKmh: 48,
    gustSpeedKmh: 64,
    directionDegrees: 230,
    cardinalDirection: 'SW',
    flowRole: 'Upstream Feeder',
    upstreamOrigin: 'Lakshadweep Sea Maritime Corridor',
    downstreamTarget: 'Anamudi & Cardamom Hills',
    barometricPressureHpa: 1010,
    beaufortCategory: 'Strong Breeze (Force 6)',
    status: 'STRONG_BREEZE',
  },
  {
    id: 'stn-hyderabad',
    stationName: 'Hyderabad Begumpet Station',
    state: 'Telangana',
    coordinates: [17.4531, 78.4677],
    windSpeedKmh: 32,
    gustSpeedKmh: 46,
    directionDegrees: 75,
    cardinalDirection: 'ENE',
    flowRole: 'Lee Trough',
    upstreamOrigin: 'Eastern Ghats Peripheral Inflow',
    downstreamTarget: 'Godavari Basin Plains',
    barometricPressureHpa: 1007,
    beaufortCategory: 'Moderate Breeze (Force 4)',
    status: 'NORMAL',
  },
  {
    id: 'stn-ahmedabad',
    stationName: 'Ahmedabad Hansol Observatory',
    state: 'Gujarat',
    coordinates: [23.0734, 72.6263],
    windSpeedKmh: 28,
    gustSpeedKmh: 40,
    directionDegrees: 310,
    cardinalDirection: 'NW',
    flowRole: 'Upstream Feeder',
    upstreamOrigin: 'Rann of Kutch Continental Stream',
    downstreamTarget: 'Sabarmati Valley',
    barometricPressureHpa: 1011,
    beaufortCategory: 'Moderate Breeze (Force 4)',
    status: 'NORMAL',
  },
  {
    id: 'stn-guwahati',
    stationName: 'Guwahati Borjhar Met Center',
    state: 'Assam',
    coordinates: [26.1061, 91.5859],
    windSpeedKmh: 18,
    gustSpeedKmh: 28,
    directionDegrees: 85,
    cardinalDirection: 'E',
    flowRole: 'Upstream Feeder',
    upstreamOrigin: 'Brahmaputra Valley Katabatic Air',
    downstreamTarget: 'Meghalaya Plateau Foothills',
    barometricPressureHpa: 1012,
    beaufortCategory: 'Gentle Breeze (Force 3)',
    status: 'NORMAL',
  },
  {
    id: 'stn-port-blair',
    stationName: 'Port Blair Marine & Radar Base',
    state: 'Andaman & Nicobar',
    coordinates: [11.6234, 92.7265],
    windSpeedKmh: 64,
    gustSpeedKmh: 82,
    directionDegrees: 215,
    cardinalDirection: 'SW',
    flowRole: 'Upstream Feeder',
    upstreamOrigin: 'Equatorial Indian Ocean Swell',
    downstreamTarget: 'Cyclone DANA Southern Feed',
    barometricPressureHpa: 1001,
    beaufortCategory: 'Gale (Force 8)',
    status: 'GALE_WARNING',
  },
  {
    id: 'stn-leh',
    stationName: 'Leh High Altitude Meteorological Observatory',
    state: 'Ladakh',
    coordinates: [34.1526, 77.5771],
    windSpeedKmh: 68,
    gustSpeedKmh: 88,
    directionDegrees: 270,
    cardinalDirection: 'W',
    flowRole: 'Upstream Feeder',
    upstreamOrigin: 'Tibetan Plateau Jet Stream',
    downstreamTarget: 'Zanskar Range',
    barometricPressureHpa: 680,
    beaufortCategory: 'Gale (Force 8)',
    status: 'GALE_WARNING',
  },
];

// 4. Barometric Isobar Contours (Mean Sea Level Pressure hPa)
export const INDIA_ISOBAR_LINES: IsobarLine[] = [
  {
    id: 'isobar-980',
    pressureHpa: 980,
    points: [
      [16.8, 86.4],
      [17.3, 86.8],
      [17.8, 86.2],
      [17.4, 85.6],
      [16.8, 86.4],
    ],
  },
  {
    id: 'isobar-992',
    pressureHpa: 992,
    points: [
      [15.5, 87.8],
      [17.5, 88.0],
      [19.0, 86.8],
      [18.5, 84.8],
      [16.5, 84.5],
      [15.5, 87.8],
    ],
  },
  {
    id: 'isobar-1000',
    pressureHpa: 1000,
    points: [
      [14.0, 89.5],
      [17.0, 90.0],
      [20.5, 88.5],
      [20.8, 85.0],
      [18.0, 82.5],
      [15.0, 82.8],
      [14.0, 89.5],
    ],
  },
  {
    id: 'isobar-1008',
    pressureHpa: 1008,
    points: [
      [10.0, 72.0],
      [14.0, 74.0],
      [18.0, 75.0],
      [22.0, 78.0],
      [24.0, 84.0],
      [23.0, 90.0],
    ],
  },
  {
    id: 'isobar-1012',
    pressureHpa: 1012,
    points: [
      [26.0, 70.0],
      [28.0, 75.0],
      [29.5, 80.0],
      [28.5, 86.0],
      [27.0, 92.0],
    ],
  },
];
