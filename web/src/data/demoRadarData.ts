// ============================================================================
// AEGIS DISASTER MANAGEMENT SYSTEM
// REAL-TIME IMD DOPPLER WEATHER RADAR (DWR) NETWORK TELEMETRY
// S-Band, C-Band, and X-Band Radar Stations Across India
// ============================================================================

export interface DWRStation {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number]; // [lat, lng]
  band: 'S-Band' | 'C-Band' | 'X-Band';
  rangeKm: number;
  status: 'ACTIVE' | 'MAINTENANCE';
  scanFrequency: string; // e.g. '10 min'
  reflectivityDbz: number; // Max dBZ within 250km radius
  rainRateMmh: number;
  radialVelocityKmh: number;
  stormDirection: string; // e.g. 'NW (310°)'
  stormSpeedKmh: number;
  nowcastAlert: string;
  severity: 'extreme' | 'severe' | 'moderate' | 'light' | 'clear';
}

export interface RadarStormCell {
  id: string;
  dwrStationId: string;
  center: [number, number];
  radiusKm: number;
  dbz: number; // e.g. 52 dBZ
  rainfallCategory: 'Hail / Torrential (>55 dBZ)' | 'Heavy Downpour (45-55 dBZ)' | 'Moderate Rain (35-45 dBZ)' | 'Light Rain (20-35 dBZ)';
  movementVector: {
    azimuthDeg: number;
    speedKmh: number;
  };
  nowcastWarning: string;
}

export const IMD_DWR_STATIONS: DWRStation[] = [
  {
    id: 'DWR-VSKP',
    name: 'Visakhapatnam Coastal DWR',
    state: 'Andhra Pradesh',
    coordinates: [17.7042, 83.2978],
    band: 'S-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 54,
    rainRateMmh: 68.5,
    radialVelocityKmh: 92,
    stormDirection: 'NW (310°)',
    stormSpeedKmh: 24,
    nowcastAlert: 'Intense cyclonic outer rainbands detected with high dBZ reflectivity moving towards coastal Visakhapatnam and Vizianagaram.',
    severity: 'extreme',
  },
  {
    id: 'DWR-MCTP',
    name: 'Machilipatnam DWR',
    state: 'Andhra Pradesh',
    coordinates: [16.1875, 81.1389],
    band: 'S-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 48,
    rainRateMmh: 42.0,
    radialVelocityKmh: 75,
    stormDirection: 'WNW (290°)',
    stormSpeedKmh: 20,
    nowcastAlert: 'Squally convection and heavy precipitation echoes detected over Krishna-Godavari coastal belt.',
    severity: 'severe',
  },
  {
    id: 'DWR-GPLP',
    name: 'Gopalpur Coastal DWR',
    state: 'Odisha',
    coordinates: [19.2600, 84.9100],
    band: 'S-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 51,
    rainRateMmh: 56.0,
    radialVelocityKmh: 84,
    stormDirection: 'NNW (330°)',
    stormSpeedKmh: 22,
    nowcastAlert: 'Dense meso-convective spiral rainbands tracking across Ganjam & Puri coast.',
    severity: 'extreme',
  },
  {
    id: 'DWR-PRDP',
    name: 'Paradeep DWR',
    state: 'Odisha',
    coordinates: [20.3167, 86.6167],
    band: 'S-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 46,
    rainRateMmh: 35.0,
    radialVelocityKmh: 68,
    stormDirection: 'NW (315°)',
    stormSpeedKmh: 18,
    nowcastAlert: 'Moderate to heavy sea-borne precipitation cells crossing Jagatsinghpur coastline.',
    severity: 'severe',
  },
  {
    id: 'DWR-CHNI',
    name: 'Chennai DWR (Sriharikota/Meenambakkam)',
    state: 'Tamil Nadu',
    coordinates: [13.0827, 80.2707],
    band: 'S-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 38,
    rainRateMmh: 18.2,
    radialVelocityKmh: 45,
    stormDirection: 'W (270°)',
    stormSpeedKmh: 15,
    nowcastAlert: 'Passing squall lines with moderate convective showers over North Coastal Tamil Nadu.',
    severity: 'moderate',
  },
  {
    id: 'DWR-KLKT',
    name: 'Kolkata DWR',
    state: 'West Bengal',
    coordinates: [22.5726, 88.3639],
    band: 'S-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 42,
    rainRateMmh: 28.0,
    radialVelocityKmh: 52,
    stormDirection: 'N (005°)',
    stormSpeedKmh: 19,
    nowcastAlert: 'Thunderstorm cells and rainband clusters entering Sundarbans and South 24 Parganas.',
    severity: 'moderate',
  },
  {
    id: 'DWR-MUMB',
    name: 'Mumbai Coastal DWR (Colaba)',
    state: 'Maharashtra',
    coordinates: [18.9067, 72.8147],
    band: 'S-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 36,
    rainRateMmh: 14.5,
    radialVelocityKmh: 38,
    stormDirection: 'E (090°)',
    stormSpeedKmh: 12,
    nowcastAlert: 'Coastal drizzle and scattered sea-breeze shower echoes over Mumbai Metropolitan Region.',
    severity: 'light',
  },
  {
    id: 'DWR-KCHI',
    name: 'Kochi DWR',
    state: 'Kerala',
    coordinates: [9.9312, 76.2673],
    band: 'C-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 32,
    rainRateMmh: 9.8,
    radialVelocityKmh: 28,
    stormDirection: 'NE (045°)',
    stormSpeedKmh: 10,
    nowcastAlert: 'Light orographic clouds and localized shower echoes over Western Ghats slopes.',
    severity: 'light',
  },
  {
    id: 'DWR-DLHI',
    name: 'New Delhi DWR (Palam / Mausam Bhavan)',
    state: 'Delhi NCR',
    coordinates: [28.5921, 77.0922],
    band: 'C-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 22,
    rainRateMmh: 2.1,
    radialVelocityKmh: 18,
    stormDirection: 'ESE (110°)',
    stormSpeedKmh: 14,
    nowcastAlert: 'Clear to scattered stratiform cloud signatures across NCR.',
    severity: 'clear',
  },
  {
    id: 'DWR-HYDB',
    name: 'Hyderabad DWR',
    state: 'Telangana',
    coordinates: [17.3850, 78.4867],
    band: 'C-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 28,
    rainRateMmh: 5.4,
    radialVelocityKmh: 22,
    stormDirection: 'WNW (295°)',
    stormSpeedKmh: 16,
    nowcastAlert: 'Isolated convective cloud clusters over Deccan plateau.',
    severity: 'light',
  },
  {
    id: 'DWR-SRNR',
    name: 'Srinagar Himalayan DWR',
    state: 'Jammu & Kashmir',
    coordinates: [34.0837, 74.7973],
    band: 'X-Band',
    rangeKm: 150,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 25,
    rainRateMmh: 3.5,
    radialVelocityKmh: 24,
    stormDirection: 'E (085°)',
    stormSpeedKmh: 20,
    nowcastAlert: 'Light Western Disturbance precipitation echoes over Pir Panjal range.',
    severity: 'light',
  },
  {
    id: 'DWR-AGRT',
    name: 'Agartala DWR',
    state: 'Tripura',
    coordinates: [23.8315, 91.2868],
    band: 'C-Band',
    rangeKm: 250,
    status: 'ACTIVE',
    scanFrequency: '10 min volume scan',
    reflectivityDbz: 34,
    rainRateMmh: 12.0,
    radialVelocityKmh: 30,
    stormDirection: 'NNE (030°)',
    stormSpeedKmh: 15,
    nowcastAlert: 'Scattered pre-monsoonal thunderstorm cells detected over Barak valley corridor.',
    severity: 'light',
  }
];

export const IMD_STORM_CELLS: RadarStormCell[] = [
  {
    id: 'CELL-01',
    dwrStationId: 'DWR-VSKP',
    center: [17.55, 83.85],
    radiusKm: 45,
    dbz: 54,
    rainfallCategory: 'Heavy Downpour (45-55 dBZ)',
    movementVector: {
      azimuthDeg: 310,
      speedKmh: 24,
    },
    nowcastWarning: 'Intense meso-scale storm cell producing 65+ mm/h downpours and squall gusts to 95 km/h.',
  },
  {
    id: 'CELL-02',
    dwrStationId: 'DWR-GPLP',
    center: [18.95, 85.30],
    radiusKm: 55,
    dbz: 51,
    rainfallCategory: 'Heavy Downpour (45-55 dBZ)',
    movementVector: {
      azimuthDeg: 330,
      speedKmh: 22,
    },
    nowcastWarning: 'Severe maritime convection spiraling into Southern Odisha with high lightning frequency.',
  },
  {
    id: 'CELL-03',
    dwrStationId: 'DWR-MCTP',
    center: [15.90, 81.60],
    radiusKm: 35,
    dbz: 48,
    rainfallCategory: 'Heavy Downpour (45-55 dBZ)',
    movementVector: {
      azimuthDeg: 290,
      speedKmh: 20,
    },
    nowcastWarning: 'Squall band with localized flash flood potential across coastal Andhra lowlands.',
  }
];

export const DBZ_LEGEND_LEVELS = [
  { label: 'Clear / Trace', range: '< 20 dBZ', color: '#94A3B8', meaning: 'No significant echoes' },
  { label: 'Light Rain', range: '20 - 30 dBZ', color: '#22C55E', meaning: '0.5 - 2.5 mm/h drizzle' },
  { label: 'Moderate Rain', range: '30 - 40 dBZ', color: '#EAB308', meaning: '2.5 - 10 mm/h steady rain' },
  { label: 'Heavy Downpour', range: '40 - 50 dBZ', color: '#F97316', meaning: '10 - 50 mm/h severe showers' },
  { label: 'Extreme / Hail', range: '> 50 dBZ', color: '#EF4444', meaning: '> 50 mm/h torrential rain / hail' },
  { label: 'Severe Core', range: '> 60 dBZ', color: '#A855F7', meaning: 'Severe cyclonic eyewall / violent storm' },
];
