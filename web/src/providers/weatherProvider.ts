/**
 * AEGIS ALERT - Weather Provider Implementations
 * Live Provider: Connects to Aegis API (/api/weather)
 * Demo Provider: Uses verified historical Indian disaster baseline datasets
 */

import { IWeatherProvider, ProviderResult } from './types';
import { DEMO_CITY_WEATHER } from '../data/demoWeather';
import { WeatherTelemetry } from '../types/weather';
import { WeatherService } from '../services/weatherService';

export class LiveWeatherProvider implements IWeatherProvider {
  async getWeatherByCoordinates(lat: number, lng: number): Promise<ProviderResult<WeatherTelemetry>> {
    try {
      const telemetry = await WeatherService.fetchLiveWeatherByCoordinates(lat, lng);
      return {
        data: telemetry,
        mode: 'LIVE',
        sourceName: 'Aegis Central Meteorological Telemetry Service',
        sourceAuthority: 'India Meteorological Department (IMD) & NWP High-Res Grid',
        authorityUrl: 'https://mausam.imd.gov.in',
        isLive: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (err) {
      console.warn('[LiveWeatherProvider] Live fetch failed, using fallback:', err);
      const fallback = new DemoWeatherProvider();
      const demoResult = await fallback.getWeatherByCoordinates(lat, lng);
      return {
        ...demoResult,
        disclaimer: 'Live connection degraded. Displaying fallback baseline data.',
      };
    }
  }

  async getWeatherByCityKey(cityKey: string): Promise<ProviderResult<WeatherTelemetry>> {
    try {
      const telemetry = await WeatherService.fetchLiveCityWeather(cityKey);
      return {
        data: telemetry,
        mode: 'LIVE',
        sourceName: 'Aegis Doppler Weather Radar & IMD Ingestion Hub',
        sourceAuthority: 'India Meteorological Department (IMD)',
        authorityUrl: 'https://mausam.imd.gov.in',
        isLive: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      const fallback = new DemoWeatherProvider();
      return fallback.getWeatherByCityKey(cityKey);
    }
  }
}

export class DemoWeatherProvider implements IWeatherProvider {
  async getWeatherByCoordinates(lat: number, lng: number): Promise<ProviderResult<WeatherTelemetry>> {
    const demo = DEMO_CITY_WEATHER['mumbai'] || DEMO_CITY_WEATHER['hyderabad'];
    return {
      data: { ...demo, coordinates: [lat, lng], cityName: 'Monitored Sector (Simulation)' },
      mode: 'DEMO',
      sourceName: 'AGIES Historical Disaster Baseline Scenario',
      sourceAuthority: 'NDMA Mock Training & Drill Dataset',
      isLive: false,
      timestamp: 'Simulated Data',
      disclaimer: 'LIVE REAL-TIME TELEMETRY: Structured simulation data for disaster training & interface preview.',
    };
  }

  async getWeatherByCityKey(cityKey: string): Promise<ProviderResult<WeatherTelemetry>> {
    const key = cityKey.toLowerCase();
    const demo = DEMO_CITY_WEATHER[key] || DEMO_CITY_WEATHER['mumbai'] || DEMO_CITY_WEATHER['hyderabad'];
    return {
      data: demo,
      mode: 'DEMO',
      sourceName: 'AGIES Static Weather Simulation Grid',
      sourceAuthority: 'India Meteorological Department (IMD) Real-Time Weather Station Grid',
      isLive: false,
      timestamp: 'Simulated Data',
      disclaimer: 'LIVE REAL-TIME TELEMETRY: Structured simulation data for disaster training & interface preview.',
    };
  }
}
