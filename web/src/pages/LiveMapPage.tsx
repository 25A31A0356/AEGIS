import React, { useState, useEffect, useCallback } from 'react';
import { LiveMapHeader } from '../components/livemap/LiveMapHeader';
import { InteractiveLocationMap, MapFeatureItem } from '../components/livemap/InteractiveLocationMap';
import { TechnicalLayerSwitcher, TechnicalLayerType } from '../components/livemap/TechnicalLayerSwitcher';
import { SavedLocationsList } from '../components/livemap/SavedLocationsList';
import { NearbyActivityFeed } from '../components/livemap/NearbyActivityFeed';
import { useLocation } from '../context/LocationContext';
import { LocationService, SavedLocationItem, NearbyActivityItem } from '../services/locationService';
import { RealtimeService, RealtimeEvent } from '../services/realtimeService';
import { ApiClient } from '../services/apiClient';

interface LiveMapPageProps {
  onNavigate: (tab: string) => void;
  onSelectHazardById?: (id: string) => void;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({
  onNavigate,
}) => {
  const {
    selectedLocation,
    savedLocations,
    selectLocationItem,
    saveLocationItem,
    removeLocationItem,
    requestCurrentGPS,
    weather,
  } = useLocation();

  const currentCenter = selectedLocation?.coordinates || [19.0760, 72.8777];
  const activeLocationName = selectedLocation?.name || weather?.cityName || 'Mumbai';

  // Technical Layer State
  const [activeLayer, setActiveLayer] = useState<TechnicalLayerType>('radar');
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Authoritative Map Features across all 5 layers
  const [mapFeatures, setMapFeatures] = useState<MapFeatureItem[]>([]);
  const [nearbyActivities, setNearbyActivities] = useState<NearbyActivityItem[]>(() =>
    LocationService.getNearbyActivity(currentCenter)
  );
  const [selectedHazard, setSelectedHazard] = useState<NearbyActivityItem | null>(null);

  // Convert GeoJSON features from /api/v1/map-data to MapFeatureItem
  const parseGeoJSONFeatures = (geoCollection: any): MapFeatureItem[] => {
    if (!geoCollection || !Array.isArray(geoCollection.features)) return [];
    return geoCollection.features.map((feat: any) => {
      const [lon, lat] = feat.geometry?.coordinates || [0, 0];
      const props = feat.properties || {};
      return {
        id: feat.id || props.entity_id || `${props.layer}_${Math.random()}`,
        layer: props.layer || 'hazards',
        coordinates: [lat, lon] as [number, number],
        title: props.title || props.name || 'Emergency Entity',
        description: props.description || '',
        category: props.category || props.emergency_type || 'General',
        severity: (props.severity || 'MODERATE').toUpperCase(),
        status: props.status || props.assignment_status || 'ACTIVE',
        isLive: props.is_live !== undefined ? props.is_live : true,
        lastLocationTime: props.last_location_time || props.last_location_update || props.created_at || '',
        callerName: props.caller_name,
        casualtiesCount: props.casualties_count,
        batteryPercent: props.battery_percent,
        responderId: props.responder_id,
        sosId: props.sos_id,
        etaSeconds: props.eta_seconds,
        distanceMeters: props.distance_meters,
        capacity: props.capacity,
        amenities: props.amenities,
        district: props.district || props.city,
        state: props.state,
        icon: props.icon,
      };
    });
  };

  const loadAuthoritativeMapData = useCallback(async (center: [number, number]) => {
    try {
      const res = await ApiClient.get<any>('/map-data', {
        lat: center[0],
        lng: center[1],
        radius_km: 250,
        layers: 'hazards,reports,sos_beacons,responders,shelters,safe_events'
      }, { skipCache: true, timeoutMs: 4000 });

      if (res && res.features) {
        const parsed = parseGeoJSONFeatures(res);
        setMapFeatures(parsed);

        // Also convert to nearbyActivities for the right-column feed
        const activityItems: NearbyActivityItem[] = parsed
          .filter(f => f.layer === 'hazards' || f.layer === 'reports' || f.layer === 'sos_beacons')
          .map(f => ({
            id: f.id,
            hazardType: f.category,
            title: f.title,
            locationName: `${f.district || 'Local Sector'}, ${f.state || 'India'}`,
            distanceKm: LocationService.calculateDistanceKm(center, f.coordinates),
            timestamp: f.lastLocationTime ? new Date(f.lastLocationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
            severity: f.severity === 'CRITICAL' ? 'Critical' : f.severity === 'HIGH' ? 'Warning' : 'Watch',
            coordinates: f.coordinates,
            source: f.layer === 'sos_beacons' ? 'SOS Beacon (Active)' : f.layer === 'reports' ? 'Citizen Report' : 'Official Observation',
            status: f.status,
            recommendedAction: f.description || 'Proceed with caution.',
            safetyGuideSlug: 'floods'
          }));

        setNearbyActivities(activityItems);
        return;
      }
    } catch (err) {
      console.warn('[LiveMapPage] Failed to fetch /api/v1/map-data:', err);
    }
  }, []);

  useEffect(() => {
    loadAuthoritativeMapData(currentCenter);
  }, [currentCenter[0], currentCenter[1], loadAuthoritativeMapData]);

  // Real-Time WebSocket Event Listeners
  useEffect(() => {
    // 1. SOS Created -> Add beacon to map immediately
    const unsubSOSCreated = RealtimeService.on('SOS_CREATED', (evt: RealtimeEvent) => {
      const d = evt.data || {};
      const lat = d.latitude || d.lat;
      const lon = d.longitude || d.lon || d.lng;
      if (lat && lon) {
        const newSosItem: MapFeatureItem = {
          id: `sos_${d.id || d.sos_id}`,
          layer: 'sos_beacons',
          coordinates: [lat, lon],
          title: `Emergency SOS: ${(d.emergency_type || 'General').replace(/_/g, ' ')}`,
          description: `Casualties: ${d.casualties_count || 1}. Battery: ${d.battery_percent || 100}%`,
          category: d.emergency_type || 'EMERGENCY_SOS',
          severity: (d.severity || 'CRITICAL').toUpperCase(),
          status: d.status || 'TRIGGERED',
          isLive: true,
          lastLocationTime: new Date().toISOString(),
          callerName: d.caller_name,
          casualtiesCount: d.casualties_count || 1,
          batteryPercent: d.battery_percent,
          sosId: d.id || d.sos_id,
          district: d.district || d.city,
          state: d.state,
          icon: 'emergency_beacon'
        };

        setMapFeatures((prev) => [newSosItem, ...prev.filter(p => p.id !== newSosItem.id)]);
      }
    });

    // 2. Responder Location Updated -> Move responder marker strictly to new GPS position
    const unsubResponderLoc = RealtimeService.on('RESPONDER_LOCATION_UPDATED', (evt: RealtimeEvent) => {
      const d = evt.data || {};
      const lat = d.latitude || d.lat;
      const lon = d.longitude || d.lon || d.lng;
      const responderId = d.responder_id || d.user_id;

      if (lat && lon && responderId) {
        setMapFeatures((prev) => {
          const respId = `responder_${responderId}`;
          const existing = prev.find(p => p.id === respId || p.responderId === responderId);
          const updatedResp: MapFeatureItem = {
            id: respId,
            layer: 'responders',
            coordinates: [lat, lon],
            title: existing?.title || `Responder ${responderId.substring(0, 6)}`,
            description: `Live GPS Fix • ETA: ${d.eta_seconds ? Math.round(d.eta_seconds / 60) + 'm' : 'En route'}`,
            category: 'RESPONDER',
            severity: 'LOW',
            status: 'DISPATCHED_EN_ROUTE',
            isLive: true,
            lastLocationTime: new Date().toISOString(),
            responderId,
            sosId: d.sos_id || existing?.sosId,
            etaSeconds: d.eta_seconds,
            distanceMeters: d.distance_meters,
            icon: 'responder_unit'
          };

          return [updatedResp, ...prev.filter(p => p.id !== respId && p.responderId !== responderId)];
        });
      }
    });

    // 3. SOS Status Updated / Resolved / Cancelled
    const unsubSOSStatus = RealtimeService.on('SOS_STATUS_UPDATED', (evt: RealtimeEvent) => {
      const d = evt.data || {};
      const sosId = d.id || d.sos_id;
      if (sosId) {
        setMapFeatures((prev) => prev.map(p => {
          if (p.sosId === sosId || p.id === `sos_${sosId}`) {
            return { ...p, status: d.status || p.status, lastLocationTime: new Date().toISOString() };
          }
          return p;
        }));
      }
    });

    const unsubSOSResolved = RealtimeService.on('SOS_RESOLVED', (evt: RealtimeEvent) => {
      const d = evt.data || {};
      const sosId = d.id || d.sos_id;
      if (sosId) {
        setMapFeatures((prev) => prev.filter(p => p.sosId !== sosId && p.id !== `sos_${sosId}`));
      }
    });

    const unsubSOSCancelled = RealtimeService.on('SOS_CANCELLED', (evt: RealtimeEvent) => {
      const d = evt.data || {};
      const sosId = d.id || d.sos_id;
      if (sosId) {
        setMapFeatures((prev) => prev.filter(p => p.sosId !== sosId && p.id !== `sos_${sosId}`));
      }
    });

    // 4. Community Report Created & Updated
    const unsubReportCreated = RealtimeService.on('REPORT_CREATED', (evt: RealtimeEvent) => {
      const d = evt.data || {};
      const lat = d.latitude || d.location?.lat;
      const lon = d.longitude || d.location?.lng;
      if (lat && lon) {
        const newRep: MapFeatureItem = {
          id: `rep_${d.id || d.trackingId}`,
          layer: 'reports',
          coordinates: [lat, lon],
          title: d.title || `Citizen Incident: ${d.category || d.hazard_type}`,
          description: d.description || '',
          category: d.category || d.hazard_type || 'Incident',
          severity: (d.severity || 'MODERATE').toUpperCase(),
          status: d.status || 'ACTIVE',
          isLive: true,
          lastLocationTime: new Date().toISOString(),
          district: d.city || d.location?.city,
          state: d.state || d.location?.state,
          icon: `community_${(d.category || 'hazard').toLowerCase()}`
        };
        setMapFeatures((prev) => [newRep, ...prev.filter(p => p.id !== newRep.id)]);
      }
    });

    // 5. Alert Created
    const unsubAlertCreated = RealtimeService.on('ALERT_CREATED', (evt: RealtimeEvent) => {
      const d = evt.data || {};
      const lat = d.latitude;
      const lon = d.longitude;
      if (lat && lon) {
        const newAlert: MapFeatureItem = {
          id: `alert_${d.id}`,
          layer: 'hazards',
          coordinates: [lat, lon],
          title: d.title || `Official Alert: ${d.hazard_type}`,
          description: d.description || d.instructions || '',
          category: d.hazard_type || 'WEATHER',
          severity: (d.severity || 'HIGH').toUpperCase(),
          status: 'ACTIVE',
          isLive: true,
          lastLocationTime: new Date().toISOString(),
          district: d.district_name,
          state: d.state_name,
          icon: 'alert_broadcast'
        };
        setMapFeatures((prev) => [newAlert, ...prev.filter(p => p.id !== newAlert.id)]);
      }
    });

    return () => {
      unsubSOSCreated();
      unsubResponderLoc();
      unsubSOSStatus();
      unsubSOSResolved();
      unsubSOSCancelled();
      unsubReportCreated();
      unsubAlertCreated();
    };
  }, []);

  const handleSelectSavedLocation = (loc: SavedLocationItem) => {
    selectLocationItem(loc);
  };

  const handleAddLocation = (locData: Omit<SavedLocationItem, 'id'>) => {
    saveLocationItem(locData);
  };

  const handleRemoveLocation = (id: string) => {
    removeLocationItem(id);
  };

  const handleUseCurrentGPS = async () => {
    await requestCurrentGPS();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAuthoritativeMapData(currentCenter);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleViewSafetyGuide = (_slug?: string) => {
    onNavigate('safety');
  };

  return (
    <div className="max-w-[1720px] mx-auto space-y-6 font-sans">
      {/* 1. Page Header with Title, Subtitle, and Live Status Pill */}
      <LiveMapHeader
        lastUpdated="Telemetry Synchronized"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 2. Main Grid: Left = Location Map | Right = Technical Layers & Nearby Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Location Map (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <InteractiveLocationMap
            centerCoordinates={currentCenter}
            locationName={activeLocationName}
            activeTechnicalLayer={activeLayer}
            features={mapFeatures}
            selectedHazard={selectedHazard}
            onSelectHazard={(h) => setSelectedHazard(h)}
            onSelectCoordinates={(coords, name) => {
              selectLocationItem({
                id: `coord-${coords[0].toFixed(2)}-${coords[1].toFixed(2)}`,
                name,
                stateName: selectedLocation?.stateName || 'India',
                district: name,
                stateId: selectedLocation?.stateId || 'IN',
                coordinates: coords,
                riskScore: selectedLocation?.riskScore || 70,
                riskLevel: selectedLocation?.riskLevel || 'High',
              });
            }}
            onUseCurrentGPS={handleUseCurrentGPS}
            onViewSafetyGuide={handleViewSafetyGuide}
            heightClass="h-[620px]"
          />
        </div>

        {/* RIGHT COLUMN: Technical Layers & Nearby Activity Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <TechnicalLayerSwitcher
            activeLayer={activeLayer}
            onSelectLayer={(l) => setActiveLayer(l)}
            isRadarPlaying={isRadarPlaying}
            onToggleRadarPlay={() => setIsRadarPlaying(!isRadarPlaying)}
          />

          <NearbyActivityFeed
            activities={nearbyActivities}
            onSelectActivity={(act) => {
              setSelectedHazard(act);
            }}
            onViewSafetyGuide={handleViewSafetyGuide}
          />
        </div>
      </div>

      {/* 3. Below the Map: Saved Locations Manager */}
      <SavedLocationsList
        savedLocations={savedLocations}
        selectedLocationId={selectedLocation?.id || null}
        onSelectLocation={handleSelectSavedLocation}
        onAddLocation={handleAddLocation}
        onRemoveLocation={handleRemoveLocation}
      />
    </div>
  );
};
