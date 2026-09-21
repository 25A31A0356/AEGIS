export type WeatherRiskLevel = 'low' | 'moderate' | 'warning' | 'high' | 'critical';

export interface WeatherTelemetry {
  cityName: string;
  stateName: string;
  country: string;
  coordinates: [number, number];
  updatedAt: string;
  condition: string;
  conditionCode: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'heavy_rain' | 'thunderstorm' | 'fog' | 'heatwave' | 'cyclonic';
  temp: number; // Celsius
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: string; // 'NE', 'SW', etc.
  windGust: number;
  rainProbability: number; // %
  rainfallExpectedMm: number;
  airQualityIndex: number; // AQI
  airQualityStatus: 'Good' | 'Moderate' | 'Unhealthy' | 'Severe' | 'Hazardous';
  uvIndex: number; // 0-12
  uvStatus: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  barometricPressureHpa: number;
  visibilityKm: number;
  dewPointCelsius: number;
  cloudCoverPercent: number;
  solarRadiationWm2: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyForecastItem {
  time: string;
  label: string;
  temp: number;
  rainProb: number;
  windSpeed: number;
  condition: string;
  conditionCode: string;
  hazardRisk: WeatherRiskLevel;
}

export interface DailyForecastItem {
  day: string;
  date: string;
  tempMin: number;
  tempMax: number;
  rainProb: number;
  rainfallMm: number;
  condition: string;
  conditionCode: string;
  primaryRisk: string;
  riskSeverity: WeatherRiskLevel;
}

export interface MultiHazardRiskEntry {
  hazardType: string;
  category: string;
  confidencePercent: number;
  riskLevel: WeatherRiskLevel;
  timeframe: string;
  summary: string;
  affectedDistricts: string[];
}
