import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SOSService } from '../services/sosService';
import { RoutingService, SimulatedRoute } from '../services/routingService';
import { RealtimeService, RealtimeEvent } from '../services/realtimeService';
import { useNotifications } from './NotificationContext';
import { SOSBeacon, SOSTriageStatus } from '../types/sos';

interface SOSContextType {
  beacons: SOSBeacon[];
  selectedBeacon: SOSBeacon | null;
  activeRoute: SimulatedRoute | null;
  isRouteSimulating: boolean;
  isLiveLoading: boolean;
  lastRefreshed: Date;
  secondsUntilNextRefresh: number;
  setSelectedBeacon: (beacon: SOSBeacon | null) => void;
  updateBeaconTriage: (id: string, newStatus: SOSTriageStatus, notes?: string) => Promise<void>;
  triggerEmergencyRouteSimulation: (beacon: SOSBeacon) => void;
  clearActiveRoute: () => void;
  createNewSOSBeacon: (data: Partial<SOSBeacon>) => Promise<SOSBeacon>;
  refreshBeacons: () => Promise<void>;
  clearStaleBeacons: () => void;
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [beacons, setBeacons] = useState<SOSBeacon[]>(() => SOSService.getBeacons());
  const [selectedBeacon, setSelectedBeacon] = useState<SOSBeacon | null>(null);
  const [activeRoute, setActiveRoute] = useState<SimulatedRoute | null>(null);
  const [isRouteSimulating, setIsRouteSimulating] = useState<boolean>(false);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(() => new Date());
  const [secondsUntilNextRefresh, setSecondsUntilNextRefresh] = useState<number>(60);

  const { addNotification } = useNotifications();

  const refreshBeacons = useCallback(async () => {
    setIsLiveLoading(true);
    try {
      SOSService.pruneStaleBeacons();
      const fresh = await SOSService.fetchBeaconsFromApi(true);
      setBeacons(fresh);
      setLastRefreshed(new Date());
      setSecondsUntilNextRefresh(60);
    } finally {
      setTimeout(() => setIsLiveLoading(false), 400);
    }
  }, []);

  const clearStaleBeacons = useCallback(() => {
    SOSService.pruneStaleBeacons();
    refreshBeacons();
  }, [refreshBeacons]);

  // 1-minute auto-refresh interval with 1-second countdown tick
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setSecondsUntilNextRefresh((prev) => {
        if (prev <= 1) {
          // Trigger automatic 1-minute refresh
          refreshBeacons();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [refreshBeacons]);

  useEffect(() => {
    // Initial fetch from backend
    SOSService.fetchBeaconsFromApi().then((list) => {
      setBeacons(list);
      setLastRefreshed(new Date());
    });

    const unsubscribe = SOSService.subscribe((updatedList) => {
      setBeacons(updatedList);
      if (selectedBeacon) {
        const fresh = updatedList.find((b) => b.id === selectedBeacon.id);
        if (fresh) {
          setSelectedBeacon(fresh);
          // If fresh beacon has updated responder coordinates or route, update active route
          if (fresh.assignedUnit?.responderCoordinates && fresh.routeCoordinates) {
            setActiveRoute({
              originCoordinates: fresh.assignedUnit.responderCoordinates,
              destinationCoordinates: fresh.coordinates,
              totalDistanceKm: fresh.assignedUnit.distanceKm,
              estimatedTimeMinutes: fresh.assignedUnit.etaMinutes,
              waypoints: fresh.routeCoordinates,
              steps: [
                {
                  instruction: `Deploy from ${fresh.assignedUnit.unitName} base corridor`,
                  distance: `${(fresh.assignedUnit.distanceKm * 0.4).toFixed(1)} km`,
                  duration: `${Math.ceil(fresh.assignedUnit.etaMinutes * 0.4)} min`,
                  road: 'Primary Access Bypass',
                },
                {
                  instruction: 'Priority Siren Code Red En Route to Citizen Distress Location',
                  distance: `${(fresh.assignedUnit.distanceKm * 0.6).toFixed(1)} km`,
                  duration: `${Math.ceil(fresh.assignedUnit.etaMinutes * 0.6)} min`,
                  road: 'Arterial Corridor',
                },
                {
                  instruction: `Arrive at target ${fresh.anonymousAlias}`,
                  distance: '0.0 km',
                  duration: '0 min',
                  road: 'Distress Coordinates',
                },
              ],
            });
          }
        }
      }
    });

    // Listen to real-time events to trigger notifications
    const unsubRealtime = RealtimeService.on('SOS_DISPATCHED', (evt: RealtimeEvent) => {
      const data = evt.data || {};
      if (data.eventType === 'SOS_CREATED' && data.beacon) {
        addNotification({
          severity: 'critical',
          title: `🚨 SOS Distress Signal: ${data.beacon.id}`,
          message: `${data.beacon.emergencyTitle} (${data.beacon.district || 'India Sector'}) — ${data.beacon.personsCount || 1} person(s).`,
          source: 'Aegis Alert Distress Sentinel',
          location: `${data.beacon.locationName || data.beacon.district}`,
          linkTab: 'sos',
        });
      }
    });

    return () => {
      unsubscribe();
      unsubRealtime();
    };
  }, [selectedBeacon, addNotification]);

  const updateBeaconTriage = async (id: string, newStatus: SOSTriageStatus, notes?: string) => {
    const updated = await SOSService.updateTriageStatus(id, newStatus, 'Operator #419 (AEGIS Web Desk)', notes);
    if (updated && selectedBeacon?.id === id) {
      setSelectedBeacon(updated);
    }
  };

  const triggerEmergencyRouteSimulation = (beacon: SOSBeacon) => {
    setSelectedBeacon(beacon);
    setIsRouteSimulating(true);

    if (beacon.assignedUnit?.responderCoordinates && beacon.routeCoordinates) {
      setActiveRoute({
        originCoordinates: beacon.assignedUnit.responderCoordinates,
        destinationCoordinates: beacon.coordinates,
        totalDistanceKm: beacon.assignedUnit.distanceKm,
        estimatedTimeMinutes: beacon.assignedUnit.etaMinutes,
        waypoints: beacon.routeCoordinates,
        steps: [
          {
            instruction: `Deploy from ${beacon.assignedUnit.unitName}`,
            distance: `${(beacon.assignedUnit.distanceKm * 0.5).toFixed(1)} km`,
            duration: `${Math.ceil(beacon.assignedUnit.etaMinutes * 0.5)} min`,
            road: 'Priority Corridor',
          },
          {
            instruction: `Arrive at target ${beacon.anonymousAlias}`,
            distance: '0.0 km',
            duration: '0 min',
            road: 'Distress Coordinates',
          },
        ],
      });
      return;
    }

    const stagingCoords: [number, number] = [
      beacon.coordinates[0] + 0.018,
      beacon.coordinates[1] - 0.021,
    ];

    const route = RoutingService.calculateEmergencyRoute(
      stagingCoords,
      beacon.coordinates,
      beacon.assignedUnit?.unitName || 'Nearest NDRF/SDRF Staging Base',
      beacon.anonymousAlias
    );

    setActiveRoute(route);
  };

  const clearActiveRoute = () => {
    setActiveRoute(null);
    setIsRouteSimulating(false);
  };

  const createNewSOSBeacon = async (data: Partial<SOSBeacon>): Promise<SOSBeacon> => {
    const newBeacon = await SOSService.createSOSBeacon(data);
    setSelectedBeacon(newBeacon);
    return newBeacon;
  };

  return (
    <SOSContext.Provider
      value={{
        beacons,
        selectedBeacon,
        activeRoute,
        isRouteSimulating,
        isLiveLoading,
        lastRefreshed,
        secondsUntilNextRefresh,
        setSelectedBeacon,
        updateBeaconTriage,
        triggerEmergencyRouteSimulation,
        clearActiveRoute,
        createNewSOSBeacon,
        refreshBeacons,
        clearStaleBeacons,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const context = useContext(SOSContext);
  if (!context) {
    throw new Error('useSOS must be used within an SOSProvider');
  }
  return context;
};
