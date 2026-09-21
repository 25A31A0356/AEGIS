/**
 * AEGIS ALERT - Dedicated Google SOS Map Component
 * Renders the authoritative emergency distress tracking grid over India.
 * Implements native Google Maps JavaScript API with custom SVG status pins, responder live tracking,
 * route polylines, and seamless fallback if offline or in keyless dev environment.
 */

import React, { useEffect, useRef, useState } from 'react';
import { SOSBeacon } from '../../types/sos';
import { SimulatedRoute } from '../../services/routingService';
import { GoogleMapsLoader, GoogleMapsLoadingStatus } from '../../services/googleMapsLoader';
import { Crosshair, Layers, Radio, ShieldCheck, MapPin } from 'lucide-react';
import { IndiaSafetyMap, MapLayersState } from './IndiaSafetyMap';
import { DEMO_STATES } from '../../data/demoStates';
import { DEMO_SHELTERS } from '../../data/demoShelters';

interface GoogleSOSMapProps {
  beacons: SOSBeacon[];
  selectedBeacon: SOSBeacon | null;
  onSelectSOS: (beaconId: string) => void;
  activeRoute?: SimulatedRoute | null;
  userLocation?: [number, number] | null;
  heightClass?: string;
}

export const GoogleSOSMap: React.FC<GoogleSOSMapProps> = ({
  beacons,
  selectedBeacon,
  onSelectSOS,
  activeRoute,
  userLocation,
  heightClass = 'h-[520px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const responderMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  const [loaderStatus, setLoaderStatus] = useState<GoogleMapsLoadingStatus>(() => GoogleMapsLoader.getStatus());
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  useEffect(() => {
    const unsub = GoogleMapsLoader.onStatusChange((status) => {
      setLoaderStatus(status);
    });
    GoogleMapsLoader.loadGoogleMaps().catch(() => {});
    return () => unsub();
  }, []);

  // Initialize Native Google Map
  useEffect(() => {
    if (loaderStatus !== 'LOADED' || !mapContainerRef.current) return;
    if (googleMapInstanceRef.current) return;

    try {
      const initialCenter = selectedBeacon
        ? { lat: selectedBeacon.coordinates[0], lng: selectedBeacon.coordinates[1] }
        : userLocation
        ? { lat: userLocation[0], lng: userLocation[1] }
        : { lat: 20.5937, lng: 78.9629 };

      const map = new google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: selectedBeacon ? 11 : userLocation ? 9 : 5,
        mapTypeId: mapType,
        disableDefaultUI: true,
        zoomControl: false,
        styles: [
          {
            featureType: 'administrative.country',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#075B8A' }, { weight: 1.5 }],
          },
        ],
      });

      googleMapInstanceRef.current = map;
    } catch (err) {
      console.warn('[GoogleSOSMap] Failed to initialize Google Maps JS Map instance:', err);
    }
  }, [loaderStatus, mapType]);

  // Update Google Map Type
  useEffect(() => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Pan to Selected Beacon
  useEffect(() => {
    if (!googleMapInstanceRef.current || !selectedBeacon) return;
    googleMapInstanceRef.current.panTo({
      lat: selectedBeacon.coordinates[0],
      lng: selectedBeacon.coordinates[1],
    });
    googleMapInstanceRef.current.setZoom(12);
  }, [selectedBeacon]);

  // Render Markers on Native Google Map
  useEffect(() => {
    const map = googleMapInstanceRef.current;
    if (!map || loaderStatus !== 'LOADED') return;

    // Clear existing markers & polylines
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();
    responderMarkersRef.current.forEach((m) => m.setMap(null));
    responderMarkersRef.current.clear();
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    // Add SOS Markers
    beacons.forEach((beacon) => {
      const isIncoming = beacon.triageStatus === 'PENDING' || beacon.triageStatus === 'incoming';
      const isResolved = beacon.triageStatus === 'RESOLVED' || beacon.triageStatus === 'resolved';
      const isOnSite = beacon.triageStatus === 'ON_SITE' || beacon.triageStatus === 'on_scene';
      const isEnRoute = beacon.triageStatus === 'RESPONDER_EN_ROUTE' || beacon.triageStatus === 'ACCEPTED';

      const pinColor = isIncoming
        ? '#DC2626'
        : isEnRoute
        ? '#0284C7'
        : isOnSite
        ? '#7C3AED'
        : isResolved
        ? '#059669'
        : '#D97706';

      const svgIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: pinColor,
        fillOpacity: 0.95,
        scale: isIncoming ? 12 : 9,
        strokeColor: '#FFFFFF',
        strokeWeight: 2.5,
      };

      const marker = new google.maps.Marker({
        position: { lat: beacon.coordinates[0], lng: beacon.coordinates[1] },
        map,
        title: `${beacon.id} - ${beacon.emergencyTitle}`,
        icon: svgIcon,
      });

      marker.addListener('click', () => {
        onSelectSOS(beacon.id);
      });

      markersRef.current.set(beacon.id, marker);

      // Responder unit marker
      if (
        beacon.assignedUnit?.responderCoordinates &&
        beacon.triageStatus !== 'RESOLVED' &&
        beacon.triageStatus !== 'CANCELLED'
      ) {
        const respCoords = beacon.assignedUnit.responderCoordinates;
        const respMarker = new google.maps.Marker({
          position: { lat: respCoords[0], lng: respCoords[1] },
          map,
          title: `Responder: ${beacon.assignedUnit.callsign}`,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#0284C7',
            fillOpacity: 1,
            scale: 6,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });

        respMarker.addListener('click', () => {
          onSelectSOS(beacon.id);
        });

        responderMarkersRef.current.set(beacon.id, respMarker);

        // Polyline connecting responder to beacon
        const pathLine = new google.maps.Polyline({
          path: [
            { lat: respCoords[0], lng: respCoords[1] },
            { lat: beacon.coordinates[0], lng: beacon.coordinates[1] },
          ],
          geodesic: true,
          strokeColor: '#0284C7',
          strokeOpacity: 0.85,
          strokeWeight: 3,
          map,
        });

        polylinesRef.current.push(pathLine);
      }
    });

    // Active simulated dispatch route
    if (activeRoute && activeRoute.waypoints.length > 0) {
      const routePath = activeRoute.waypoints.map((w) => ({ lat: w[0], lng: w[1] }));
      const activeLine = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#2563EB',
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map,
      });
      polylinesRef.current.push(activeLine);
    }
  }, [beacons, activeRoute, loaderStatus, onSelectSOS]);

  const handleRecenterGPS = () => {
    if (googleMapInstanceRef.current && userLocation) {
      googleMapInstanceRef.current.panTo({ lat: userLocation[0], lng: userLocation[1] });
      googleMapInstanceRef.current.setZoom(12);
    }
  };

  const handleZoomIn = () => {
    if (googleMapInstanceRef.current) {
      const curr = googleMapInstanceRef.current.getZoom() || 5;
      googleMapInstanceRef.current.setZoom(curr + 1);
    }
  };

  const handleZoomOut = () => {
    if (googleMapInstanceRef.current) {
      const curr = googleMapInstanceRef.current.getZoom() || 5;
      googleMapInstanceRef.current.setZoom(curr - 1);
    }
  };

  // If Google Maps JS API is loaded, render native Google Map Canvas
  if (loaderStatus === 'LOADED') {
    return (
      <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 shadow-card bg-slate-900`}>
        {/* Google Map Div */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Top-Left Floating Badge */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-card text-[11px] font-mono text-slate-800 flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span className="font-bold text-slate-900">GOOGLE MAPS SOS MAP</span>
          <span className="text-slate-400">• {beacons.length} Active Distress Beacons</span>
        </div>

        {/* Bottom-Left Map / Satellite Toggle */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
          <button
            onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
            className="flex items-center gap-2 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 px-3 py-2 rounded-xl shadow-card border border-slate-200 text-xs font-semibold transition-all hover:shadow-md cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>{mapType === 'roadmap' ? 'Google Satellite' : 'Google Streets'}</span>
          </button>
        </div>

        {/* Bottom-Right Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 items-center pointer-events-auto">
          {userLocation && (
            <button
              onClick={handleRecenterGPS}
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-blue-600 shadow-card border border-slate-200 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              title="Recenter on My Location"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          )}

          <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex flex-col divide-y divide-slate-100">
            <button
              onClick={handleZoomIn}
              className="w-9 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-base cursor-pointer"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              className="w-9 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-base cursor-pointer"
              title="Zoom out"
            >
              −
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Resilient Vector Canvas Fallback (Active when keyless, offline, or loading)
  const mapLayers: MapLayersState = {
    weatherRadar: false,
    isobarWinds: false,
    floodInundation: true,
    cycloneTrack: false,
    wildfireHotspots: false,
    earthquakes: false,
    sosBeacons: true,
    safeShelters: true,
    baseLayer: 'light',
  };

  return (
    <div className="relative">
      <IndiaSafetyMap
        hazards={[]}
        states={DEMO_STATES}
        sosBeacons={beacons}
        shelters={DEMO_SHELTERS}
        activeRoute={activeRoute}
        layers={mapLayers}
        userLocation={userLocation}
        onSelectSOS={onSelectSOS}
        scope="india"
        heightClass={heightClass}
      />
      {loaderStatus === 'LOADING' && (
        <div className="absolute top-3 right-3 z-400 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-blue-200 text-blue-800 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-spin" />
          <span>Connecting Google Maps GIS...</span>
        </div>
      )}
    </div>
  );
};
