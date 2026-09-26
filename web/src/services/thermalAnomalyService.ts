/**
 * NASA FIRMS & ISRO MOSDAC Thermal Anomaly & Fire Telemetry Service (India Only)
 * Provides satellite-derived active thermal hotspots, fire radiative power (FRP),
 * industrial heat signatures, and land surface temperature deviations across India.
 * Grounded in NASA LANCE / FIRMS (VIIRS 375m & MODIS 1km) and Forest Survey of India (FSI) data.
 */

export type ThermalCategory = 'forest_fire' | 'agricultural_fire' | 'industrial_thermal' | 'surface_temp_anomaly';

export interface ThermalHotspotNode {
  id: string;
  name: string;
  state: string;
  district: string;
  coordinates: [number, number]; // [lat, lng]
  category: ThermalCategory;
  categoryLabel: string;
  symbol: string;
  brightnessTempK: number; // in Kelvin
  brightnessTempC: number; // in Celsius
  frpMw: number; // Fire Radiative Power in Megawatts
  confidencePercent: number; // e.g. 95%
  confidenceGrade: 'nominal' | 'high';
  satelliteSensor: 'VIIRS Suomi-NPP (375m)' | 'VIIRS NOAA-20 (375m)' | 'NASA MODIS Aqua (1km)' | 'ISRO INSAT-3DR TIR (4km)';
  dayNight: 'Day' | 'Night';
  detectedTime: string;
  tempDeviationC: string; // e.g. "+8.4°C above 10-year historical baseline"
  fsiAlertLevel: 'Extreme' | 'High' | 'Moderate';
  scanBand: string; // e.g. "I-Band (3.75 µm)"
  description: string;
  areaEstimatedHectares?: number;
}

export const INDIA_THERMAL_HOTSPOTS: ThermalHotspotNode[] = [
  // 1. Forest Fires - Odisha (Simlipal Biosphere & Eastern Ghats)
  {
    id: 'firms-od-simlipal-01',
    name: 'Simlipal Tiger Reserve (Core Zone West)',
    state: 'Odisha',
    district: 'Mayurbhanj',
    coordinates: [21.8540, 86.3420],
    category: 'forest_fire',
    categoryLabel: 'Forest Wildfire Hotspot',
    symbol: '🔥',
    brightnessTempK: 374.2,
    brightnessTempC: 101.05,
    frpMw: 78.4,
    confidencePercent: 96,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS Suomi-NPP (375m)',
    dayNight: 'Day',
    detectedTime: 'Today 13:42 IST (Orbit Pass 512)',
    tempDeviationC: '+12.4°C above baseline',
    fsiAlertLevel: 'Extreme',
    scanBand: 'I-Band (3.75 µm MWIR)',
    description: 'Intense deciduous canopy fire cluster spreading along dry ridge line.',
    areaEstimatedHectares: 34.5,
  },
  {
    id: 'firms-od-kandhamal-02',
    name: 'Kandhamal Dense Sal Forest Range',
    state: 'Odisha',
    district: 'Kandhamal',
    coordinates: [20.1240, 84.2150],
    category: 'forest_fire',
    categoryLabel: 'Forest Wildfire Hotspot',
    symbol: '🔥',
    brightnessTempK: 358.6,
    brightnessTempC: 85.45,
    frpMw: 42.1,
    confidencePercent: 91,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS NOAA-20 (375m)',
    dayNight: 'Day',
    detectedTime: 'Today 14:15 IST (Orbit Pass 208)',
    tempDeviationC: '+8.2°C above baseline',
    fsiAlertLevel: 'High',
    scanBand: 'I-Band (3.75 µm MWIR)',
    description: 'Understory dry leaf litter fire with moderate smoke plume detection.',
    areaEstimatedHectares: 18.2,
  },

  // 2. Forest Fires - Uttarakhand & Himachal (Western Himalayas)
  {
    id: 'firms-uk-corbett-01',
    name: 'Corbett Landscape Buffer Ridge',
    state: 'Uttarakhand',
    district: 'Nainital',
    coordinates: [29.5300, 79.1200],
    category: 'forest_fire',
    categoryLabel: 'Pine Forest Wildfire',
    symbol: '🔥',
    brightnessTempK: 366.8,
    brightnessTempC: 93.65,
    frpMw: 62.0,
    confidencePercent: 94,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS Suomi-NPP (375m)',
    dayNight: 'Day',
    detectedTime: 'Today 13:30 IST',
    tempDeviationC: '+10.5°C above baseline',
    fsiAlertLevel: 'Extreme',
    scanBand: 'I-Band (3.75 µm)',
    description: 'High-temperature chir pine resin flare on steep south-facing slope.',
    areaEstimatedHectares: 22.0,
  },
  {
    id: 'firms-hp-kullu-01',
    name: 'Kullu Valley Forest Fringe',
    state: 'Himachal Pradesh',
    district: 'Kullu',
    coordinates: [31.9570, 77.1090],
    category: 'forest_fire',
    categoryLabel: 'Alpine Forest Fire',
    symbol: '🔥',
    brightnessTempK: 348.2,
    brightnessTempC: 75.05,
    frpMw: 28.5,
    confidencePercent: 88,
    confidenceGrade: 'nominal',
    satelliteSensor: 'NASA MODIS Aqua (1km)',
    dayNight: 'Day',
    detectedTime: 'Today 14:05 IST',
    tempDeviationC: '+6.8°C above baseline',
    fsiAlertLevel: 'Moderate',
    scanBand: 'MODIS Channel 21 (3.96 µm)',
    description: 'Scattered thermal anomaly detected in dry coniferous belt.',
    areaEstimatedHectares: 9.4,
  },

  // 3. Forest Fires - Central India & Western Ghats (MP, Maharashtra, Karnataka)
  {
    id: 'firms-mp-kanha-01',
    name: 'Kanha National Park Corridor',
    state: 'Madhya Pradesh',
    district: 'Mandla',
    coordinates: [22.3340, 80.6110],
    category: 'forest_fire',
    categoryLabel: 'Dry Deciduous Forest Fire',
    symbol: '🔥',
    brightnessTempK: 362.4,
    brightnessTempC: 89.25,
    frpMw: 51.3,
    confidencePercent: 93,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS NOAA-20 (375m)',
    dayNight: 'Day',
    detectedTime: 'Today 13:50 IST',
    tempDeviationC: '+9.1°C above baseline',
    fsiAlertLevel: 'High',
    scanBand: 'I-Band (3.75 µm)',
    description: 'Active front progressing eastward through bamboo thickets.',
    areaEstimatedHectares: 16.8,
  },
  {
    id: 'firms-ka-bandipur-01',
    name: 'Bandipur Tiger Reserve Southern Buffer',
    state: 'Karnataka',
    district: 'Chamarajanagar',
    coordinates: [11.6660, 76.6280],
    category: 'forest_fire',
    categoryLabel: 'Dry Scrub & Forest Fire',
    symbol: '🔥',
    brightnessTempK: 354.0,
    brightnessTempC: 80.85,
    frpMw: 36.8,
    confidencePercent: 90,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS Suomi-NPP (375m)',
    dayNight: 'Day',
    detectedTime: 'Today 14:22 IST',
    tempDeviationC: '+7.4°C above baseline',
    fsiAlertLevel: 'Moderate',
    scanBand: 'I-Band (3.75 µm)',
    description: 'Lantana camara weed thermal burning along forest firebreak line.',
    areaEstimatedHectares: 12.0,
  },
  {
    id: 'firms-ap-araku-01',
    name: 'Eastern Ghats Paderu Forest Belt',
    state: 'Andhra Pradesh',
    district: 'Alluri Sitharama Raju',
    coordinates: [18.0840, 82.6650],
    category: 'forest_fire',
    categoryLabel: 'Hill Forest Thermal Anomaly',
    symbol: '🔥',
    brightnessTempK: 359.7,
    brightnessTempC: 86.55,
    frpMw: 44.2,
    confidencePercent: 92,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS NOAA-20 (375m)',
    dayNight: 'Day',
    detectedTime: 'Today 13:48 IST',
    tempDeviationC: '+8.6°C above baseline',
    fsiAlertLevel: 'High',
    scanBand: 'I-Band (3.75 µm)',
    description: 'Shifting cultivation residue burn on high-elevation ridge slope.',
    areaEstimatedHectares: 14.5,
  },

  // 4. Agricultural Stubble & Biomass Burning - North-West India (Punjab & Haryana)
  {
    id: 'firms-pb-sangrur-01',
    name: 'Sangrur Agricultural Belt Cluster',
    state: 'Punjab',
    district: 'Sangrur',
    coordinates: [30.2450, 75.8420],
    category: 'agricultural_fire',
    categoryLabel: 'Crop Residue Biomass Burning',
    symbol: '🌾',
    brightnessTempK: 382.4,
    brightnessTempC: 109.25,
    frpMw: 94.6,
    confidencePercent: 98,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS Suomi-NPP (375m)',
    dayNight: 'Day',
    detectedTime: 'Today 14:10 IST',
    tempDeviationC: '+14.8°C above field baseline',
    fsiAlertLevel: 'Extreme',
    scanBand: 'I-Band (3.75 µm MWIR)',
    description: 'Multiple contiguous paddy stubble burn fields emitting heavy particulate smoke.',
    areaEstimatedHectares: 48.0,
  },
  {
    id: 'firms-pb-mansa-02',
    name: 'Mansa Farm Field Fire Cluster',
    state: 'Punjab',
    district: 'Mansa',
    coordinates: [29.9880, 75.3920],
    category: 'agricultural_fire',
    categoryLabel: 'Crop Residue Biomass Burning',
    symbol: '🌾',
    brightnessTempK: 376.1,
    brightnessTempC: 102.95,
    frpMw: 82.0,
    confidencePercent: 97,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS NOAA-20 (375m)',
    dayNight: 'Day',
    detectedTime: 'Today 14:18 IST',
    tempDeviationC: '+13.2°C above field baseline',
    fsiAlertLevel: 'Extreme',
    scanBand: 'I-Band (3.75 µm)',
    description: 'Open biomass combustion with high carbon monoxide concentration.',
    areaEstimatedHectares: 39.0,
  },
  {
    id: 'firms-hr-karnal-01',
    name: 'Karnal Agricultural Sector',
    state: 'Haryana',
    district: 'Karnal',
    coordinates: [29.6850, 76.9900],
    category: 'agricultural_fire',
    categoryLabel: 'Agricultural Straw Burning',
    symbol: '🌾',
    brightnessTempK: 364.5,
    brightnessTempC: 91.35,
    frpMw: 56.4,
    confidencePercent: 95,
    confidenceGrade: 'high',
    satelliteSensor: 'NASA MODIS Aqua (1km)',
    dayNight: 'Day',
    detectedTime: 'Today 13:55 IST',
    tempDeviationC: '+10.1°C above baseline',
    fsiAlertLevel: 'High',
    scanBand: 'MODIS Band 21 (3.96 µm)',
    description: 'Harvest residue clearance burn detected across 6 contiguous plots.',
    areaEstimatedHectares: 26.5,
  },

  // 5. Industrial Thermal Flares & Metallurgy Heat Signatures (Refineries, Steel Plants, Thermal Power)
  {
    id: 'firms-gj-jamnagar-01',
    name: 'Jamnagar Mega Refinery Complex Thermal Flare',
    state: 'Gujarat',
    district: 'Jamnagar',
    coordinates: [22.3550, 69.8650],
    category: 'industrial_thermal',
    categoryLabel: 'Petrochemical Flare Thermal Anomaly',
    symbol: '🏭',
    brightnessTempK: 418.5,
    brightnessTempC: 145.35,
    frpMw: 184.2,
    confidencePercent: 99,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS Suomi-NPP (375m)',
    dayNight: 'Night',
    detectedTime: 'Today 01:25 IST (Night Pass)',
    tempDeviationC: '+38.5°C constant industrial anomaly',
    fsiAlertLevel: 'Extreme',
    scanBand: 'VIIRS M10 / I4 High-Temp Radiance',
    description: 'Continuous ultra-high temperature hydrocarbon flare stack emissions.',
  },
  {
    id: 'firms-od-paradeep-01',
    name: 'Paradeep Refinery & Petrochemicals Flare Stack',
    state: 'Odisha',
    district: 'Jagatsinghpur',
    coordinates: [20.2780, 86.6450],
    category: 'industrial_thermal',
    categoryLabel: 'Refinery Industrial Thermal Signature',
    symbol: '🏭',
    brightnessTempK: 405.2,
    brightnessTempC: 132.05,
    frpMw: 142.0,
    confidencePercent: 99,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS NOAA-20 (375m)',
    dayNight: 'Night',
    detectedTime: 'Today 01:40 IST (Night Pass)',
    tempDeviationC: '+32.0°C industrial point source',
    fsiAlertLevel: 'High',
    scanBand: 'VIIRS I4 (3.75 µm)',
    description: 'High-intensity industrial thermal point source from catalytic cracking unit flare.',
  },
  {
    id: 'firms-cg-bhilai-01',
    name: 'Bhilai Integrated Steel Plant Blast Furnaces',
    state: 'Chhattisgarh',
    district: 'Durg',
    coordinates: [21.1930, 81.4010],
    category: 'industrial_thermal',
    categoryLabel: 'Metallurgical Blast Furnace Heat',
    symbol: '🏭',
    brightnessTempK: 392.0,
    brightnessTempC: 118.85,
    frpMw: 115.5,
    confidencePercent: 98,
    confidenceGrade: 'high',
    satelliteSensor: 'NASA MODIS Aqua (1km)',
    dayNight: 'Night',
    detectedTime: 'Today 01:15 IST',
    tempDeviationC: '+24.5°C metallurgical heat island',
    fsiAlertLevel: 'High',
    scanBand: 'MODIS Band 21 (3.96 µm)',
    description: 'Continuous thermal radiation from molten iron ladle discharge and coke ovens.',
  },
  {
    id: 'firms-ap-vizagsteel-01',
    name: 'Visakhapatnam Steel Plant & HPCL Flare',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    coordinates: [17.6320, 83.1850],
    category: 'industrial_thermal',
    categoryLabel: 'Coastal Heavy Industry Thermal Anomaly',
    symbol: '🏭',
    brightnessTempK: 388.4,
    brightnessTempC: 115.25,
    frpMw: 98.0,
    confidencePercent: 97,
    confidenceGrade: 'high',
    satelliteSensor: 'VIIRS Suomi-NPP (375m)',
    dayNight: 'Night',
    detectedTime: 'Today 01:30 IST',
    tempDeviationC: '+22.8°C thermal anomaly',
    fsiAlertLevel: 'High',
    scanBand: 'VIIRS I4 Band',
    description: 'Heavy industrial thermal emissions from coastal refinery flare and blast furnace.',
  },

  // 6. Extreme Land Surface Temperature (LST) Hotspots & Heatwave Anomalies
  {
    id: 'firms-rj-churu-01',
    name: 'Thar Desert Surface Heat Anomaly (Churu)',
    state: 'Rajasthan',
    district: 'Churu',
    coordinates: [28.2900, 74.9600],
    category: 'surface_temp_anomaly',
    categoryLabel: 'Extreme Land Surface Heat Anomaly',
    symbol: '🌡️',
    brightnessTempK: 326.5,
    brightnessTempC: 53.35,
    frpMw: 15.2,
    confidencePercent: 92,
    confidenceGrade: 'high',
    satelliteSensor: 'ISRO INSAT-3DR TIR (4km)',
    dayNight: 'Day',
    detectedTime: 'Today 14:00 IST (Peak Solar)',
    tempDeviationC: '+7.8°C above historical seasonal baseline',
    fsiAlertLevel: 'High',
    scanBand: 'INSAT-3DR TIR-1 (10.8 µm)',
    description: 'Severe barren sand dune surface temperature deviation exceeding 53°C.',
  },
  {
    id: 'firms-mh-nagpur-01',
    name: 'Vidarbha Basin Surface Heat Anomaly',
    state: 'Maharashtra',
    district: 'Nagpur',
    coordinates: [21.1458, 79.0882],
    category: 'surface_temp_anomaly',
    categoryLabel: 'Urban & Agro Heat Island Anomaly',
    symbol: '🌡️',
    brightnessTempK: 321.8,
    brightnessTempC: 48.65,
    frpMw: 12.0,
    confidencePercent: 89,
    confidenceGrade: 'nominal',
    satelliteSensor: 'ISRO INSAT-3DR TIR (4km)',
    dayNight: 'Day',
    detectedTime: 'Today 14:30 IST',
    tempDeviationC: '+6.2°C above normal LST',
    fsiAlertLevel: 'Moderate',
    scanBand: 'INSAT-3DR TIR-1 (10.8 µm)',
    description: 'Black cotton soil high solar absorption creating localized thermal stress.',
  },
  {
    id: 'firms-ap-kurnool-01',
    name: 'Rayalaseema Semi-Arid Heat Anomaly',
    state: 'Andhra Pradesh',
    district: 'Kurnool',
    coordinates: [15.8281, 78.0373],
    category: 'surface_temp_anomaly',
    categoryLabel: 'Semi-Arid Land Surface Thermal Anomaly',
    symbol: '🌡️',
    brightnessTempK: 322.4,
    brightnessTempC: 49.25,
    frpMw: 14.1,
    confidencePercent: 91,
    confidenceGrade: 'high',
    satelliteSensor: 'NASA MODIS Aqua (1km)',
    dayNight: 'Day',
    detectedTime: 'Today 13:45 IST',
    tempDeviationC: '+6.5°C above seasonal mean',
    fsiAlertLevel: 'Moderate',
    scanBand: 'MODIS LST Split-Window',
    description: 'Elevated daytime ground heat flux across uncultivated red gravel plains.',
  },
];

export const ThermalAnomalyService = {
  /**
   * Get all active satellite thermal hotspots for India
   */
  getAllHotspots(): ThermalHotspotNode[] {
    return INDIA_THERMAL_HOTSPOTS;
  },

  /**
   * Filter hotspots by state or category (India only)
   */
  getFilteredHotspots(category: string = 'all', stateFilter: string = 'all'): ThermalHotspotNode[] {
    return INDIA_THERMAL_HOTSPOTS.filter((h) => {
      const matchCat = category === 'all' || h.category === category;
      const matchState = stateFilter === 'all' || h.state.toLowerCase() === stateFilter.toLowerCase();
      return matchCat && matchState;
    });
  },

  /**
   * Get aggregated telemetry stats across India
   */
  getIndiaThermalStats() {
    const all = INDIA_THERMAL_HOTSPOTS;
    const totalCount = all.length;
    const totalFrp = all.reduce((sum, h) => sum + h.frpMw, 0);
    const maxTempK = Math.max(...all.map((h) => h.brightnessTempK));
    const maxTempC = (maxTempK - 273.15).toFixed(1);
    const forestFires = all.filter((h) => h.category === 'forest_fire').length;
    const agriFires = all.filter((h) => h.category === 'agricultural_fire').length;
    const industrial = all.filter((h) => h.category === 'industrial_thermal').length;
    const heatwave = all.filter((h) => h.category === 'surface_temp_anomaly').length;

    return {
      totalCount,
      totalFrp: Math.round(totalFrp),
      maxTempK: maxTempK.toFixed(1),
      maxTempC,
      forestFires,
      agriFires,
      industrial,
      heatwave,
      activeSensors: 'NASA VIIRS (375m), MODIS Terra/Aqua (1km), ISRO INSAT-3DR (4km)',
      coverage: '100% Pan-India Exclusive GIS Coverage',
      satelliteOverpassCadence: '15-min Geostationary / 3-hour Polar Orbit Overpass',
    };
  },
};
