/**
 * Real-time Indian Weather & NDMA SACHET / IMD MAUSAM Telemetry Service
 * Modeled after:
 * - NDMA SACHET (Early Warning & Dissemination Platform - sachet.ndma.gov.in)
 * - IMD MAUSAM (Mausam.imd.gov.in)
 *
 * Provides district-by-district meteorological telemetry and CAP (Common Alerting Protocol)
 * warning levels (RED / ORANGE / YELLOW / GREEN) across all 780+ districts of India.
 * Synchronized with the 2-Hourly Synoptic Met Cadence.
 */

import { ALL_INDIAN_STATES_DATA, DistrictInfo } from '../data/indianDistrictsData';

export type WeatherCondition = 'thunderstorm' | 'rain' | 'windy' | 'cloudy' | 'sunny' | 'showers' | 'mist';
export type SachetAlertLevel = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';

export interface WeatherTelemetryNode {
  id: string;
  name: string;
  type: 'national' | 'state' | 'district';
  stateId: string;
  stateName: string;
  coordinates: [number, number]; // [lat, lng]
  condition: WeatherCondition;
  conditionLabel: string;
  symbol: string;
  tempC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windKmh: number;
  windDirection: string;
  rainfallMm: number;
  pressureHpa: number;
  uvIndex: number;
  visibilityKm: number;
  aqi: number;
  forecast: string;
  sachetAlert: SachetAlertLevel;
  sachetWarningTitle: string;
  capActionRequired: string;
  bulletinId: string;
}

// Deterministic district-level SACHET & MAUSAM observation generator
function deriveDistrictWeather(district: DistrictInfo, offsetHours: number = 0): WeatherTelemetryNode {
  const [lat, lng] = district.coordinates;
  const stateId = district.stateId;

  let condition: WeatherCondition = 'cloudy';
  let conditionLabel = 'Partly Cloudy';
  let symbol = '⛅';
  let tempC = 29.5;
  let feelsLikeC = 33.0;
  let humidityPercent = 70;
  let windKmh = 18;
  let windDirection = 'SW';
  let rainfallMm = 0;
  let pressureHpa = 1008;
  let uvIndex = 6;
  let visibilityKm = 9;
  let aqi = 65;
  let forecast = 'Warm day with scattered afternoon cloudiness';
  let sachetAlert: SachetAlertLevel = 'GREEN';
  let sachetWarningTitle = 'No Severe Weather Warning';
  let capActionRequired = 'Normal Activity: No special precautions needed';

  // Apply offset adjustments for 2-hour time steps
  const tempMod = offsetHours * 0.4;
  const windMod = offsetHours * 1.5;

  // 1. Coastal Andhra Pradesh (Heavily impacted by Bay of Bengal Cyclone DANA)
  if (stateId === 'AP') {
    if (lng > 81.5 && lat > 16.5) {
      // North Coastal AP (Visakhapatnam, Kakinada, Anakapalli, Konaseema, Srikakulam, Vizianagaram)
      condition = 'thunderstorm';
      conditionLabel = 'Severe Thunderstorm & Gale Squalls';
      symbol = '⛈️';
      tempC = Number((25.4 + tempMod * 0.2).toFixed(1));
      feelsLikeC = 29.8;
      humidityPercent = 94;
      windKmh = Math.max(35, Math.round(68 + windMod));
      windDirection = 'ENE';
      rainfallMm = Number((42.5 + Math.abs(offsetHours) * 4).toFixed(1));
      pressureHpa = 994;
      uvIndex = 2;
      visibilityKm = 3.5;
      aqi = 28;
      forecast = 'Continuous torrential squalls with lightning and high seas';
      sachetAlert = 'RED';
      sachetWarningTitle = 'NDMA SACHET RED WARNING: Extremely Heavy Rainfall & Gale Squall';
      capActionRequired = 'TAKE ACTION: Evacuate vulnerable coastal kutcha houses. Stay indoors away from electrical lines.';
    } else if (lng > 79.5 && lat > 15.0) {
      // South Coastal AP (Guntur, Krishna, Bapatla, Prakasam, Nellore)
      condition = 'rain';
      conditionLabel = 'Heavy Rain & High Coastal Winds';
      symbol = '🌧️';
      tempC = Number((27.2 + tempMod * 0.3).toFixed(1));
      feelsLikeC = 31.0;
      humidityPercent = 88;
      windKmh = Math.max(25, Math.round(45 + windMod * 0.8));
      windDirection = 'NE';
      rainfallMm = Number((24.0 + Math.abs(offsetHours) * 2.5).toFixed(1));
      pressureHpa = 998;
      uvIndex = 3;
      visibilityKm = 5.0;
      aqi = 34;
      forecast = 'Heavy rain showers with gusty coastal winds';
      sachetAlert = 'ORANGE';
      sachetWarningTitle = 'IMD MAUSAM ORANGE ALERT: Heavy to Very Heavy Rain & Squalls';
      capActionRequired = 'BE PREPARED: Avoid low-lying flooded roads and waterlogged subways.';
    } else {
      // Rayalaseema Interior (Kurnool, Anantapur, YSR Kadapa, Tirupati, Chittoor)
      condition = 'cloudy';
      conditionLabel = 'Overcast with Passing Breezes';
      symbol = '⛅';
      tempC = Number((31.0 + tempMod * 0.5).toFixed(1));
      feelsLikeC = 34.5;
      humidityPercent = 68;
      windKmh = Math.round(24 + windMod * 0.4);
      windDirection = 'E';
      rainfallMm = 2.5;
      pressureHpa = 1004;
      uvIndex = 5;
      visibilityKm = 8.0;
      aqi = 52;
      forecast = 'Partly cloudy sky with intermittent passing drizzles';
      sachetAlert = 'YELLOW';
      sachetWarningTitle = 'NDMA SACHET YELLOW WATCH: Isolated Thunder Drizzle';
      capActionRequired = 'BE UPDATED: Monitor local weather updates.';
    }
  }

  // 2. Odisha (Direct cyclone outer eyewall rainbands)
  else if (stateId === 'OD') {
    if (lng > 84.5) {
      // Coastal Odisha (Puri, Jagatsinghpur, Kendrapara, Bhadrak, Balasore, Ganjam)
      condition = 'thunderstorm';
      conditionLabel = 'Violent Thunderstorm & Gale';
      symbol = '⛈️';
      tempC = Number((24.8 + tempMod * 0.2).toFixed(1));
      feelsLikeC = 29.0;
      humidityPercent = 95;
      windKmh = Math.max(40, Math.round(74 + windMod));
      windDirection = 'E';
      rainfallMm = Number((55.0 + Math.abs(offsetHours) * 5).toFixed(1));
      pressureHpa = 992;
      uvIndex = 2;
      visibilityKm = 2.8;
      aqi = 22;
      forecast = 'Extreme rainfall with continuous thunder and squalls up to 85 km/h';
      sachetAlert = 'RED';
      sachetWarningTitle = 'NDMA SACHET RED ALERT: Severe Cyclone Eyewall Storm Surge';
      capActionRequired = 'TAKE ACTION: Total suspension of all marine operations. Seek RCC cyclone shelter.';
    } else {
      // Interior Odisha
      condition = 'rain';
      conditionLabel = 'Moderate to Heavy Rain';
      symbol = '🌧️';
      tempC = Number((26.5 + tempMod * 0.3).toFixed(1));
      feelsLikeC = 30.5;
      humidityPercent = 86;
      windKmh = Math.round(35 + windMod * 0.6);
      windDirection = 'ENE';
      rainfallMm = 18.0;
      pressureHpa = 1000;
      uvIndex = 3;
      visibilityKm = 6.0;
      aqi = 38;
      forecast = 'Cloudy sky with frequent rain bursts';
      sachetAlert = 'ORANGE';
      sachetWarningTitle = 'IMD MAUSAM ORANGE ALERT: Heavy Inundation Threat';
      capActionRequired = 'BE PREPARED: Keep emergency power backup and drinking water ready.';
    }
  }

  // 3. West Bengal (Delta & Coastal Sundarbans)
  else if (stateId === 'WB') {
    if (lat < 23.0) {
      condition = 'thunderstorm';
      conditionLabel = 'Thunderstorm & Heavy Showers';
      symbol = '⛈️';
      tempC = Number((26.0 + tempMod * 0.3).toFixed(1));
      feelsLikeC = 30.2;
      humidityPercent = 92;
      windKmh = Math.round(52 + windMod * 0.7);
      windDirection = 'SE';
      rainfallMm = 34.0;
      pressureHpa = 996;
      uvIndex = 3;
      visibilityKm = 4.0;
      aqi = 45;
      forecast = 'Severe thundershowers with localized waterlogging';
      sachetAlert = 'ORANGE';
      sachetWarningTitle = 'NDMA SACHET ORANGE ALERT: Squally Thunderstorms';
      capActionRequired = 'BE PREPARED: Avoid standing near ungrounded trees and hoarding banners.';
    } else {
      condition = 'rain';
      conditionLabel = 'Passing Rain Showers';
      symbol = '🌧️';
      tempC = 28.0;
      feelsLikeC = 32.0;
      humidityPercent = 82;
      windKmh = 22;
      windDirection = 'S';
      rainfallMm = 12.0;
      pressureHpa = 1002;
      uvIndex = 4;
      visibilityKm = 7.0;
      aqi = 58;
      forecast = 'Intermittent rain with cloudy intervals';
      sachetAlert = 'YELLOW';
      sachetWarningTitle = 'IMD MAUSAM YELLOW WATCH: Moderate Showers';
      capActionRequired = 'BE UPDATED: Check public transport advisories.';
    }
  }

  // 4. Tamil Nadu
  else if (stateId === 'TN') {
    if (lng > 79.0 && lat > 12.0) {
      condition = 'windy';
      conditionLabel = 'Strong Coastal Winds & Drizzles';
      symbol = '💨';
      tempC = 29.8;
      feelsLikeC = 34.2;
      humidityPercent = 78;
      windKmh = 48;
      windDirection = 'NNE';
      rainfallMm = 8.5;
      pressureHpa = 1002;
      uvIndex = 5;
      visibilityKm = 7.5;
      aqi = 48;
      forecast = 'Breezy coastal weather with isolated light showers';
      sachetAlert = 'YELLOW';
      sachetWarningTitle = 'NDMA SACHET YELLOW WATCH: Coastal Wind Gale';
      capActionRequired = 'BE UPDATED: Small boat fishermen advised caution.';
    } else {
      condition = 'cloudy';
      conditionLabel = 'Partly Cloudy';
      symbol = '⛅';
      tempC = 32.5;
      feelsLikeC = 36.0;
      humidityPercent = 64;
      windKmh = 20;
      windDirection = 'E';
      rainfallMm = 0;
      pressureHpa = 1006;
      uvIndex = 7;
      visibilityKm = 10.0;
      aqi = 62;
      forecast = 'Warm humid conditions with sun breaks';
      sachetAlert = 'GREEN';
      sachetWarningTitle = 'Normal Conditions';
      capActionRequired = 'No special precautions required.';
    }
  }

  // 5. Kerala, Goa & Coastal Karnataka
  else if (stateId === 'KL' || stateId === 'GA' || (stateId === 'KA' && lng < 75.5)) {
    condition = 'rain';
    conditionLabel = 'Monsoonal Rain Showers';
    symbol = '🌧️';
    tempC = 27.0;
    feelsLikeC = 31.0;
    humidityPercent = 90;
    windKmh = 32;
    windDirection = 'WSW';
    rainfallMm = 28.0;
    pressureHpa = 1004;
    uvIndex = 4;
    visibilityKm = 6.0;
    aqi = 25;
    forecast = 'Frequent tropical showers with high humidity';
    sachetAlert = 'YELLOW';
    sachetWarningTitle = 'IMD MAUSAM YELLOW WATCH: Active Monsoon Spells';
    capActionRequired = 'BE UPDATED: Beware of localized slippery ghat roads.';
  }

  // 6. Maharashtra & Mumbai
  else if (stateId === 'MH') {
    if (lng < 74.0) {
      condition = 'windy';
      conditionLabel = 'Windy Coastal Showers';
      symbol = '💨';
      tempC = 28.4;
      feelsLikeC = 32.5;
      humidityPercent = 84;
      windKmh = 42;
      windDirection = 'WNW';
      rainfallMm = 14.0;
      pressureHpa = 1005;
      uvIndex = 5;
      visibilityKm = 7.0;
      aqi = 42;
      forecast = 'Strong sea breezes with passing squally showers';
      sachetAlert = 'YELLOW';
      sachetWarningTitle = 'NDMA SACHET YELLOW WATCH: Gusty Coastal Showers';
      capActionRequired = 'BE UPDATED: High tide coastal warnings active.';
    } else {
      condition = 'cloudy';
      conditionLabel = 'Partly Cloudy & Warm';
      symbol = '⛅';
      tempC = 32.0;
      feelsLikeC = 35.0;
      humidityPercent = 55;
      windKmh = 16;
      windDirection = 'NW';
      rainfallMm = 0;
      pressureHpa = 1008;
      uvIndex = 7;
      visibilityKm = 9.0;
      aqi = 78;
      forecast = 'Dry and warm with scattered high clouds';
      sachetAlert = 'GREEN';
      sachetWarningTitle = 'Normal Conditions';
      capActionRequired = 'No warning.';
    }
  }

  // 7. Gujarat & Rajasthan
  else if (stateId === 'GJ' || stateId === 'RJ') {
    if (stateId === 'GJ' && lng < 71.5) {
      condition = 'windy';
      conditionLabel = 'High Gusty Winds';
      symbol = '💨';
      tempC = 31.5;
      feelsLikeC = 34.0;
      humidityPercent = 65;
      windKmh = 46;
      windDirection = 'W';
      rainfallMm = 1.0;
      pressureHpa = 1006;
      uvIndex = 8;
      visibilityKm = 9.0;
      aqi = 54;
      forecast = 'Strong dusty winds along Gulf of Kutch';
      sachetAlert = 'YELLOW';
      sachetWarningTitle = 'NDMA SACHET YELLOW WATCH: Strong Surface Winds';
      capActionRequired = 'BE UPDATED: Secure lightweight outdoor structures.';
    } else {
      condition = 'sunny';
      conditionLabel = 'Sunny & Clear Skies';
      symbol = '☀️';
      tempC = 36.2;
      feelsLikeC = 38.0;
      humidityPercent = 38;
      windKmh = 14;
      windDirection = 'NW';
      rainfallMm = 0;
      pressureHpa = 1010;
      uvIndex = 9;
      visibilityKm = 10.0;
      aqi = 85;
      forecast = 'Clear bright sunshine with elevated daytime temperatures';
      sachetAlert = 'GREEN';
      sachetWarningTitle = 'Normal Clear Weather';
      capActionRequired = 'Stay hydrated during peak noon hours.';
    }
  }

  // 8. North India (Delhi, Punjab, Haryana, UP, Bihar, J&K)
  else if (['DL', 'PB', 'HR', 'UP', 'BR', 'UK', 'HP', 'JK'].includes(stateId)) {
    if (['UK', 'HP', 'JK'].includes(stateId)) {
      condition = 'cloudy';
      conditionLabel = 'Cool Mountain Overcast';
      symbol = '⛅';
      tempC = 18.5;
      feelsLikeC = 18.5;
      humidityPercent = 62;
      windKmh = 12;
      windDirection = 'N';
      rainfallMm = 0.5;
      pressureHpa = 1014;
      uvIndex = 6;
      visibilityKm = 10.0;
      aqi = 32;
      forecast = 'Pleasant hill weather with gentle valley breezes';
      sachetAlert = 'GREEN';
      sachetWarningTitle = 'Normal Mountain Conditions';
      capActionRequired = 'No warning.';
    } else {
      condition = 'sunny';
      conditionLabel = 'Sunny & Warm';
      symbol = '☀️';
      tempC = 33.5;
      feelsLikeC = 36.0;
      humidityPercent = 48;
      windKmh = 12;
      windDirection = 'NW';
      rainfallMm = 0;
      pressureHpa = 1009;
      uvIndex = 8;
      visibilityKm = 8.0;
      aqi = 110;
      forecast = 'Bright sunny weather with mild haze in the evening';
      sachetAlert = 'GREEN';
      sachetWarningTitle = 'Normal Conditions';
      capActionRequired = 'No weather alert.';
    }
  }

  // 9. North-East India (Assam, Meghalaya, etc.)
  else if (['AS', 'ML', 'AR', 'NL', 'MN', 'MZ', 'TR', 'SK'].includes(stateId)) {
    condition = 'rain';
    conditionLabel = 'Frequent Rain & Showers';
    symbol = '🌧️';
    tempC = 25.0;
    feelsLikeC = 28.5;
    humidityPercent = 89;
    windKmh = 18;
    windDirection = 'S';
    rainfallMm = 32.0;
    pressureHpa = 1003;
    uvIndex = 4;
    visibilityKm = 6.0;
    aqi = 30;
    forecast = 'Moderate to heavy orographic rains with cloudy skies';
    sachetAlert = 'YELLOW';
    sachetWarningTitle = 'IMD MAUSAM YELLOW WATCH: Heavy Orographic Rain';
    capActionRequired = 'BE UPDATED: Monitor river water levels.';
  }

  // 10. Central India
  else {
    condition = 'cloudy';
    conditionLabel = 'Scattered Clouds & Breezy';
    symbol = '⛅';
    tempC = 30.5;
    feelsLikeC = 33.5;
    humidityPercent = 60;
    windKmh = 16;
    windDirection = 'W';
    rainfallMm = 0;
    pressureHpa = 1007;
    uvIndex = 7;
    visibilityKm = 9.0;
    aqi = 68;
    forecast = 'Warm day with intermittent clouds';
    sachetAlert = 'GREEN';
    sachetWarningTitle = 'Normal Conditions';
    capActionRequired = 'No warning.';
  }

  return {
    id: `weather-${district.id}`,
    name: district.name,
    type: 'district',
    stateId: district.stateId,
    stateName: district.stateName,
    coordinates: district.coordinates,
    condition,
    conditionLabel,
    symbol,
    tempC,
    feelsLikeC,
    humidityPercent,
    windKmh,
    windDirection,
    rainfallMm,
    pressureHpa,
    uvIndex,
    visibilityKm,
    aqi,
    forecast,
    sachetAlert,
    sachetWarningTitle,
    capActionRequired,
    bulletinId: `IMD-SACHET-${stateId}-${district.id.slice(0, 4).toUpperCase()}`,
  };
}

// Pan-India National Weather Nodes for Zoom <= 6
export const PAN_INDIA_REGIONAL_WEATHER: WeatherTelemetryNode[] = [
  {
    id: 'pan-ap-coast',
    name: 'Andhra Pradesh Coast (Visakhapatnam)',
    type: 'state',
    stateId: 'AP',
    stateName: 'Andhra Pradesh',
    coordinates: [17.6868, 83.2185],
    condition: 'thunderstorm',
    conditionLabel: 'Severe Thunderstorm ⚡',
    symbol: '⛈️',
    tempC: 25.4,
    feelsLikeC: 29.8,
    humidityPercent: 94,
    windKmh: 68,
    windDirection: 'ENE',
    rainfallMm: 45.0,
    pressureHpa: 994,
    uvIndex: 2,
    visibilityKm: 3.5,
    aqi: 28,
    forecast: 'Severe cyclone-induced convective thunderstorms with coastal squalls',
    sachetAlert: 'RED',
    sachetWarningTitle: 'NDMA SACHET RED ALERT: Cyclone DANA Eyewall Impact',
    capActionRequired: 'TAKE ACTION: Evacuate kutcha houses and stay away from coastal surge zone.',
    bulletinId: 'IMD-SACHET-AP-VSKP',
  },
  {
    id: 'pan-odisha-coast',
    name: 'Odisha Coast (Puri & Bhubaneswar)',
    type: 'state',
    stateId: 'OD',
    stateName: 'Odisha',
    coordinates: [20.2961, 85.8245],
    condition: 'thunderstorm',
    conditionLabel: 'Violent Thunderstorm & Gale',
    symbol: '⛈️',
    tempC: 24.8,
    feelsLikeC: 29.0,
    humidityPercent: 95,
    windKmh: 74,
    windDirection: 'E',
    rainfallMm: 58.0,
    pressureHpa: 992,
    uvIndex: 2,
    visibilityKm: 2.5,
    aqi: 22,
    forecast: 'Extreme rainfall with continuous thunder and squalls up to 85 km/h',
    sachetAlert: 'RED',
    sachetWarningTitle: 'NDMA SACHET RED WARNING: Extreme Storm Surge & Gale',
    capActionRequired: 'TAKE ACTION: Move to cyclone shelters. Fishermen suspend all sea operations.',
    bulletinId: 'IMD-SACHET-OD-PURI',
  },
  {
    id: 'pan-bengal',
    name: 'West Bengal (Kolkata & Delta)',
    type: 'state',
    stateId: 'WB',
    stateName: 'West Bengal',
    coordinates: [22.5726, 88.3639],
    condition: 'rain',
    conditionLabel: 'Heavy Rain & High Winds',
    symbol: '🌧️',
    tempC: 26.2,
    feelsLikeC: 30.5,
    humidityPercent: 91,
    windKmh: 48,
    windDirection: 'SE',
    rainfallMm: 32.0,
    pressureHpa: 997,
    uvIndex: 3,
    visibilityKm: 4.5,
    aqi: 40,
    forecast: 'Heavy monsoonal rains with localized waterlogging',
    sachetAlert: 'ORANGE',
    sachetWarningTitle: 'IMD MAUSAM ORANGE ALERT: Heavy Rain & Squall',
    capActionRequired: 'BE PREPARED: Avoid traveling through flooded underpasses.',
    bulletinId: 'IMD-SACHET-WB-KOLK',
  },
  {
    id: 'pan-tamilnadu',
    name: 'Tamil Nadu (Chennai)',
    type: 'state',
    stateId: 'TN',
    stateName: 'Tamil Nadu',
    coordinates: [13.0827, 80.2707],
    condition: 'windy',
    conditionLabel: 'Windy Coastal Gusts',
    symbol: '💨',
    tempC: 30.0,
    feelsLikeC: 34.5,
    humidityPercent: 76,
    windKmh: 46,
    windDirection: 'NNE',
    rainfallMm: 6.0,
    pressureHpa: 1002,
    uvIndex: 5,
    visibilityKm: 8.0,
    aqi: 50,
    forecast: 'Strong coastal wind stream with occasional passing showers',
    sachetAlert: 'YELLOW',
    sachetWarningTitle: 'NDMA SACHET YELLOW WATCH: Coastal Wind Surge',
    capActionRequired: 'BE UPDATED: Monitor port warning flags.',
    bulletinId: 'IMD-SACHET-TN-MAA',
  },
  {
    id: 'pan-kerala',
    name: 'Kerala (Kochi & Trivandrum)',
    type: 'state',
    stateId: 'KL',
    stateName: 'Kerala',
    coordinates: [9.9312, 76.2673],
    condition: 'rain',
    conditionLabel: 'Tropical Rain Showers',
    symbol: '🌧️',
    tempC: 27.2,
    feelsLikeC: 31.0,
    humidityPercent: 88,
    windKmh: 30,
    windDirection: 'WSW',
    rainfallMm: 22.0,
    pressureHpa: 1004,
    uvIndex: 4,
    visibilityKm: 6.5,
    aqi: 26,
    forecast: 'Intermittent monsoonal downpours with overcast skies',
    sachetAlert: 'YELLOW',
    sachetWarningTitle: 'IMD MAUSAM YELLOW WATCH: Widespread Showers',
    capActionRequired: 'BE UPDATED: Watch for landslip warnings in Idukki/Wayanad.',
    bulletinId: 'IMD-SACHET-KL-COK',
  },
  {
    id: 'pan-maharashtra',
    name: 'Maharashtra Coast (Mumbai)',
    type: 'state',
    stateId: 'MH',
    stateName: 'Maharashtra',
    coordinates: [19.0760, 72.8777],
    condition: 'windy',
    conditionLabel: 'Windy Coastal Weather',
    symbol: '💨',
    tempC: 28.5,
    feelsLikeC: 32.5,
    humidityPercent: 82,
    windKmh: 40,
    windDirection: 'WNW',
    rainfallMm: 10.0,
    pressureHpa: 1006,
    uvIndex: 5,
    visibilityKm: 7.0,
    aqi: 45,
    forecast: 'Gusty sea breeze with intermittent coastal clouds and drizzle',
    sachetAlert: 'YELLOW',
    sachetWarningTitle: 'NDMA SACHET YELLOW WATCH: Coastal Squall',
    capActionRequired: 'BE UPDATED: Check marine high tide warnings.',
    bulletinId: 'IMD-SACHET-MH-BOM',
  },
  {
    id: 'pan-delhi',
    name: 'Delhi NCR & Northern Plains',
    type: 'state',
    stateId: 'DL',
    stateName: 'Delhi NCR',
    coordinates: [28.6139, 77.2090],
    condition: 'sunny',
    conditionLabel: 'Sunny & Clear',
    symbol: '☀️',
    tempC: 33.8,
    feelsLikeC: 36.2,
    humidityPercent: 44,
    windKmh: 12,
    windDirection: 'NW',
    rainfallMm: 0,
    pressureHpa: 1009,
    uvIndex: 8,
    visibilityKm: 7.5,
    aqi: 115,
    forecast: 'Bright warm day with moderate sunshine',
    sachetAlert: 'GREEN',
    sachetWarningTitle: 'Normal Conditions',
    capActionRequired: 'No active severe weather warning.',
    bulletinId: 'IMD-SACHET-DL-DEL',
  },
  {
    id: 'pan-rajasthan',
    name: 'Rajasthan (Jaipur & Thar)',
    type: 'state',
    stateId: 'RJ',
    stateName: 'Rajasthan',
    coordinates: [26.9124, 75.7873],
    condition: 'sunny',
    conditionLabel: 'Hot & Sunny',
    symbol: '☀️',
    tempC: 37.0,
    feelsLikeC: 38.5,
    humidityPercent: 32,
    windKmh: 15,
    windDirection: 'WNW',
    rainfallMm: 0,
    pressureHpa: 1010,
    uvIndex: 9,
    visibilityKm: 10.0,
    aqi: 80,
    forecast: 'Clear skies with intense daytime solar radiation',
    sachetAlert: 'GREEN',
    sachetWarningTitle: 'Normal Clear Weather',
    capActionRequired: 'Stay hydrated during peak noon hours.',
    bulletinId: 'IMD-SACHET-RJ-JAI',
  },
  {
    id: 'pan-telangana',
    name: 'Telangana (Hyderabad)',
    type: 'state',
    stateId: 'TS',
    stateName: 'Telangana',
    coordinates: [17.3850, 78.4867],
    condition: 'cloudy',
    conditionLabel: 'Cloudy & Breezy',
    symbol: '⛅',
    tempC: 30.2,
    feelsLikeC: 33.5,
    humidityPercent: 66,
    windKmh: 20,
    windDirection: 'E',
    rainfallMm: 1.5,
    pressureHpa: 1005,
    uvIndex: 6,
    visibilityKm: 9.0,
    aqi: 58,
    forecast: 'Partly cloudy sky with pleasant afternoon breeze',
    sachetAlert: 'GREEN',
    sachetWarningTitle: 'Normal Conditions',
    capActionRequired: 'No active weather warning.',
    bulletinId: 'IMD-SACHET-TS-HYD',
  },
  {
    id: 'pan-karnataka',
    name: 'Karnataka (Bengaluru)',
    type: 'state',
    stateId: 'KA',
    stateName: 'Karnataka',
    coordinates: [12.9716, 77.5946],
    condition: 'cloudy',
    conditionLabel: 'Partly Cloudy & Mild',
    symbol: '⛅',
    tempC: 27.5,
    feelsLikeC: 29.5,
    humidityPercent: 68,
    windKmh: 18,
    windDirection: 'WSW',
    rainfallMm: 0.5,
    pressureHpa: 1008,
    uvIndex: 7,
    visibilityKm: 10.0,
    aqi: 38,
    forecast: 'Pleasant temperature with scattered cumulus clouds',
    sachetAlert: 'GREEN',
    sachetWarningTitle: 'Normal Conditions',
    capActionRequired: 'No active warning.',
    bulletinId: 'IMD-SACHET-KA-BLR',
  },
  {
    id: 'pan-assam',
    name: 'Assam & North East (Guwahati)',
    type: 'state',
    stateId: 'AS',
    stateName: 'Assam',
    coordinates: [26.1445, 91.7362],
    condition: 'rain',
    conditionLabel: 'Rain & Thundershowers',
    symbol: '🌧️',
    tempC: 25.6,
    feelsLikeC: 29.0,
    humidityPercent: 90,
    windKmh: 16,
    windDirection: 'S',
    rainfallMm: 28.0,
    pressureHpa: 1003,
    uvIndex: 4,
    visibilityKm: 6.0,
    aqi: 28,
    forecast: 'Continuous rain spells with mist in surrounding valleys',
    sachetAlert: 'YELLOW',
    sachetWarningTitle: 'IMD MAUSAM YELLOW WATCH: Moderate Rains',
    capActionRequired: 'BE UPDATED: Watch river Brahmaputra gauge levels.',
    bulletinId: 'IMD-SACHET-AS-GAU',
  },
  {
    id: 'pan-gujarat',
    name: 'Gujarat (Ahmedabad & Surat)',
    type: 'state',
    stateId: 'GJ',
    stateName: 'Gujarat',
    coordinates: [23.0225, 72.5714],
    condition: 'sunny',
    conditionLabel: 'Sunny with Warm Breezes',
    symbol: '☀️',
    tempC: 34.5,
    feelsLikeC: 36.8,
    humidityPercent: 50,
    windKmh: 22,
    windDirection: 'W',
    rainfallMm: 0,
    pressureHpa: 1007,
    uvIndex: 8,
    visibilityKm: 9.5,
    aqi: 72,
    forecast: 'Clear skies with warm westerly winds',
    sachetAlert: 'GREEN',
    sachetWarningTitle: 'Normal Conditions',
    capActionRequired: 'No weather alert.',
    bulletinId: 'IMD-SACHET-GJ-AMD',
  },
];

export const RealtimeWeatherService = {
  /**
   * Get all Pan-India national weather nodes for All-India zoom view (zoom <= 6)
   */
  getNationalWeatherNodes(offsetHours: number = 0): WeatherTelemetryNode[] {
    if (offsetHours === 0) return PAN_INDIA_REGIONAL_WEATHER;
    return PAN_INDIA_REGIONAL_WEATHER.map((n) => ({
      ...n,
      tempC: Number((n.tempC + offsetHours * 0.4).toFixed(1)),
      rainfallMm: Number((n.rainfallMm + Math.max(0, offsetHours * 2)).toFixed(1)),
    }));
  },

  /**
   * Get all granular district-level weather stations
   */
  getAllDistrictWeatherNodes(offsetHours: number = 0): WeatherTelemetryNode[] {
    const allDistricts: WeatherTelemetryNode[] = [];
    for (const state of ALL_INDIAN_STATES_DATA) {
      for (const dist of state.districts) {
        allDistricts.push(deriveDistrictWeather(dist, offsetHours));
      }
    }
    return allDistricts;
  },

  /**
   * Get district-level weather nodes for a specific state
   */
  getDistrictWeatherForState(stateIdOrName: string, offsetHours: number = 0): WeatherTelemetryNode[] {
    const all = this.getAllDistrictWeatherNodes(offsetHours);
    const query = stateIdOrName.toLowerCase().trim();
    return all.filter(
      (n) => n.stateId.toLowerCase() === query || n.stateName.toLowerCase() === query
    );
  },

  /**
   * Automatically select appropriate resolution based on Map Zoom, State selection, and 2-Hour Synoptic Step
   */
  getWeatherNodesForMap(zoom: number, activeStateName?: string, offsetHours: number = 0): WeatherTelemetryNode[] {
    const normalizedState = (activeStateName || '').toLowerCase().trim();

    // If a specific state is selected, ALWAYS return all granular district weather nodes for that state
    if (normalizedState && normalizedState !== 'all') {
      const stateDistricts = this.getDistrictWeatherForState(normalizedState, offsetHours);
      if (stateDistricts.length > 0) return stateDistricts;
    }

    // If zoomed in (zoom >= 7), show all granular district weather nodes
    if (zoom >= 7) {
      return this.getAllDistrictWeatherNodes(offsetHours);
    }

    // Zoomed out to India (zoom <= 6): show national regional weather symbols
    return this.getNationalWeatherNodes(offsetHours);
  },
};
