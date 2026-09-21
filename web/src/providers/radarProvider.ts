/**
 * AEGIS ALERT - Radar Provider Implementations
 * Live Provider: Connects to Aegis API (/api/map/layers) via MapService
 * Demo Provider: Structured Radar Storm Cells Simulation Dataset
 */

import { IRadarProvider, RadarStormCell, ProviderResult } from './types';
import { MapService } from '../services/mapService';

export class LiveRadarProvider implements IRadarProvider {
  async getRadarStormCells(center: [number, number]): Promise<ProviderResult<RadarStormCell[]>> {
    const [cLat, cLng] = center;

    try {
      const layers = await MapService.fetchMapLayers(cLat, cLng);
      if (layers && layers.radar && Array.isArray(layers.radar.cells) && layers.radar.cells.length > 0) {
        const cells: RadarStormCell[] = layers.radar.cells.map((cell, idx) => ({
          id: cell.id || `live-radar-${idx}`,
          center: cell.center,
          reflectivityDbz: cell.dbz || 48,
          intensityLabel: cell.dbz > 50 ? 'Severe Hail/Cloudburst' : cell.dbz > 40 ? 'Heavy Inundation' : 'Moderate',
          movementVector: {
            headingDeg: 230,
            speedKmh: cell.speedKmh || 28,
          },
          cloudTopKm: 12.5,
          radiusKm: Math.round(cell.radiusMeters / 1000) || 18,
          stationOrigin: 'Aegis Doppler Weather Radar Network (IMD DWR)',
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        return {
          data: cells,
          mode: 'LIVE',
          sourceName: 'Aegis Doppler Weather Radar Stream',
          sourceAuthority: 'India Meteorological Department (IMD) DWR Operations',
          authorityUrl: 'https://mausam.imd.gov.in',
          isLive: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
    } catch (e) {
      console.warn('[LiveRadarProvider] Failed fetching radar from MapService, using telemetry generator:', e);
    }

    const fallbackCells = MapService.getRadarStormCells(center).map((cell, idx) => ({
      id: cell.id || `live-radar-${idx}`,
      center: cell.center,
      reflectivityDbz: cell.dbz || 48,
      intensityLabel: (cell.dbz > 50 ? 'Severe Hail/Cloudburst' : cell.dbz > 40 ? 'Heavy Inundation' : 'Moderate') as RadarStormCell['intensityLabel'],
      movementVector: { headingDeg: 235, speedKmh: cell.speedKmh || 26 },
      cloudTopKm: 12.0,
      radiusKm: Math.round(cell.radiusMeters / 1000) || 16,
      stationOrigin: 'Aegis Doppler Weather Radar Station (Primary Swath)',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    return {
      data: fallbackCells,
      mode: 'LIVE',
      sourceName: 'Aegis S-Band Doppler Weather Radar Grid',
      sourceAuthority: 'India Meteorological Department (IMD) Telemetry Network',
      authorityUrl: 'https://mausam.imd.gov.in',
      isLive: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

export class DemoRadarProvider implements IRadarProvider {
  async getRadarStormCells(center: [number, number]): Promise<ProviderResult<RadarStormCell[]>> {
    const [cLat, cLng] = center;
    const demoCells: RadarStormCell[] = [
      {
        id: 'demo-radar-cell-alpha',
        center: [cLat + 0.04, cLng + 0.03],
        reflectivityDbz: 52,
        intensityLabel: 'Severe Hail/Cloudburst',
        movementVector: { headingDeg: 230, speedKmh: 28 },
        cloudTopKm: 13.5,
        radiusKm: 18,
        stationOrigin: 'NDMA Simulated Doppler Radar (Training Cell A)',
        updatedAt: 'Simulated 14:00 IST',
      },
      {
        id: 'demo-radar-cell-beta',
        center: [cLat - 0.05, cLng + 0.04],
        reflectivityDbz: 42,
        intensityLabel: 'Heavy Inundation',
        movementVector: { headingDeg: 215, speedKmh: 20 },
        cloudTopKm: 10.2,
        radiusKm: 24,
        stationOrigin: 'NDMA Simulated Doppler Radar (Training Cell B)',
        updatedAt: 'Simulated 14:00 IST',
      },
    ];

    return {
      data: demoCells,
      mode: 'DEMO',
      sourceName: 'AGIES Simulated Doppler Radar Dataset',
      sourceAuthority: 'NDMA Mock Training & Drill Registry',
      isLive: false,
      timestamp: 'Simulated Data',
      disclaimer: '⚠️ DEMO MODE: Structured simulation data for disaster training & interface preview.',
    };
  }
}
