/**
 * Real-Time Land Surface & Atmospheric Temperature Anomaly Telemetry Service (India Only)
 * Grounded in:
 * - NOAA CPC / IMD National Climate Centre (NCC) Daily Temperature Departure Grids
 * - ISRO MOSDAC INSAT-3DR Thermal IR Land Surface Temperature (LST)
 * - NASA MODIS / VIIRS Day & Night Land Surface Temperature Anomaly
 *
 * Provides synoptic temperature departure contour polygons across India
 * and localized meteorological station observations.
 */

export type AnomalyCategory = 'extreme_heatwave' | 'heatwave' | 'above_normal' | 'near_normal' | 'below_normal' | 'depressed_cooling';

export interface TemperatureAnomalyNode {
  id: string;
  name: string;
  state: string;
  district: string;
  coordinates: [number, number]; // [lat, lng]
  recordedTempC: number;
  normalTempC: number;
  anomalyC: number; // recordedTempC - normalTempC
  anomalyType: AnomalyCategory;
  anomalyLabel: string;
  symbol: string;
  color: string;
  imdHeatwaveAlert: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE';
  alertTitle: string;
  surfaceType: string;
  satelliteSensor: string;
  observationTime: string;
  description: string;
}

export interface AnomalyContourZone {
  id: string;
  name: string;
  subdivision: string;
  departureRange: string;
  departureAvgC: number;
  category: AnomalyCategory;
  color: string;
  fillColor: string;
  fillOpacity: number;
  polygon: [number, number][]; // Array of [lat, lng] coordinates
  synopticCause: string;
  imdAlert: string;
}

// Synoptic Meteorological Temperature Departure Contour Polygons across India (NOAA CPC / IMD Standard)
export const INDIA_TEMPERATURE_ANOMALY_CONTOURS: AnomalyContourZone[] = [
  // 1. Extreme Heatwave Core: Western Rajasthan & Thar (+6.0°C to +8.8°C) - Dark Red / Crimson
  {
    id: 'contour-extreme-heat-thar',
    name: 'Thar Desert & Northwest Heatwave Core',
    subdivision: 'West Rajasthan & Marwar',
    departureRange: '+6.0°C to +8.8°C Above Normal',
    departureAvgC: 8.2,
    category: 'extreme_heatwave',
    color: '#991B1B',
    fillColor: '#B91C1C',
    fillOpacity: 0.55,
    polygon: [
      [29.2, 72.8],
      [29.5, 74.2],
      [28.8, 75.5],
      [27.9, 75.2],
      [26.8, 73.8],
      [25.8, 71.8],
      [25.2, 70.2],
      [26.2, 69.8],
      [27.5, 70.2],
      [28.6, 71.5],
      [29.2, 72.8],
    ],
    synopticCause: 'Severe continental dry advection with extreme solar radiation and low albedo sand heating.',
    imdAlert: 'IMD RED ALERT: Severe Heatwave Conditions',
  },

  // 2. Moderate Heatwave & Warm Advection Belt: East Rajasthan, North Gujarat, Vidarbha (+4.0°C to +6.0°C) - Orange / Amber
  {
    id: 'contour-heatwave-vidarbha-guj',
    name: 'Vidarbha, Malwa & North Gujarat Thermal Ridge',
    subdivision: 'Vidarbha, West MP & North Gujarat',
    departureRange: '+4.0°C to +6.0°C Above Normal',
    departureAvgC: 5.3,
    category: 'heatwave',
    color: '#C2410C',
    fillColor: '#EA580C',
    fillOpacity: 0.45,
    polygon: [
      [24.5, 68.8],
      [24.8, 71.5],
      [25.8, 74.5],
      [25.2, 78.5],
      [23.5, 79.8],
      [21.8, 80.5],
      [19.2, 80.2],
      [18.5, 78.8],
      [19.8, 76.2],
      [21.5, 73.5],
      [22.8, 69.8],
      [24.5, 68.8],
    ],
    synopticCause: 'Persisting high-pressure ridge and clear skies driving intense ground sensible heat flux.',
    imdAlert: 'IMD ORANGE ALERT: Heatwave Warning',
  },

  // 3. Rayalaseema & Telangana Interior Plateau Warm Zone (+4.0°C to +6.5°C) - Orange Red
  {
    id: 'contour-heatwave-rayalaseema',
    name: 'Rayalaseema & South Deccan Heat Anomaly',
    subdivision: 'Rayalaseema & South Telangana',
    departureRange: '+4.0°C to +6.5°C Above Normal',
    departureAvgC: 5.6,
    category: 'heatwave',
    color: '#C2410C',
    fillColor: '#EA580C',
    fillOpacity: 0.45,
    polygon: [
      [17.8, 77.2],
      [18.2, 79.2],
      [16.5, 79.8],
      [14.5, 79.2],
      [13.8, 77.8],
      [14.8, 76.5],
      [16.5, 76.8],
      [17.8, 77.2],
    ],
    synopticCause: 'Rain-shadow subsidence keeping relative humidity low and diurnal insolation elevated.',
    imdAlert: 'IMD ORANGE ALERT: Heatwave Advisory',
  },

  // 4. Above Normal Warm Corridor: Indo-Gangetic Plains & Central India (+1.5°C to +3.9°C) - Yellow
  {
    id: 'contour-above-normal-gangetic',
    name: 'Indo-Gangetic & Central Alluvial Warm Corridor',
    subdivision: 'Punjab, Haryana, Delhi NCR, UP & Bihar',
    departureRange: '+1.5°C to +3.9°C Above Normal',
    departureAvgC: 2.9,
    category: 'above_normal',
    color: '#D97706',
    fillColor: '#F59E0B',
    fillOpacity: 0.38,
    polygon: [
      [31.2, 74.5],
      [30.8, 77.5],
      [28.8, 80.5],
      [27.2, 84.5],
      [25.8, 87.2],
      [24.5, 85.8],
      [24.8, 81.2],
      [26.2, 78.5],
      [28.5, 76.2],
      [30.2, 74.2],
      [31.2, 74.5],
    ],
    synopticCause: 'Urban Heat Island and dry pre-monsoonal boundary layer keeping temperatures above average.',
    imdAlert: 'IMD YELLOW WATCH: Warm Daytime Conditions',
  },

  // 5. Near Normal Climatological Baseline: Peninsular Coast & Western Ghats (-1.0°C to +1.0°C) - Green
  {
    id: 'contour-near-normal-peninsula',
    name: 'South Peninsular & Western Maritime Buffer',
    subdivision: 'South Interior Karnataka, Kerala, Tamil Nadu & Konkan',
    departureRange: '-1.0°C to +1.0°C (Normal Baseline)',
    departureAvgC: 0.2,
    category: 'near_normal',
    color: '#059669',
    fillColor: '#10B981',
    fillOpacity: 0.35,
    polygon: [
      [18.5, 72.8],
      [17.2, 74.5],
      [14.2, 75.8],
      [11.8, 77.2],
      [10.2, 78.5],
      [8.2, 77.5],
      [8.5, 76.8],
      [11.5, 75.5],
      [15.2, 73.8],
      [18.5, 72.8],
    ],
    synopticCause: 'Moist marine sea breezes and vegetation transpiration maintaining temperate equilibrium.',
    imdAlert: 'Normal Climatological Temperatures',
  },

  // 6. Sub-Normal & Cyclone DANA Cloud-Shield Cooling (-3.0°C to -6.5°C) - Cyan / Deep Blue
  {
    id: 'contour-cyclone-cooling-east-coast',
    name: 'East Coast Cyclone DANA Thermal Depression Zone',
    subdivision: 'Coastal Andhra Pradesh, Odisha & Gangetic West Bengal',
    departureRange: '-3.0°C to -6.5°C Below Normal (Depressed Cooling)',
    departureAvgC: -5.6,
    category: 'depressed_cooling',
    color: '#0369A1',
    fillColor: '#0284C7',
    fillOpacity: 0.52,
    polygon: [
      [23.5, 87.5],
      [22.8, 89.2],
      [20.5, 87.8],
      [18.8, 85.5],
      [16.2, 82.8],
      [14.5, 80.8],
      [14.2, 79.8],
      [16.2, 80.2],
      [17.8, 81.8],
      [19.8, 84.2],
      [21.5, 86.8],
      [23.5, 87.5],
    ],
    synopticCause: 'Heavy continuous rain squalls and dense convective eyewall cloud shield of Cyclone DANA cutting off daytime solar insolation.',
    imdAlert: 'IMD BLUE NOTICE: Cyclone Induced Severe Thermal Depression',
  },

  // 7. Himalayan High Altitude & Western Disturbance Ridge (-3.0°C to -5.5°C) - Light Blue / Indigo
  {
    id: 'contour-himalayan-cooling',
    name: 'Western Himalayan Elevation & Snowpack Ridge',
    subdivision: 'Jammu & Kashmir, Himachal Pradesh & Uttarakhand',
    departureRange: '-3.0°C to -5.5°C Below Normal',
    departureAvgC: -4.5,
    category: 'below_normal',
    color: '#4338CA',
    fillColor: '#6366F1',
    fillOpacity: 0.45,
    polygon: [
      [35.8, 74.5],
      [35.2, 78.2],
      [32.5, 79.8],
      [30.2, 80.5],
      [29.8, 78.5],
      [31.5, 76.5],
      [33.5, 74.2],
      [35.8, 74.5],
    ],
    synopticCause: 'High elevation lapse rate and fresh moisture intrusion keeping upper valleys sub-normal.',
    imdAlert: 'Mountain Microclimate Cooling',
  },
];

export const INDIA_TEMPERATURE_ANOMALIES: TemperatureAnomalyNode[] = [
  // 1. Extreme Heatwave & Severe Positive Anomalies (+6.0°C to +8.8°C above normal)
  {
    id: 'tanom-rj-churu-01',
    name: 'Churu & Bikaner Desert Basin',
    state: 'Rajasthan',
    district: 'Churu',
    coordinates: [28.2900, 74.9600],
    recordedTempC: 44.8,
    normalTempC: 36.2,
    anomalyC: 8.6,
    anomalyType: 'extreme_heatwave',
    anomalyLabel: 'Severe Heatwave (+8.6°C Departure)',
    symbol: '🔥',
    color: '#DC2626',
    imdHeatwaveAlert: 'RED',
    alertTitle: 'IMD RED ALERT: Severe Heatwave Warning',
    surfaceType: 'Barren Sand Dune / Low Albedo Ground',
    satelliteSensor: 'ISRO INSAT-3DR TIR LST (4km)',
    observationTime: 'Today 14:00 IST (Peak Insolation)',
    description: 'Intense land surface radiation exceeding 44.8°C with acute dry westerly thermal advection.',
  },
  {
    id: 'tanom-rj-jaisalmer-02',
    name: 'Jaisalmer Western Thar Corridor',
    state: 'Rajasthan',
    district: 'Jaisalmer',
    coordinates: [26.9157, 70.9083],
    recordedTempC: 43.6,
    normalTempC: 35.8,
    anomalyC: 7.8,
    anomalyType: 'extreme_heatwave',
    anomalyLabel: 'Severe Heatwave (+7.8°C Departure)',
    symbol: '🔥',
    color: '#DC2626',
    imdHeatwaveAlert: 'RED',
    alertTitle: 'IMD RED ALERT: Severe Heatwave Warning',
    surfaceType: 'Sandy Arid Desert Plain',
    satelliteSensor: 'NASA MODIS Aqua LST (1km)',
    observationTime: 'Today 13:45 IST',
    description: 'Elevated daytime thermal radiance with extreme solar UV index.',
  },
  {
    id: 'tanom-mh-chandrapur-01',
    name: 'Chandrapur & Nagpur Thermal Belt',
    state: 'Maharashtra',
    district: 'Chandrapur',
    coordinates: [19.9615, 79.2961],
    recordedTempC: 42.5,
    normalTempC: 35.5,
    anomalyC: 7.0,
    anomalyType: 'extreme_heatwave',
    anomalyLabel: 'Severe Heatwave (+7.0°C Departure)',
    symbol: '🔥',
    color: '#DC2626',
    imdHeatwaveAlert: 'RED',
    alertTitle: 'IMD RED ALERT: Severe Heatwave Warning',
    surfaceType: 'Black Cotton Soil & Industrial Heat Flux',
    satelliteSensor: 'ISRO INSAT-3DR TIR (4km)',
    observationTime: 'Today 14:15 IST',
    description: 'High ground thermal storage in Vidarbha coal mining and agricultural basin.',
  },
  {
    id: 'tanom-ap-kurnool-01',
    name: 'Kurnool & Kadapa Semi-Arid Plateau',
    state: 'Andhra Pradesh',
    district: 'Kurnool',
    coordinates: [15.8281, 78.0373],
    recordedTempC: 41.2,
    normalTempC: 34.5,
    anomalyC: 6.7,
    anomalyType: 'extreme_heatwave',
    anomalyLabel: 'Severe Heatwave (+6.7°C Departure)',
    symbol: '🔥',
    color: '#DC2626',
    imdHeatwaveAlert: 'RED',
    alertTitle: 'IMD RED ALERT: Rayalaseema Heatwave',
    surfaceType: 'Uncultivated Rocky Red Gravel Soil',
    satelliteSensor: 'NASA MODIS Terra LST (1km)',
    observationTime: 'Today 14:00 IST',
    description: 'Severe daytime ground temperature anomaly in rain-shadow interior plateau.',
  },

  // 2. Moderate Heatwave Anomalies (+4.0°C to +5.9°C above normal)
  {
    id: 'tanom-gj-kutch-01',
    name: 'Bhuj & Kutch Salt Flat Border',
    state: 'Gujarat',
    district: 'Kutch',
    coordinates: [23.2420, 69.6669],
    recordedTempC: 40.8,
    normalTempC: 35.2,
    anomalyC: 5.6,
    anomalyType: 'heatwave',
    anomalyLabel: 'Heatwave Alert (+5.6°C Departure)',
    symbol: '🌡️',
    color: '#EA580C',
    imdHeatwaveAlert: 'ORANGE',
    alertTitle: 'IMD ORANGE ALERT: Heatwave Conditions',
    surfaceType: 'Saline Mudflats & Semi-Arid Scrub',
    satelliteSensor: 'ISRO INSAT-3DR TIR (4km)',
    observationTime: 'Today 13:30 IST',
    description: 'Strong dry thermal boundary layer off the Rann of Kutch.',
  },
  {
    id: 'tanom-ts-ramagundam-01',
    name: 'Ramagundam & Nalgonda Valley',
    state: 'Telangana',
    district: 'Peddapalli',
    coordinates: [18.7610, 79.4740],
    recordedTempC: 40.2,
    normalTempC: 35.0,
    anomalyC: 5.2,
    anomalyType: 'heatwave',
    anomalyLabel: 'Heatwave Alert (+5.2°C Departure)',
    symbol: '🌡️',
    color: '#EA580C',
    imdHeatwaveAlert: 'ORANGE',
    alertTitle: 'IMD ORANGE ALERT: Moderate Heatwave',
    surfaceType: 'Deccan Granite Basin',
    satelliteSensor: 'NASA MODIS Aqua LST (1km)',
    observationTime: 'Today 14:20 IST',
    description: 'Extended dry spell creating localized thermal stagnation.',
  },
  {
    id: 'tanom-mp-gwalior-01',
    name: 'Gwalior & Chambal Ravines',
    state: 'Madhya Pradesh',
    district: 'Gwalior',
    coordinates: [26.2183, 78.1828],
    recordedTempC: 39.5,
    normalTempC: 34.8,
    anomalyC: 4.7,
    anomalyType: 'heatwave',
    anomalyLabel: 'Heatwave Alert (+4.7°C Departure)',
    symbol: '🌡️',
    color: '#EA580C',
    imdHeatwaveAlert: 'ORANGE',
    alertTitle: 'IMD ORANGE ALERT: Heatwave Warning',
    surfaceType: 'Alluvial Ravine Soil',
    satelliteSensor: 'ISRO INSAT-3DR TIR (4km)',
    observationTime: 'Today 13:50 IST',
    description: 'High surface heating across Chambal badlands.',
  },

  // 3. Mild Above Normal (+1.5°C to +3.9°C)
  {
    id: 'tanom-dl-delhi-01',
    name: 'Delhi NCR Urban Core Heat Island',
    state: 'Delhi NCR',
    district: 'Central Delhi',
    coordinates: [28.6139, 77.2090],
    recordedTempC: 36.8,
    normalTempC: 33.5,
    anomalyC: 3.3,
    anomalyType: 'above_normal',
    anomalyLabel: 'Above Normal (+3.3°C Urban Heat)',
    symbol: '☀️',
    color: '#F59E0B',
    imdHeatwaveAlert: 'YELLOW',
    alertTitle: 'IMD YELLOW WATCH: Warm Daytime Advisory',
    surfaceType: 'Dense Concrete & Asphalt Urban Fabric',
    satelliteSensor: 'NASA MODIS LST (1km)',
    observationTime: 'Today 14:10 IST',
    description: 'Urban Heat Island (UHI) effect amplifying diurnal temperatures over capital core.',
  },
  {
    id: 'tanom-ka-ballari-01',
    name: 'Ballari Iron Ore Mining Belt',
    state: 'Karnataka',
    district: 'Ballari',
    coordinates: [15.1394, 76.9214],
    recordedTempC: 35.8,
    normalTempC: 33.0,
    anomalyC: 2.8,
    anomalyType: 'above_normal',
    anomalyLabel: 'Above Normal (+2.8°C Departure)',
    symbol: '☀️',
    color: '#F59E0B',
    imdHeatwaveAlert: 'YELLOW',
    alertTitle: 'IMD YELLOW WATCH: Mild Heat Departure',
    surfaceType: 'Mineral Rich Exposed Rock',
    satelliteSensor: 'ISRO INSAT-3DR TIR (4km)',
    observationTime: 'Today 14:05 IST',
    description: 'Clear sunny sky causing moderate ground heating.',
  },

  // 4. Near Normal (±1.0°C)
  {
    id: 'tanom-ka-blr-01',
    name: 'Bengaluru Plateau Ecosystem',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    coordinates: [12.9716, 77.5946],
    recordedTempC: 28.2,
    normalTempC: 28.0,
    anomalyC: 0.2,
    anomalyType: 'near_normal',
    anomalyLabel: 'Near Normal (+0.2°C)',
    symbol: '⛅',
    color: '#10B981',
    imdHeatwaveAlert: 'GREEN',
    alertTitle: 'Normal Seasonal Temperature',
    surfaceType: 'Highland Garden Plateau',
    satelliteSensor: 'ISRO INSAT-3DR TIR (4km)',
    observationTime: 'Today 14:00 IST',
    description: 'Temperate highland weather consistent with multi-year climatological average.',
  },
  {
    id: 'tanom-tn-chennai-01',
    name: 'Chennai Coastal Plain',
    state: 'Tamil Nadu',
    district: 'Chennai',
    coordinates: [13.0827, 80.2707],
    recordedTempC: 31.2,
    normalTempC: 31.8,
    anomalyC: -0.6,
    anomalyType: 'near_normal',
    anomalyLabel: 'Near Normal (-0.6°C)',
    symbol: '⛅',
    color: '#10B981',
    imdHeatwaveAlert: 'GREEN',
    alertTitle: 'Normal Coastal Temperature',
    surfaceType: 'Maritime Coastal Buffer',
    satelliteSensor: 'NASA MODIS Aqua (1km)',
    observationTime: 'Today 13:40 IST',
    description: 'Marine sea breeze moderating afternoon temperature.',
  },

  // 5. Negative & Depressed Cooling Anomalies (-3.0°C to -6.5°C below normal under Cyclone DANA)
  {
    id: 'tanom-ap-vskp-01',
    name: 'Visakhapatnam Cyclone Cloud Shield',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    coordinates: [17.6868, 83.2185],
    recordedTempC: 25.4,
    normalTempC: 31.2,
    anomalyC: -5.8,
    anomalyType: 'depressed_cooling',
    anomalyLabel: 'Depressed Cooling (-5.8°C Below Normal)',
    symbol: '🌧️',
    color: '#0284C7',
    imdHeatwaveAlert: 'BLUE',
    alertTitle: 'CYCLONE INDUCED THERMAL DEPRESSION',
    surfaceType: 'Inundated Wet Ground / 100% Dense Cloud Cover',
    satelliteSensor: 'ISRO INSAT-3DR TIR Cloud Top (4km)',
    observationTime: 'Today 14:15 IST (Live Cyclone Band)',
    description: 'Severe surface cooling due to thick convective cloud canopy and heavy continuous squalls of Cyclone DANA.',
  },
  {
    id: 'tanom-od-puri-01',
    name: 'Puri Coastal Cyclone Inundation Zone',
    state: 'Odisha',
    district: 'Puri',
    coordinates: [19.8135, 85.8312],
    recordedTempC: 24.8,
    normalTempC: 31.0,
    anomalyC: -6.2,
    anomalyType: 'depressed_cooling',
    anomalyLabel: 'Depressed Cooling (-6.2°C Below Normal)',
    symbol: '🌧️',
    color: '#0284C7',
    imdHeatwaveAlert: 'BLUE',
    alertTitle: 'CYCLONE INDUCED THERMAL DEPRESSION',
    surfaceType: 'Coastal Inundated Land',
    satelliteSensor: 'ISRO INSAT-3DR TIR (4km)',
    observationTime: 'Today 14:00 IST',
    description: 'Solar insolation blocked by deep spiral eyewall cloud shield of Cyclone DANA.',
  },
  {
    id: 'tanom-wb-kolkata-01',
    name: 'Kolkata Delta Rainband Cooling',
    state: 'West Bengal',
    district: 'Kolkata',
    coordinates: [22.5726, 88.3639],
    recordedTempC: 26.2,
    normalTempC: 31.5,
    anomalyC: -5.3,
    anomalyType: 'depressed_cooling',
    anomalyLabel: 'Depressed Cooling (-5.3°C Below Normal)',
    symbol: '🌧️',
    color: '#0284C7',
    imdHeatwaveAlert: 'BLUE',
    alertTitle: 'MONSOONAL DEPRESSION COOLING',
    surfaceType: 'Waterlogged Gangetic Silt',
    satelliteSensor: 'NASA MODIS Terra LST (1km)',
    observationTime: 'Today 13:55 IST',
    description: 'Heavy precipitation and evaporative cooling keeping ground temperatures depressed.',
  },
  {
    id: 'tanom-uk-shimla-01',
    name: 'Himachal & Uttarakhand High Ridge',
    state: 'Himachal Pradesh',
    district: 'Shimla',
    coordinates: [31.1048, 77.1734],
    recordedTempC: 16.5,
    normalTempC: 20.8,
    anomalyC: -4.3,
    anomalyType: 'below_normal',
    anomalyLabel: 'Below Normal (-4.3°C Mountain Cooling)',
    symbol: '❄️',
    color: '#38BDF8',
    imdHeatwaveAlert: 'BLUE',
    alertTitle: 'HIGH ALTITUDE COOLING',
    surfaceType: 'Alpine Coniferous Forest Ridge',
    satelliteSensor: 'ISRO INSAT-3DR TIR (4km)',
    observationTime: 'Today 14:20 IST',
    description: 'Fresh moisture influx and higher altitude breeze maintaining cool microclimate.',
  },
];

export const TemperatureAnomalyService = {
  /**
   * Get all regional temperature anomaly contour zones across India
   */
  getAnomalyContours(): AnomalyContourZone[] {
    return INDIA_TEMPERATURE_ANOMALY_CONTOURS;
  },

  /**
   * Get all real-time temperature anomaly stations across India
   */
  getAllAnomalies(): TemperatureAnomalyNode[] {
    return INDIA_TEMPERATURE_ANOMALIES;
  },

  /**
   * Filter anomalies by category or state
   */
  getFilteredAnomalies(categoryFilter: string = 'all', stateFilter: string = 'all'): TemperatureAnomalyNode[] {
    return INDIA_TEMPERATURE_ANOMALIES.filter((item) => {
      const matchCat =
        categoryFilter === 'all' ||
        (categoryFilter === 'heatwave' && (item.anomalyType === 'extreme_heatwave' || item.anomalyType === 'heatwave')) ||
        (categoryFilter === 'above_normal' && item.anomalyType === 'above_normal') ||
        (categoryFilter === 'near_normal' && item.anomalyType === 'near_normal') ||
        (categoryFilter === 'cooling' && (item.anomalyType === 'below_normal' || item.anomalyType === 'depressed_cooling'));

      const matchState = stateFilter === 'all' || item.state.toLowerCase() === stateFilter.toLowerCase();
      return matchCat && matchState;
    });
  },

  /**
   * Get aggregated temperature anomaly statistics for India
   */
  getNationalAnomalyStats() {
    const all = INDIA_TEMPERATURE_ANOMALIES;
    const maxPositive = Math.max(...all.map((a) => a.anomalyC));
    const maxNegative = Math.min(...all.map((a) => a.anomalyC));
    const heatwaveStations = all.filter((a) => a.imdHeatwaveAlert === 'RED' || a.imdHeatwaveAlert === 'ORANGE').length;
    const coolingStations = all.filter((a) => a.anomalyC < -2.0).length;

    return {
      maxPositiveAnomaly: `+${maxPositive.toFixed(1)}°C (West Rajasthan & Vidarbha)`,
      maxNegativeAnomaly: `${maxNegative.toFixed(1)}°C (Coastal AP & Odisha Cyclone Cloud Shield)`,
      totalStations: all.length,
      heatwaveCount: heatwaveStations,
      coolingCount: coolingStations,
      activeSatellites: 'ISRO INSAT-3DR TIR LST (4km) & NASA MODIS/VIIRS LST (1km)',
      baselineReference: 'IMD 1991-2020 Long Period Climatological Average (LPA)',
    };
  },
};
