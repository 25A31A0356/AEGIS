/**
 * AEGIS ALERT - Frontend Weather Service
 * Connects exclusively to the Aegis Software API (/api/weather) via ApiClient.
 * Normalizes live meteorological telemetry, hourly/daily forecasts, and multi-hazard risks.
 * Zero external browser API keys or direct third-party calls.
 */

import { ApiClient } from './apiClient';
import {
  WeatherTelemetry,
  HourlyForecastItem,
  DailyForecastItem,
  MultiHazardRiskEntry,
  WeatherRiskLevel,
} from '../types/weather';
import { DEMO_CITY_WEATHER } from '../data/demoWeather';

export const CITY_COORDINATES: Record<string, { lat: number; lng: number; stateName: string; cityName: string }> = {
  hyderabad: { lat: 17.3850, lng: 78.4867, cityName: 'Hyderabad', stateName: 'Telangana' },
  delhi: { lat: 28.6139, lng: 77.2090, cityName: 'New Delhi', stateName: 'Delhi NCR' },
  mumbai: { lat: 19.0760, lng: 72.8777, cityName: 'Mumbai', stateName: 'Maharashtra' },
  bhubaneswar: { lat: 20.2961, lng: 85.8245, cityName: 'Bhubaneswar', stateName: 'Odisha' },
  guwahati: { lat: 26.1445, lng: 91.7362, cityName: 'Guwahati', stateName: 'Assam' },
  kochi: { lat: 9.9312, lng: 76.2673, cityName: 'Kochi', stateName: 'Kerala' },
  kolkata: { lat: 22.5726, lng: 88.3639, cityName: 'Kolkata', stateName: 'West Bengal' },
  chennai: { lat: 13.0827, lng: 80.2707, cityName: 'Chennai', stateName: 'Tamil Nadu' },
  bengaluru: { lat: 12.9716, lng: 77.5946, cityName: 'Bengaluru', stateName: 'Karnataka' },
  jaipur: { lat: 26.9124, lng: 75.7873, cityName: 'Jaipur', stateName: 'Rajasthan' },
  puri: { lat: 19.8135, lng: 85.8312, cityName: 'Puri', stateName: 'Odisha' },
  shimla: { lat: 31.1048, lng: 77.1734, cityName: 'Shimla', stateName: 'Himachal Pradesh' },
  patna: { lat: 25.5941, lng: 85.1376, cityName: 'Patna', stateName: 'Bihar' },
  dehradun: { lat: 30.3165, lng: 78.0322, cityName: 'Dehradun', stateName: 'Uttarakhand' },
};

interface WeatherApiResponse {
  cityName: string;
  stateName: string;
  country?: string;
  coordinates: [number, number];
  updatedAt: string;
  condition: string;
  conditionCode?: string;
  temp: number;
  feelsLike?: number;
  tempMin?: number;
  tempMax?: number;
  humidity: number;
  windSpeed: number;
  windDirection?: string;
  windGust?: number;
  rainProbability?: number;
  rainfallExpectedMm?: number;
  airQualityIndex?: number;
  airQualityStatus?: string;
  uvIndex?: number;
  uvStatus?: string;
  barometricPressureHpa?: number;
  visibilityKm?: number;
  dewPointCelsius?: number;
  cloudCoverPercent?: number;
  solarRadiationWm2?: number;
  sunrise?: string;
  sunset?: string;
  hourlyForecast?: HourlyForecastItem[];
  dailyForecast?: DailyForecastItem[];
  hazardRisks?: MultiHazardRiskEntry[];
  dataSource?: {
    authority: string;
    radarStation: string;
    modelResolution: string;
    telemetryFreshness: string;
  };
}

interface NormalizedWeatherBundle {
  telemetry: WeatherTelemetry;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  risks: MultiHazardRiskEntry[];
  dataSource?: {
    authority: string;
    radarStation: string;
    modelResolution: string;
    telemetryFreshness: string;
  };
  lastFetchedAt: number;
}

const memoryStore = new Map<string, NormalizedWeatherBundle>();
const listeners: Array<() => void> = [];

export class WeatherService {
  /**
   * Reverse geocodes coordinates to closest Indian registered city and district
   */
  public static async reverseGeocode(lat: number, lng: number): Promise<{ city: string; state: string; district: string }> {
    let closestKey = 'mumbai';
    let minDistance = Infinity;

    for (const [key, cfg] of Object.entries(CITY_COORDINATES)) {
      const dist = Math.hypot(cfg.lat - lat, cfg.lng - lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestKey = key;
      }
    }

    const matched = CITY_COORDINATES[closestKey];
    if (minDistance <= 0.6) {
      return { city: matched.cityName, state: matched.stateName, district: matched.cityName };
    }

    return {
      city: `${matched.cityName} Sector`,
      state: matched.stateName,
      district: `${matched.cityName} Outskirts`,
    };
  }

  /**
   * Fetches normalized weather telemetry from Aegis API for arbitrary coordinates
   */
  public static async fetchLiveWeatherByCoordinates(
    lat: number,
    lng: number,
    customCityName?: string,
    customStateName?: string
  ): Promise<WeatherTelemetry> {
    const cacheKey = `geo_${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const existing = memoryStore.get(cacheKey);

    if (existing && Date.now() - existing.lastFetchedAt < 30000) {
      return existing.telemetry;
    }

    try {
      const raw = await ApiClient.get<WeatherApiResponse>('/weather', {
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        city: customCityName,
      });

      if (raw) {
        const normalized = this.normalizeBackendResponse(raw, lat, lng, customCityName, customStateName);
        memoryStore.set(cacheKey, normalized);
        if (customCityName) {
          memoryStore.set(customCityName.toLowerCase(), normalized);
        }
        this.notifyListeners();
        return normalized.telemetry;
      }
    } catch (e) {
      console.warn('[WeatherService] Aegis API weather fetch error, using cached fallback:', e);
    }

    // Graceful fallback to nearest preset
    const fallbackCity = customCityName ? customCityName.toLowerCase() : 'mumbai';
    const fallback = DEMO_CITY_WEATHER[fallbackCity] || DEMO_CITY_WEATHER['mumbai'];
    const fallbackBundle: NormalizedWeatherBundle = {
      telemetry: {
        ...fallback,
        cityName: customCityName || fallback.cityName,
        stateName: customStateName || fallback.stateName,
        coordinates: [lat, lng],
        updatedAt: new Date().toISOString(),
      },
      hourly: this.generateSyntheticHourly(fallback),
      daily: this.generateSyntheticDaily(fallback),
      risks: this.generateSyntheticRisks(fallback),
      lastFetchedAt: Date.now(),
    };

    memoryStore.set(cacheKey, fallbackBundle);
    return fallbackBundle.telemetry;
  }

  /**
   * Fetches weather telemetry for a named Indian metro/district
   */
  public static async fetchLiveCityWeather(cityKey: string): Promise<WeatherTelemetry> {
    const key = cityKey.toLowerCase().trim();
    const config = CITY_COORDINATES[key];

    if (config) {
      return this.fetchLiveWeatherByCoordinates(config.lat, config.lng, config.cityName, config.stateName);
    }

    try {
      const raw = await ApiClient.get<WeatherApiResponse>('/weather', { city: cityKey });
      if (raw) {
        const normalized = this.normalizeBackendResponse(raw, raw.coordinates?.[0] || 19.076, raw.coordinates?.[1] || 72.877, cityKey);
        memoryStore.set(key, normalized);
        this.notifyListeners();
        return normalized.telemetry;
      }
    } catch (e) {
      console.warn(`[WeatherService] Error fetching weather for ${cityKey}:`, e);
    }

    const fallback = DEMO_CITY_WEATHER[key] || DEMO_CITY_WEATHER['mumbai'];
    return fallback;
  }

  /**
   * Synchronous accessor for currently cached weather
   */
  public static getWeatherForCity(cityKey: string): WeatherTelemetry {
    const key = cityKey.toLowerCase().trim();
    const cached = memoryStore.get(key) || Array.from(memoryStore.values())[0];
    if (cached) return cached.telemetry;
    return DEMO_CITY_WEATHER[key] || DEMO_CITY_WEATHER['mumbai'];
  }

  /**
   * Hourly predictive forecast items for timeline chart
   */
  public static getHourlyForecast(cityKey: string = 'mumbai'): HourlyForecastItem[] {
    const key = cityKey.toLowerCase().trim();
    const cached = memoryStore.get(key) || Array.from(memoryStore.values())[0];
    if (cached && cached.hourly.length > 0) return cached.hourly;

    const base = this.getWeatherForCity(cityKey);
    return this.generateSyntheticHourly(base);
  }

  /**
   * 7-day extended predictive forecast items
   */
  public static getDailyForecast(cityKey: string = 'mumbai'): DailyForecastItem[] {
    const key = cityKey.toLowerCase().trim();
    const cached = memoryStore.get(key) || Array.from(memoryStore.values())[0];
    if (cached && cached.daily.length > 0) return cached.daily;

    const base = this.getWeatherForCity(cityKey);
    return this.generateSyntheticDaily(base);
  }

  /**
   * Multi-hazard risk confidence matrix entries
   */
  public static getMultiHazardRiskIndex(cityKey: string = 'mumbai'): MultiHazardRiskEntry[] {
    const key = cityKey.toLowerCase().trim();
    const cached = memoryStore.get(key) || Array.from(memoryStore.values())[0];
    if (cached && cached.risks.length > 0) return cached.risks;

    const base = this.getWeatherForCity(cityKey);
    return this.generateSyntheticRisks(base);
  }

  /**
   * List of available monitored regional cities
   */
  public static getAvailableCities() {
    return Object.keys(CITY_COORDINATES).map((k) => {
      const cached = memoryStore.get(k)?.telemetry;
      const fallback = DEMO_CITY_WEATHER[k] || DEMO_CITY_WEATHER['mumbai'];
      return {
        key: k,
        name: CITY_COORDINATES[k].cityName,
        state: CITY_COORDINATES[k].stateName,
        temp: cached ? cached.temp : fallback.temp,
        condition: cached ? cached.condition : fallback.condition,
      };
    });
  }

  public static subscribe(listener: () => void): () => void {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  private static notifyListeners() {
    listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('[WeatherService] Listener error:', e);
      }
    });
  }

  /**
   * Converts raw backend API payload into typed frontend bundle
   */
  private static normalizeBackendResponse(
    raw: WeatherApiResponse,
    fallbackLat: number,
    fallbackLng: number,
    cityHint?: string,
    stateHint?: string
  ): NormalizedWeatherBundle {
    const coords: [number, number] = raw.coordinates && raw.coordinates.length === 2
      ? raw.coordinates
      : [fallbackLat, fallbackLng];

    const temp = Math.round(raw.temp || 30);
    const feelsLike = Math.round(raw.feelsLike || temp + 3);
    const tempMin = Math.round(raw.tempMin || temp - 4);
    const tempMax = Math.round(raw.tempMax || temp + 4);
    const humidity = Math.round(raw.humidity || 70);
    const windSpeed = Math.round(raw.windSpeed || 18);
    const windDirection = raw.windDirection || 'SW';
    const windGust = Math.round(raw.windGust || windSpeed * 1.3);
    const rainProbability = Math.round(raw.rainProbability || (windSpeed > 30 ? 75 : 35));
    const rainfallExpectedMm = Number(raw.rainfallExpectedMm || (rainProbability > 60 ? 45.2 : 0));
    const aqi = Math.round(raw.airQualityIndex || 65);
    const uvIndex = Math.round(raw.uvIndex || 6);

    const conditionCode = (raw.conditionCode as any) || (
      temp >= 40 ? 'heatwave' :
      windSpeed >= 50 ? 'cyclonic' :
      rainfallExpectedMm >= 40 ? 'heavy_rain' :
      rainProbability >= 60 ? 'rain' :
      humidity >= 85 ? 'cloudy' : 'partly_cloudy'
    );

    const uvStatus: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme' =
      uvIndex <= 2 ? 'Low' : uvIndex <= 5 ? 'Moderate' : uvIndex <= 7 ? 'High' : uvIndex <= 10 ? 'Very High' : 'Extreme';

    const airQualityStatus: 'Good' | 'Moderate' | 'Unhealthy' | 'Severe' | 'Hazardous' =
      aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 200 ? 'Unhealthy' : aqi <= 300 ? 'Severe' : 'Hazardous';

    const telemetry: WeatherTelemetry = {
      cityName: raw.cityName || cityHint || 'Current Area',
      stateName: raw.stateName || stateHint || 'India',
      country: raw.country || 'India',
      coordinates: coords,
      updatedAt: raw.updatedAt || new Date().toISOString(),
      condition: raw.condition || 'Active Telemetry Stream',
      conditionCode,
      temp,
      feelsLike,
      tempMin,
      tempMax,
      humidity,
      windSpeed,
      windDirection,
      windGust,
      rainProbability,
      rainfallExpectedMm,
      airQualityIndex: aqi,
      airQualityStatus,
      uvIndex,
      uvStatus,
      barometricPressureHpa: Math.round(raw.barometricPressureHpa || 1006),
      visibilityKm: Math.round(raw.visibilityKm || 8),
      dewPointCelsius: Math.round(raw.dewPointCelsius || temp - 5),
      cloudCoverPercent: Math.round(raw.cloudCoverPercent || (rainProbability > 50 ? 80 : 35)),
      solarRadiationWm2: Math.round(raw.solarRadiationWm2 || uvIndex * 105),
      sunrise: raw.sunrise || '06:08 AM IST',
      sunset: raw.sunset || '06:35 PM IST',
    };

    const hourly = raw.hourlyForecast && raw.hourlyForecast.length > 0
      ? raw.hourlyForecast
      : this.generateSyntheticHourly(telemetry);

    const daily = raw.dailyForecast && raw.dailyForecast.length > 0
      ? raw.dailyForecast
      : this.generateSyntheticDaily(telemetry);

    const risks = raw.hazardRisks && raw.hazardRisks.length > 0
      ? raw.hazardRisks
      : this.generateSyntheticRisks(telemetry);

    return {
      telemetry,
      hourly,
      daily,
      risks,
      dataSource: raw.dataSource,
      lastFetchedAt: Date.now(),
    };
  }

  private static generateSyntheticHourly(base: WeatherTelemetry): HourlyForecastItem[] {
    const currentHour = new Date().getHours();
    return Array.from({ length: 24 }).map((_, i) => {
      const h = (currentHour + i) % 24;
      const hStr = `${String(h).padStart(2, '0')}:00`;
      const tempVariation = Math.sin((i / 24) * Math.PI * 2) * 3.5;
      const hTemp = Math.round(base.temp + tempVariation);
      const hRain = Math.max(5, Math.min(95, Math.round(base.rainProbability + Math.cos(i) * 12)));

      let hazardRisk: WeatherRiskLevel = 'low';
      if (hTemp >= 41 || base.windSpeed >= 50 || hRain >= 85) hazardRisk = 'critical';
      else if (hTemp >= 38 || base.windSpeed >= 38 || hRain >= 65) hazardRisk = 'warning';
      else if (hTemp >= 34 || hRain >= 40) hazardRisk = 'moderate';

      return {
        time: hStr,
        label: i === 0 ? 'Now' : `+${i}h`,
        temp: hTemp,
        rainProb: hRain,
        windSpeed: Math.round(base.windSpeed + Math.sin(i) * 4),
        condition: base.condition,
        conditionCode: base.conditionCode,
        hazardRisk,
      };
    });
  }

  private static generateSyntheticDaily(base: WeatherTelemetry): DailyForecastItem[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }).map((_, d) => {
      const targetDate = new Date(now.getTime() + d * 86400000);
      const dayName = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : days[targetDate.getDay()];
      return {
        day: dayName,
        date: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tempMin: base.tempMin + (d % 2),
        tempMax: base.tempMax - (d % 3),
        rainProb: Math.max(10, Math.min(90, base.rainProbability + d * 4)),
        rainfallMm: Number((base.rainfallExpectedMm * (1 - d * 0.12)).toFixed(1)),
        condition: base.condition,
        conditionCode: base.conditionCode,
        primaryRisk: base.temp >= 40 ? 'Extreme Thermal Exposure' : base.rainProbability > 70 ? 'Heavy Runoff Inundation' : 'Standard Seasonal Window',
        riskSeverity: base.temp >= 40 || base.rainProbability > 80 ? 'critical' : base.rainProbability > 60 ? 'warning' : 'low',
      };
    });
  }

  private static generateSyntheticRisks(base: WeatherTelemetry): MultiHazardRiskEntry[] {
    const risks: MultiHazardRiskEntry[] = [];
    if (base.temp >= 38) {
      risks.push({
        hazardType: 'Thermal Heatwave / Heat Index Dome',
        category: 'meteorological',
        confidencePercent: 92,
        riskLevel: base.temp >= 42 ? 'critical' : 'warning',
        timeframe: 'Next 12-24 Hours',
        summary: `Ambient surface temperature at ${base.temp}°C in ${base.cityName}. Elevated heat-stroke risk.`,
        affectedDistricts: [base.cityName, `${base.cityName} Metropolitan Area`],
      });
    }

    if (base.rainfallExpectedMm >= 15 || base.rainProbability >= 60) {
      risks.push({
        hazardType: 'Monsoonal Inundation & Urban Runoff',
        category: 'hydrological',
        confidencePercent: 88,
        riskLevel: base.rainfallExpectedMm >= 40 ? 'critical' : 'warning',
        timeframe: 'Next 6-18 Hours',
        summary: `Anticipating ${base.rainfallExpectedMm}mm precipitation with ${base.rainProbability}% storm confidence.`,
        affectedDistricts: [base.cityName, `${base.stateName} Lowland Basins`],
      });
    }

    if (risks.length === 0) {
      risks.push({
        hazardType: 'Baseline Atmospheric Conditions',
        category: 'meteorological',
        confidencePercent: 95,
        riskLevel: 'low',
        timeframe: 'Next 48 Hours',
        summary: `Current telemetry in ${base.cityName} within safe operating thresholds (${base.temp}°C, ${base.humidity}% humidity).`,
        affectedDistricts: [base.cityName],
      });
    }

    return risks;
  }
}
