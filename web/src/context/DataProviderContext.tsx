/**
 * AGIES ALERT - Data Provider Context
 * Provides global access to the active Data Mode (LIVE vs DEMO), provider interfaces, health status, and inspector modal.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DataMode,
  ProviderHealth,
  IWeatherProvider,
  IDisasterAlertsProvider,
  IGeocodingProvider,
  IMapProvider,
  IRadarProvider,
  ISatelliteProvider,
  ILightningProvider,
} from '../providers/types';
import { ProviderRegistry } from '../providers/ProviderRegistry';

interface DataProviderContextType {
  dataMode: DataMode;
  isLiveMode: boolean;
  isDemoMode: boolean;
  setDataMode: (mode: DataMode) => void;
  toggleDataMode: () => void;
  providersHealth: ProviderHealth[];
  isInspectorOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;
  openInspector: () => void;
  closeInspector: () => void;

  // Active Providers
  weatherProvider: IWeatherProvider;
  alertsProvider: IDisasterAlertsProvider;
  geocodingProvider: IGeocodingProvider;
  mapProvider: IMapProvider;
  radarProvider: IRadarProvider;
  satelliteProvider: ISatelliteProvider;
  lightningProvider: ILightningProvider;
}

const DataProviderContext = createContext<DataProviderContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataMode, setCurrentDataMode] = useState<DataMode>(() => ProviderRegistry.getDataMode());
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [providersHealth, setProvidersHealth] = useState<ProviderHealth[]>(() =>
    ProviderRegistry.getProvidersHealth()
  );

  useEffect(() => {
    // Subscribe to ProviderRegistry updates
    const unsubscribe = ProviderRegistry.subscribe((mode) => {
      setCurrentDataMode(mode);
      setProvidersHealth(ProviderRegistry.getProvidersHealth());
    });
    return unsubscribe;
  }, []);

  const setDataMode = useCallback((mode: DataMode) => {
    ProviderRegistry.setDataMode(mode);
    setCurrentDataMode(mode);
    setProvidersHealth(ProviderRegistry.getProvidersHealth());
  }, []);

  const toggleDataMode = useCallback(() => {
    const next = ProviderRegistry.toggleDataMode();
    setCurrentDataMode(next);
    setProvidersHealth(ProviderRegistry.getProvidersHealth());
  }, []);

  const openInspector = useCallback(() => setIsInspectorOpen(true), []);
  const closeInspector = useCallback(() => setIsInspectorOpen(false), []);

  const value: DataProviderContextType = {
    dataMode,
    isLiveMode: dataMode === 'LIVE',
    isDemoMode: dataMode === 'DEMO',
    setDataMode,
    toggleDataMode,
    providersHealth,
    isInspectorOpen,
    setIsInspectorOpen,
    openInspector,
    closeInspector,
    weatherProvider: ProviderRegistry.getWeatherProvider(),
    alertsProvider: ProviderRegistry.getAlertsProvider(),
    geocodingProvider: ProviderRegistry.getGeocodingProvider(),
    mapProvider: ProviderRegistry.getMapProvider(),
    radarProvider: ProviderRegistry.getRadarProvider(),
    satelliteProvider: ProviderRegistry.getSatelliteProvider(),
    lightningProvider: ProviderRegistry.getLightningProvider(),
  };

  return <DataProviderContext.Provider value={value}>{children}</DataProviderContext.Provider>;
};

export const useDataProvider = () => {
  const context = useContext(DataProviderContext);
  if (!context) {
    throw new Error('useDataProvider must be used within a DataProvider');
  }
  return context;
};
