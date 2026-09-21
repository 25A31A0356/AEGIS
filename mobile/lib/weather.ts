import { AegisApiService } from "./services/aegis-api";

export type LiveWeather = {
  temperature: number;
  apparent: number;
  wind: number;
  humidity: number;
  rainfall?: number;
  visibility: number;
  weatherCode: number;
  time: string;
  forecast: { day: string; label: string; hi: string; lo: string; color: string }[];
  source: string;
  isSevereWeather?: boolean;
  freshness?: "LIVE" | "CACHED" | "STALE";
  lastUpdatedFormatted?: string;
};

export async function fetchLiveWeather(latitude: number, longitude: number): Promise<LiveWeather> {
  const result = await AegisApiService.getWeather(latitude, longitude);
  const w = result.data;

  return {
    temperature: w.temperature,
    apparent: w.apparentTemperature,
    wind: w.windSpeedKmH,
    humidity: w.humidity,
    rainfall: w.rainfallMm,
    visibility: w.visibilityKm,
    weatherCode: w.weatherCode,
    time: w.lastUpdated,
    forecast: w.forecast.map((f) => ({
      day: f.day,
      label: f.label,
      hi: f.hi,
      lo: f.lo,
      color: f.color,
    })),
    source: w.source,
    isSevereWeather: w.isSevereWeather,
    freshness: result.freshness,
    lastUpdatedFormatted: result.lastUpdatedFormatted,
  };
}

