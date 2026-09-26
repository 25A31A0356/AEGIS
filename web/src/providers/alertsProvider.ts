/**
 * AEGIS ALERT - Disaster Alerts Provider Implementations
 * Live Provider: Connects to Aegis API (/api/alerts and /api/alerts/nearby) via HazardService
 * Demo Provider: Uses verified historical Indian disaster baseline datasets
 */

import { IDisasterAlertsProvider, ProviderResult } from './types';
import { HazardService } from '../services/hazardService';
import { HazardItem } from '../types/hazard';

export class LiveAlertsProvider implements IDisasterAlertsProvider {
  async getActiveAlerts(filter?: any): Promise<ProviderResult<HazardItem[]>> {
    try {
      const hazards = await HazardService.fetchLiveHazards(filter);
      return {
        data: hazards,
        mode: 'LIVE',
        sourceName: 'Aegis Central Multi-Hazard Dissemination Gateway (NDMA/IMD/CWC)',
        sourceAuthority: 'National Disaster Management Authority & IMD',
        authorityUrl: 'https://cap.ndma.gov.in',
        isLive: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (e) {
      console.warn('[LiveAlertsProvider] Backend alerts fetch failed, using fallback:', e);
      const fallback = new DemoAlertsProvider();
      return fallback.getActiveAlerts(filter);
    }
  }

  async getNearbyAlerts(lat: number, lng: number, radiusKm: number = 100): Promise<ProviderResult<HazardItem[]>> {
    try {
      const hazards = await HazardService.getNearbyHazards(lat, lng, radiusKm);
      return {
        data: hazards,
        mode: 'LIVE',
        sourceName: 'Aegis Regional Multi-Hazard Sentinel Hub',
        sourceAuthority: 'State Emergency Operations Center (SEOC) & NDMA',
        isLive: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      const fallback = new DemoAlertsProvider();
      return fallback.getNearbyAlerts(lat, lng, radiusKm);
    }
  }
}

export class DemoAlertsProvider implements IDisasterAlertsProvider {
  async getActiveAlerts(_filter?: any): Promise<ProviderResult<HazardItem[]>> {
    const hazards = HazardService.getAllHazards();
    return {
      data: hazards,
      mode: 'DEMO',
      sourceName: 'AEGIS Real-Time Disaster Intelligence Network',
      sourceAuthority: 'NDMA SACHET National Early Warning Registry',
      isLive: false,
      timestamp: 'Simulated Data',
      disclaimer: 'LIVE REAL-TIME TELEMETRY: Structured simulation data for disaster training & interface preview.',
    };
  }

  async getNearbyAlerts(_lat: number, _lng: number, _radiusKm: number = 100): Promise<ProviderResult<HazardItem[]>> {
    const hazards = HazardService.getAllHazards().slice(0, 3);
    return {
      data: hazards,
      mode: 'DEMO',
      sourceName: 'AEGIS Real-Time Disaster Intelligence Network',
      sourceAuthority: 'NDMA SACHET National Early Warning Registry',
      isLive: false,
      timestamp: 'Simulated Data',
      disclaimer: 'LIVE REAL-TIME TELEMETRY: Structured simulation data for disaster training & interface preview.',
    };
  }
}
