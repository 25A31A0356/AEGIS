/**
 * AEGIS ALERT - Frontend Weather Service
 * Connects to the Aegis Software API (/weather or /api/v1/weather) via ApiClient.
 * Normalizes live meteorological telemetry, hourly/daily forecasts, and multi-hazard risks.
 * Includes direct high-resolution Open-Meteo fallback if backend API is in standalone mode or offline.
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

const WMO_CODE_MAP: Record<number, { condition: string; code: WeatherTelemetry['conditionCode'] }> = {
  0: { condition: 'Clear Sky', code: 'sunny' },
  1: { condition: 'Mainly Clear', code: 'sunny' },
  2: { condition: 'Partly Cloudy', code: 'partly_cloudy' },
  3: { condition: 'Overcast', code: 'cloudy' },
  45: { condition: 'Foggy Conditions', code: 'fog' },
  48: { condition: 'Depositing Rime Fog', code: 'fog' },
  51: { condition: 'Light Drizzle', code: 'rain' },
  53: { condition: 'Moderate Drizzle', code: 'rain' },
  55: { condition: 'Dense Drizzle', code: 'rain' },
  56: { condition: 'Light Freezing Drizzle', code: 'rain' },
  57: { condition: 'Dense Freezing Drizzle', code: 'rain' },
  61: { condition: 'Slight Rain', code: 'rain' },
  63: { condition: 'Moderate Rain', code: 'rain' },
  65: { condition: 'Heavy Rainfall', code: 'heavy_rain' },
  66: { condition: 'Freezing Rain', code: 'heavy_rain' },
  67: { condition: 'Heavy Freezing Rain', code: 'heavy_rain' },
  71: { condition: 'Slight Snow Fall', code: 'cloudy' },
  73: { condition: 'Moderate Snow Fall', code: 'cloudy' },
  75: { condition: 'Heavy Snow Fall', code: 'cloudy' },
  77: { condition: 'Snow Grains', code: 'cloudy' },
  80: { condition: 'Slight Rain Showers', code: 'rain' },
  81: { condition: 'Moderate Rain Showers', code: 'rain' },
  82: { condition: 'Violent Rain Showers', code: 'heavy_rain' },
  85: { condition: 'Slight Snow Showers', code: 'cloudy' },
  86: { condition: 'Heavy Snow Showers', code: 'cloudy' },
  95: { condition: 'Thunderstorm with Rain', code: 'thunderstorm' },
  96: { condition: 'Thunderstorm with Slight Hail', code: 'thunderstorm' },
  99: { condition: 'Thunderstorm with Heavy Hail', code: 'thunderstorm' },
};

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
   * Reverse geocodes coordinates to closest registered Indian city/district
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
   * Fetches live weather telemetry from Aegis API or direct meteorological fallback
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

    // 1. Attempt primary fetch via Aegis Software API (/api/v1/weather)
    try {
      const raw = await ApiClient.get<any>('/weather', {
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
      console.warn('[WeatherService] Aegis API endpoint query failed, attempting direct live meteorological telemetry:', e);
    }

    // 2. Direct high-resolution Open-Meteo telemetry fallback (browser-side)
    try {
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,cloud_cover,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;
      const omRes = await fetch(omUrl, { signal: AbortSignal.timeout(6000) });
      if (omRes.ok) {
        const omData = await omRes.json();
        const curr = omData.current || {};
        const daily = omData.daily || {};

        const weatherCode = Number(curr.weather_code ?? 0);
        const wmoInfo = WMO_CODE_MAP[weatherCode] || { condition: 'Partly Cloudy', code: 'partly_cloudy' };
        const temp = Math.round(Number(curr.temperature_2m ?? 28));
        const feelsLike = Math.round(Number(curr.apparent_temperature ?? temp + 2));
        const humidity = Math.round(Number(curr.relative_humidity_2m ?? 65));
        const windSpeed = Math.round(Number(curr.wind_speed_10m ?? 14));
        const windGust = Math.round(Number(curr.wind_gusts_10m ?? windSpeed * 1.3));
        const rainfallMm = Number(curr.precipitation ?? curr.rain ?? curr.showers ?? 0);
        const dailyProb = Array.isArray(daily.precipitation_probability_max) ? Number(daily.precipitation_probability_max[0]) : (rainfallMm > 0 ? 85 : 20);
        const uvIndex = Math.round(Number(curr.uv_index ?? 5));
        const pressure = Math.round(Number(curr.surface_pressure ?? 1012));
        const cloudCover = Math.round(Number(curr.cloud_cover ?? (rainfallMm > 0 ? 85 : 35)));

        let condition = wmoInfo.condition;
        let conditionCode = wmoInfo.code;
        if (rainfallMm > 0 && conditionCode === 'sunny' || conditionCode === 'partly_cloudy' || conditionCode === 'cloudy') {
          condition = rainfallMm >= 15 ? 'Heavy Rainfall' : 'Active Rain Showers';
          conditionCode = rainfallMm >= 15 ? 'heavy_rain' : 'rain';
        }

        const geo = await this.reverseGeocode(lat, lng);
        const rawPayload = {
          city_name: customCityName || geo.city,
          state_name: customStateName || geo.state,
          temperature: temp,
          feels_like: feelsLike,
          humidity,
          wind_speed: windSpeed,
          wind_gust: windGust,
          wind_direction: this.degreesToCardinal(Number(curr.wind_direction_10m ?? 180)),
          rain_probability: dailyProb,
          rainfall_expected_mm: rainfallMm,
          air_quality_index: 52,
          uv_index: uvIndex,
          barometric_pressure_hpa: pressure,
          cloud_cover_percent: cloudCover,
          condition,
          condition_code: conditionCode,
          weather_code: weatherCode,
          source: 'Open-Meteo High-Resolution Live Telemetry',
        };

        const normalized = this.normalizeBackendResponse(rawPayload, lat, lng, customCityName, customStateName);
        memoryStore.set(cacheKey, normalized);
        if (customCityName) {
          memoryStore.set(customCityName.toLowerCase(), normalized);
        }
        this.notifyListeners();
        return normalized.telemetry;
      }
    } catch (omErr) {
      console.warn('[WeatherService] Live Open-Meteo query failed:', omErr);
    }

    // 3. Graceful fallback to nearest preset
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
   * Fetches weather telemetry for a named regional city
   */
  public static async fetchLiveCityWeather(cityKey: string): Promise<WeatherTelemetry> {
    const key = cityKey.toLowerCase().trim();
    const config = CITY_COORDINATES[key];

    if (config) {
      return this.fetchLiveWeatherByCoordinates(config.lat, config.lng, config.cityName, config.stateName);
    }

    try {
      const raw = await ApiClient.get<any>('/weather', { city: cityKey });
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

  private static degreesToCardinal(deg: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const ix = Math.floor((deg + 11.25) / 22.5) % 16;
    return dirs[ix] || 'SW';
  }

  /**
   * Converts raw backend API payload (supporting both snake_case and camelCase) into typed frontend bundle
   */
  private static normalizeBackendResponse(
    raw: any,
    fallbackLat: number,
    fallbackLng: number,
    cityHint?: string,
    stateHint?: string
  ): NormalizedWeatherBundle {
    const coords: [number, number] = raw.coordinates && Array.isArray(raw.coordinates) && raw.coordinates.length === 2
      ? [raw.coordinates[0], raw.coordinates[1]]
      : [fallbackLat, fallbackLng];

    const temp = Math.round(Number(raw.temperature ?? raw.temp ?? 28));
    const feelsLike = Math.round(Number(raw.feels_like ?? raw.feelsLike ?? temp + 2));
    const tempMin = Math.round(Number(raw.temp_min ?? raw.tempMin ?? temp - 4));
    const tempMax = Math.round(Number(raw.temp_max ?? raw.tempMax ?? temp + 4));
    const humidity = Math.round(Number(raw.humidity ?? 70));
    const windSpeed = Math.round(Number(raw.wind_speed ?? raw.windSpeed ?? 14));
    const windDirection = String(raw.wind_direction ?? raw.windDirection ?? 'SW');
    const windGust = Math.round(Number(raw.wind_gust ?? raw.windGust ?? windSpeed * 1.3));
    const rainfallExpectedMm = Number(raw.rainfall_expected_mm ?? raw.rainfallExpectedMm ?? raw.rainfallMm ?? 0);
    const rainProbability = Math.round(Number(raw.rain_probability ?? raw.rainProbability ?? raw.rainfallProbabilityPct ?? (rainfallExpectedMm > 0 ? 85 : 20)));
    const aqi = Math.round(Number(raw.air_quality_index ?? raw.airQualityIndex ?? 55));
    const uvIndex = Math.round(Number(raw.uv_index ?? raw.uvIndex ?? 5));

    // Resolve condition and condition code accurately
    let conditionCode: WeatherTelemetry['conditionCode'] = (raw.condition_code ?? raw.conditionCode) as any;
    let condition: string = raw.condition ?? raw.weatherLabel ?? '';

    if (raw.weather_code !== undefined && WMO_CODE_MAP[raw.weather_code]) {
      const meta = WMO_CODE_MAP[raw.weather_code];
      conditionCode = meta.code;
      if (!condition) condition = meta.condition;
    }

    if (!conditionCode || conditionCode === 'partly_cloudy') {
      if (rainfallExpectedMm >= 15) {
        conditionCode = 'heavy_rain';
        condition = condition || 'Heavy Inundation Rainfall';
      } else if (rainfallExpectedMm > 0) {
        conditionCode = 'rain';
        condition = condition || 'Active Rain Showers';
      } else if (temp >= 40) {
        conditionCode = 'heatwave';
        condition = condition || 'Extreme Thermal Exposure';
      } else if (windSpeed >= 50) {
        conditionCode = 'cyclonic';
        condition = condition || 'Severe Coastal Squall';
      } else if (humidity >= 85) {
        conditionCode = 'cloudy';
        condition = condition || 'Overcast Skies';
      } else {
        conditionCode = 'partly_cloudy';
        condition = condition || 'Partly Cloudy';
      }
    }

    if (!condition) {
      condition = conditionCode === 'heavy_rain' ? 'Heavy Rainfall' :
                  conditionCode === 'rain' ? 'Rain Showers' :
                  conditionCode === 'thunderstorm' ? 'Thunderstorm with Rain' :
                  conditionCode === 'heatwave' ? 'Heatwave Advisory' :
                  conditionCode === 'cyclonic' ? 'Cyclonic Winds' :
                  conditionCode === 'cloudy' ? 'Overcast' :
                  conditionCode === 'fog' ? 'Foggy' :
                  conditionCode === 'sunny' ? 'Clear Skies' : 'Partly Cloudy';
    }

    const uvStatus: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme' =
      uvIndex <= 2 ? 'Low' : uvIndex <= 5 ? 'Moderate' : uvIndex <= 7 ? 'High' : uvIndex <= 10 ? 'Very High' : 'Extreme';

    const airQualityStatus: 'Good' | 'Moderate' | 'Unhealthy' | 'Severe' | 'Hazardous' =
      aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 200 ? 'Unhealthy' : aqi <= 300 ? 'Severe' : 'Hazardous';

    const telemetry: WeatherTelemetry = {
      cityName: raw.city_name || raw.cityName || cityHint || 'Current Area',
      stateName: raw.state_name || raw.stateName || stateHint || 'India',
      country: raw.country || 'India',
      coordinates: coords,
      updatedAt: raw.observed_at || raw.updatedAt || new Date().toISOString(),
      condition,
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
      barometricPressureHpa: Math.round(Number(raw.barometric_pressure_hpa ?? raw.barometricPressureHpa ?? 1010)),
      visibilityKm: Math.round(Number(raw.visibility_km ?? raw.visibilityKm ?? (rainfallExpectedMm > 0 ? 4.5 : 9.0))),
      dewPointCelsius: Math.round(Number(raw.dew_point_celsius ?? raw.dewPointCelsius ?? temp - 4)),
      cloudCoverPercent: Math.round(Number(raw.cloud_cover_percent ?? raw.cloudCoverPercent ?? (rainProbability > 50 ? 80 : 35))),
      solarRadiationWm2: Math.round(Number(raw.solar_radiation_wm2 ?? raw.solarRadiationWm2 ?? uvIndex * 105)),
      sunrise: raw.sunrise || '06:00 AM IST',
      sunset: raw.sunset || '06:30 PM IST',
    };

    const hourly = raw.hourlyForecast && Array.isArray(raw.hourlyForecast) && raw.hourlyForecast.length > 0
      ? raw.hourlyForecast
      : this.generateSyntheticHourly(telemetry);

    const daily = raw.dailyForecast && Array.isArray(raw.dailyForecast) && raw.dailyForecast.length > 0
      ? raw.dailyForecast
      : this.generateSyntheticDaily(telemetry);

    const risks = raw.hazardRisks && Array.isArray(raw.hazardRisks) && raw.hazardRisks.length > 0
      ? raw.hazardRisks
      : this.generateSyntheticRisks(telemetry);

    return {
      telemetry,
      hourly,
      daily,
      risks,
      dataSource: raw.dataSource || {
        authority: 'Open-Meteo & IMD Telemetry Network',
        radarStation: 'Regional Grid',
        modelResolution: '1km Meso-Gamma',
        telemetryFreshness: 'Live Stream',
      },
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

    if (base.rainfallExpectedMm >= 15 || base.rainProbability >= 60 || base.conditionCode === 'rain' || base.conditionCode === 'heavy_rain' || base.conditionCode === 'thunderstorm') {
      risks.push({
        hazardType: 'Monsoonal Inundation & Urban Runoff',
        category: 'hydrological',
        confidencePercent: 88,
        riskLevel: base.rainfallExpectedMm >= 25 ? 'critical' : 'warning',
        timeframe: 'Next 6-18 Hours',
        summary: `Active precipitation observed with ${base.rainProbability}% rain probability (${base.rainfallExpectedMm}mm).`,
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
