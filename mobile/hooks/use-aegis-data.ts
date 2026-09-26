import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AegisWeatherData,
  AegisHazardAlert,
  AegisShelter,
  AegisHospital,
  DataFreshness,
} from "@/lib/services/aegis-types";
import { AegisApiService } from "@/lib/services/aegis-api";
import {
  getResponsibleLocation,
  AegisLocationResult,
  DEFAULT_FALLBACK_LOCATION,
  saveLastKnownLocation,
} from "@/lib/services/aegis-location";

export interface UseAegisDataReturn {
  weather: AegisWeatherData | null;
  hazardAlerts: AegisHazardAlert[];
  activeCriticalAlerts: AegisHazardAlert[];
  shelters: AegisShelter[];
  hospitals: AegisHospital[];
  location: AegisLocationResult;
  isLoading: boolean;
  isRefreshing: boolean;
  dataFreshness: DataFreshness;
  lastUpdatedFormatted: string;
  source: string;
  error: string | null;
  refresh: () => Promise<void>;
    updateLocation: (
    lat: number,
    lng: number,
    label: string,
    mode?: "gps" | "custom",
    extra?: Partial<AegisLocationResult>
  ) => Promise<void>;
}

export function useAegisData(): UseAegisDataReturn {
  const [location, setLocation] = useState<AegisLocationResult>({
    ...DEFAULT_FALLBACK_LOCATION,
    source: "default",
    permissionGranted: false,
  });

  const [weather, setWeather] = useState<AegisWeatherData | null>(null);
  const [hazardAlerts, setHazardAlerts] = useState<AegisHazardAlert[]>([]);
  const [shelters, setShelters] = useState<AegisShelter[]>([]);
  const [hospitals, setHospitals] = useState<AegisHospital[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dataFreshness, setDataFreshness] = useState<DataFreshness>("LIVE");
  const [lastUpdatedFormatted, setLastUpdatedFormatted] = useState<string>("Syncing...");
  const [source, setSource] = useState<string>("Aegis Software");
  const [error, setError] = useState<string | null>(null);

  // Load all Aegis data for current coordinates
  const loadData = useCallback(async (lat: number, lng: number, silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Weather
      const weatherRes = await AegisApiService.getWeather(lat, lng);
      setWeather(weatherRes.data);
      setDataFreshness(weatherRes.freshness);
      setLastUpdatedFormatted(weatherRes.lastUpdatedFormatted || "Just now");
      setSource(weatherRes.source);

      // 2. Fetch Hazard Alerts
      const alertsRes = await AegisApiService.getHazardAlerts(lat, lng);
      setHazardAlerts(alertsRes.data || []);

      // 3. Fetch Shelters
      const sheltersRes = await AegisApiService.getShelters(lat, lng);
      setShelters(sheltersRes.data || []);

      // 4. Fetch Hospitals
      const hospitalsRes = await AegisApiService.getHospitals(lat, lng);
      setHospitals(hospitalsRes.data || []);

      // 5. Check & sync offline queue in background
      void AegisApiService.syncOfflineQueue();
    } catch (err) {
      console.warn("[useAegisData] Error loading data:", err);
      setError("Unable to sync live data. Showing cached records.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initialize location & load data on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const loc = await getResponsibleLocation();
        if (cancelled) return;
        setLocation(loc);
        await loadData(loc.latitude, loc.longitude);
      } catch {
        if (!cancelled) {
          await loadData(DEFAULT_FALLBACK_LOCATION.latitude, DEFAULT_FALLBACK_LOCATION.longitude);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData(location.latitude, location.longitude, true);
  }, [loadData, location.latitude, location.longitude]);

  // Automatic 30-second silent background polling & telemetry sync
  useEffect(() => {
    const autoRefreshTimer = setInterval(() => {
      if (location.latitude && location.longitude) {
        void loadData(location.latitude, location.longitude, true);
      }
    }, 30000);

    return () => clearInterval(autoRefreshTimer);
  }, [loadData, location.latitude, location.longitude]);

    const updateLocation = useCallback(
    async (
      latitude: number,
      longitude: number,
      label: string,
      mode: "gps" | "custom" = "custom",
      extra?: Partial<AegisLocationResult>
    ) => {
      const updated: AegisLocationResult = {
        latitude,
        longitude,
        label,
        source: mode,
        permissionGranted: mode === "gps" ? true : location.permissionGranted,
        isPinned: mode === "custom",
        ...(extra || {}),
      };
      setLocation(updated);
      await saveLastKnownLocation(updated);
      await loadData(latitude, longitude);
    },
    [loadData, location.permissionGranted]
  );

  const activeCriticalAlerts = useMemo(() => {
    return hazardAlerts.filter(
      (a) => (a.severity === "CRITICAL" || a.severity === "HIGH") && a.status === "ACTIVE"
    );
  }, [hazardAlerts]);

  return {
    weather,
    hazardAlerts,
    activeCriticalAlerts,
    shelters,
    hospitals,
    location,
    isLoading,
    isRefreshing,
    dataFreshness,
    lastUpdatedFormatted,
    source,
    error,
    refresh,
    updateLocation,
  };
}
