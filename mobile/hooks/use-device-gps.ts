import { useState, useEffect, useCallback, useRef } from "react";
import {
  AegisLocationResult,
  getAuthoritativeGpsLocation,
  startContinuousGpsTracking,
  stopContinuousGpsTracking,
  syncOfflineLocationQueue,
  DEFAULT_ACCURACY_POLICY,
  GpsAccuracyPolicy,
} from "@/lib/services/aegis-location";

export interface UseDeviceGpsOptions {
  autoFetch?: boolean;
  enableLiveTracking?: boolean;
  trackingIntervalMs?: number;
  policy?: GpsAccuracyPolicy;
}

export function useDeviceGps(options: UseDeviceGpsOptions = {}) {
  const {
    autoFetch = true,
    enableLiveTracking = false,
    trackingIntervalMs = 3000,
    policy = DEFAULT_ACCURACY_POLICY,
  } = options;

  const [location, setLocation] = useState<AegisLocationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(false);
  const [syncedQueueCount, setSyncedQueueCount] = useState<number>(0);
  const [lastFixTime, setLastFixTime] = useState<Date | null>(null);

  const fetchGpsFix = useCallback(async () => {
    setIsLoading(true);
    try {
      const fix = await getAuthoritativeGpsLocation(policy);
      setLocation(fix);
      setLastFixTime(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [policy]);

  const toggleLiveTracking = useCallback(async () => {
    if (isLiveTracking) {
      stopContinuousGpsTracking();
      setIsLiveTracking(false);
    } else {
      const started = await startContinuousGpsTracking(
        (updatedLoc) => {
          setLocation(updatedLoc);
          setLastFixTime(new Date());
        },
        { timeIntervalMs: trackingIntervalMs }
      );
      if (started) {
        setIsLiveTracking(true);
      }
    }
  }, [isLiveTracking, trackingIntervalMs]);

  const syncQueue = useCallback(async () => {
    const count = await syncOfflineLocationQueue();
    if (count > 0) {
      setSyncedQueueCount((prev) => prev + count);
    }
    return count;
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchGpsFix();
    }
  }, [autoFetch, fetchGpsFix]);

  useEffect(() => {
    if (enableLiveTracking) {
      startContinuousGpsTracking(
        (updatedLoc) => {
          setLocation(updatedLoc);
          setLastFixTime(new Date());
        },
        { timeIntervalMs: trackingIntervalMs }
      ).then((ok) => setIsLiveTracking(ok));

      return () => {
        stopContinuousGpsTracking();
      };
    }
  }, [enableLiveTracking, trackingIntervalMs]);

  return {
    location,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    accuracyMeters: location?.accuracyMeters ?? null,
    accuracyTier: location?.accuracyTier ?? "POOR",
    provider: location?.provider ?? "GPS/FUSED",
    isMockLocation: location?.isMockLocation ?? false,
    isStale: location?.isStale ?? false,
    ageSeconds: location?.ageSeconds ?? 0,
    permissionGranted: location?.permissionGranted ?? false,
    locationServicesEnabled: location?.locationServicesEnabled ?? false,
    isLoading,
    isLiveTracking,
    lastFixTime,
    syncedQueueCount,
    fetchGpsFix,
    toggleLiveTracking,
    syncQueue,
  };
}
