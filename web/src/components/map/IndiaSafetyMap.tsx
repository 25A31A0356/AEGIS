import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { HazardItem } from '../../types/hazard';
import { StateRiskData, SafeShelter, GeoScope } from '../../types/location';
import { SOSBeacon } from '../../types/sos';
import { SimulatedRoute } from '../../services/routingService';
import {
  Crosshair,
  Layers,
  PhoneCall,
  Wind,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import {
  INDIA_WIND_STREAMLINES,
  HEAVY_WIND_WARNING_ZONES,
  INDIA_ANEMOMETER_STATIONS,
  INDIA_ISOBAR_LINES,
} from '../../data/demoWindData';
import { TwoHourWindSnapshot } from '../../services/windService';
import { CycloneSnapshot, ACTIVE_CYCLONES_INDIA } from '../../services/cycloneService';

// Google Maps Style Teardrop Pin Marker
const createGooglePinIcon = (color: string, label: string, isPulsing: boolean = false) => {
  return L.divIcon({
    className: 'google-maps-pin',
    html: `
      <div class="relative flex flex-col items-center justify-center -translate-y-3 cursor-pointer group">
        ${isPulsing ? `<div class="absolute -top-1 w-8 h-8 rounded-full animate-ping opacity-40" style="background-color: ${color};"></div>` : ''}
        <svg class="w-7 h-7 drop-shadow-md transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="3.2" fill="white"/>
        </svg>
        <span class="absolute top-1.5 text-[8.5px] font-extrabold text-slate-900 font-mono tracking-tighter">${label}</span>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 32],
    popupAnchor: [0, -32],
  });
};

// Spinning Cyclone Vortex Icon
const createCycloneEyeIcon = (name: string, intensity: string) => {
  return L.divIcon({
    className: 'cyclone-eye-icon',
    html: `
      <div style="position:relative; width:68px; height:68px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
        <div style="position:absolute; width:68px; height:68px; border-radius:50%; border:3px dashed rgba(220, 38, 38, 0.7); animation: cycloneSpin 4s linear infinite;"></div>
        <div style="position:absolute; width:52px; height:52px; border-radius:50%; border:2px dashed rgba(245, 158, 11, 0.85); animation: cycloneSpinRev 3s linear infinite;"></div>
        <div style="width:34px; height:34px; border-radius:50%; background:#DC2626; border:3px solid #FFFFFF; box-shadow:0 0 16px rgba(220, 38, 38, 0.9); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:5;">
          <span style="font-size:16px; line-height:1; transform:scale(1.1);">🌀</span>
        </div>
        <div style="position:absolute; top:-24px; background:#DC2626; color:#FFFFFF; font-family:system-ui, -apple-system, sans-serif; font-weight:900; font-size:10.5px; padding:2px 8px; border-radius:12px; border:1.5px solid #FFFFFF; white-space:nowrap; box-shadow:0 3px 8px rgba(0,0,0,0.4); z-index:6;">
          CYCLONE ${name}
        </div>
        <div style="position:absolute; bottom:-18px; background:#1E293B; color:#FDE047; font-family:monospace; font-weight:800; font-size:9px; padding:1px 6px; border-radius:8px; border:1px solid #FDE047; white-space:nowrap; z-index:6;">
          ${intensity}
        </div>
      </div>
      <style>
        @keyframes cycloneSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes cycloneSpinRev {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
      </style>
    `,
    iconSize: [68, 68],
    iconAnchor: [34, 34],
    popupAnchor: [0, -34],
  });
};

// Cyclone Forecast Track Waypoint Node Marker
const createCycloneTrackPointIcon = (timeLabel: string, windSpeed: string, isLandfall: boolean = false) => {
  return L.divIcon({
    className: 'cyclone-track-point',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer;">
        <div style="width:${isLandfall ? '16px' : '12px'}; height:${isLandfall ? '16px' : '12px'}; border-radius:50%; background:${isLandfall ? '#DC2626' : '#EA580C'}; border:2.5px solid #FFFFFF; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
        <div style="position:absolute; top:-18px; background:rgba(15,23,42,0.85); color:#FFFFFF; font-family:monospace; font-size:8.5px; font-weight:bold; padding:1px 4px; border-radius:4px; white-space:nowrap; border:1px solid rgba(255,255,255,0.2);">
          ${timeLabel} (${windSpeed})
        </div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
};

// Wind Anemometer Station Marker
const createAnemometerIcon = (
  windSpeed: number,
  _gustSpeed: number,
  degrees: number,
  cardinal: string,
  _status: string
) => {
  let bgColor = '#10B981';
  if (windSpeed >= 80) bgColor = '#DC2626';
  else if (windSpeed >= 50) bgColor = '#EA580C';
  else if (windSpeed >= 35) bgColor = '#F59E0B';

  return L.divIcon({
    className: 'anemometer-station-marker',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;">
        <div style="width:30px; height:30px; border-radius:50%; background:${bgColor}; border:2px solid #FFFFFF; box-shadow:0 2px 8px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; transition:transform 0.4s ease;">
          <svg style="width:16px; height:16px; fill:#FFFFFF; transform:rotate(${degrees}deg);" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
        <div style="position:absolute; bottom:-16px; background:rgba(15,23,42,0.9); color:#FFFFFF; font-family:monospace; font-size:8.5px; font-weight:bold; padding:1px 5px; border-radius:4px; border:1px solid rgba(255,255,255,0.2); white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.3);">
          ${windSpeed}k (${cardinal})
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Wind Streamline Flow Node Label
const createStreamlineNodeIcon = (
  _name: string,
  speed: number,
  flowType: 'upstream' | 'downstream' | 'recirculating',
  color: string
) => {
  const badgeLabel = flowType === 'upstream' ? '▲ UPSTREAM' : '▼ DOWNSTREAM';
  return L.divIcon({
    className: 'streamline-flow-node',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;">
        <div style="width:10px; height:10px; border-radius:50%; background:${color}; border:2px solid #FFFFFF; box-shadow:0 0 6px ${color};"></div>
        <div style="position:absolute; top:-20px; background:rgba(15,23,42,0.85); color:#FFFFFF; font-family:system-ui, sans-serif; font-size:8px; font-weight:bold; padding:1px 4px; border-radius:4px; white-space:nowrap; border:1px solid ${color};">
          ${badgeLabel}: ${speed} km/h
        </div>
      </div>
    `,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -10],
  });
};

// Isobar Pressure Label Marker
const createIsobarLabelIcon = (pressureHpa: number) => {
  return L.divIcon({
    className: 'isobar-label-marker',
    html: `
      <div style="background:rgba(30,41,59,0.85); color:#38BDF8; font-family:monospace; font-size:8.5px; font-weight:bold; padding:1px 4px; border-radius:3px; border:1px solid rgba(56,189,248,0.4); white-space:nowrap;">
        ${pressureHpa} hPa
      </div>
    `,
    iconSize: [40, 16],
    iconAnchor: [20, 8],
  });
};

// Authentic Blinking Red Circle SOS Marker
const createSOSIcon = (status: string = 'PENDING', label?: string) => {
  const isEnRoute = status?.includes('RESPONDER') || status?.includes('EN ROUTE') || status?.includes('ACCEPTED');
  const isResolved = status === 'RESOLVED' || status === 'resolved';

  const badgeText = label || (isEnRoute ? 'AID EN ROUTE' : 'NEEDS HELP');
  const mainColor = isResolved ? '#059669' : '#DC2626';

  return L.divIcon({
    className: 'sos-blinking-marker',
    html: `
      <div style="position:relative; width:58px; height:58px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; width:58px; height:58px; border-radius:50%; background:rgba(220, 38, 38, 0.32); animation: sosRadarRing 1.8s infinite ease-out;"></div>
        <div style="position:absolute; width:42px; height:42px; border-radius:50%; background:rgba(220, 38, 38, 0.5); animation: sosRadarRing 1.8s infinite ease-out 0.45s;"></div>

        <div style="width:36px; height:36px; border-radius:50%; background:${mainColor}; border:3px solid #FFFFFF; box-shadow:0 4px 12px rgba(220,38,38,0.7); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:5; animation: sosBlinkGlow 1.2s infinite alternate;">
          <span style="color:#FFFFFF; font-family:system-ui, -apple-system, sans-serif; font-weight:900; font-size:11px; letter-spacing:0.8px; line-height:1;">SOS</span>
        </div>

        <div style="position:absolute; top:-24px; background:${mainColor}; color:#FFFFFF; font-family:system-ui, -apple-system, sans-serif; font-weight:900; font-size:10px; padding:2px 8px; border-radius:12px; border:1.5px solid #FFFFFF; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.35); z-index:6;">
          ${badgeText}
        </div>
      </div>
      <style>
        @keyframes sosRadarRing {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes sosBlinkGlow {
          0% { transform: scale(0.95); filter: brightness(1); box-shadow: 0 0 4px rgba(220,38,38,0.5); }
          100% { transform: scale(1.1); filter: brightness(1.3); box-shadow: 0 0 16px rgba(220,38,38,0.9); }
        }
      </style>
    `,
    iconSize: [58, 58],
    iconAnchor: [29, 29],
    popupAnchor: [0, -29],
  });
};

// Smart Map Camera Controller
const MapCameraController: React.FC<{
  targetCenter: [number, number];
  targetZoom: number;
  triggerKey: string;
}> = ({ targetCenter, targetZoom, triggerKey }) => {
  const map = useMap();
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    if (lastKeyRef.current !== triggerKey) {
      lastKeyRef.current = triggerKey;
      map.flyTo(targetCenter, targetZoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [triggerKey, targetCenter, targetZoom, map]);

  return null;
};

// Google Maps Floating Overlay Controls
const GoogleMapOverlayControls: React.FC<{
  baseLayer: MapLayersState['baseLayer'];
  showCycloneFocus?: boolean;
  onToggleLayer: () => void;
  onFocusCyclone?: () => void;
  userLocation?: [number, number] | null;
}> = ({ baseLayer, showCycloneFocus, onToggleLayer, onFocusCyclone, userLocation }) => {
  const map = useMap();

  return (
    <>
      <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onToggleLayer}
          className="flex items-center gap-2 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs font-semibold transition-all hover:shadow-lg cursor-pointer"
          title="Toggle Google Maps Satellite / Streets"
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>{baseLayer === 'satellite' ? 'Google Streets' : 'Google Satellite'}</span>
        </button>

        {showCycloneFocus && onFocusCyclone && (
          <button
            onClick={onFocusCyclone}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl shadow-md text-xs font-bold transition-all hover:scale-105 cursor-pointer animate-pulse"
            title="Focus on Active Cyclone Eye (Bay of Bengal)"
          >
            <span>🌀 Focus Cyclone Eye</span>
          </button>
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2 items-center pointer-events-auto">
        {userLocation && (
          <button
            onClick={() => map.flyTo(userLocation, 12, { animate: true, duration: 1.0 })}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 shadow-md border border-slate-200 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Recenter on My Live GPS Location"
          >
            <Crosshair className="w-4 h-4 text-blue-600" />
          </button>
        )}

        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col divide-y divide-slate-100">
          <button
            onClick={() => map.zoomIn()}
            className="w-9 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-base transition-colors cursor-pointer"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => map.zoomOut()}
            className="w-9 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-base transition-colors cursor-pointer"
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>
    </>
  );
};

export interface MapLayersState {
  weatherRadar: boolean;
  isobarWinds: boolean;
  floodInundation: boolean;
  cycloneTrack: boolean;
  wildfireHotspots: boolean;
  earthquakes: boolean;
  sosBeacons: boolean;
  safeShelters: boolean;
  weatherMap?: boolean;
  baseLayer: 'light' | 'dark' | 'satellite' | 'terrain';
}

interface IndiaSafetyMapProps {
  noRouteToVictims?: boolean;
  hazards?: HazardItem[];
  states?: StateRiskData[];
  sosBeacons?: SOSBeacon[];
  shelters?: SafeShelter[];
  activeRoute?: SimulatedRoute | null;
  layers?: MapLayersState;
  selectedState?: StateRiskData | null;
  selectedStateName?: string;
  userLocation?: [number, number] | null;
  customWindData?: TwoHourWindSnapshot;
  customCycloneData?: CycloneSnapshot;
  satelliteChannel?: string;
  onSelectState?: (state: StateRiskData) => void;
  onSelectHazard?: (hazardId: string) => void;
  onSelectSOS?: (sosId: string) => void;
  onToggleBaseLayer?: () => void;
  scope?: GeoScope;
  heightClass?: string;
}

export const STATE_COORDINATES: Record<string, { center: [number, number]; zoom: number }> = {
  'andhra pradesh': { center: [16.5, 80.6], zoom: 7 },
  'odisha': { center: [20.4, 85.5], zoom: 7.2 },
  'maharashtra': { center: [19.3, 75.3], zoom: 6.8 },
  'kerala': { center: [10.4, 76.4], zoom: 7.5 },
  'tamil nadu': { center: [11.1, 78.6], zoom: 7.2 },
  'west bengal': { center: [23.2, 87.8], zoom: 7 },
  'assam': { center: [26.2, 92.9], zoom: 7.2 },
  'gujarat': { center: [22.4, 71.8], zoom: 7 },
  'karnataka': { center: [14.5, 75.8], zoom: 7 },
  'delhi ncr': { center: [28.65, 77.22], zoom: 10 },
  'bay of bengal': { center: [16.8, 86.4], zoom: 6.2 },
  'arabian sea': { center: [12.5, 70.0], zoom: 6.2 },
};

export const IndiaSafetyMap: React.FC<IndiaSafetyMapProps> = ({
  hazards: _hazards = [],
  states: _states = [],
  sosBeacons = [],
  shelters: _shelters = [],
  activeRoute: _activeRoute,
  noRouteToVictims: _noRouteToVictims = true,
  layers = {
    weatherRadar: false,
    isobarWinds: false,
    floodInundation: false,
    cycloneTrack: false,
    wildfireHotspots: false,
    earthquakes: false,
    sosBeacons: false,
    safeShelters: false,
    baseLayer: 'light',
  },
  selectedState,
  selectedStateName = 'all',
  userLocation,
  customWindData,
  customCycloneData,
  onSelectState: _onSelectState,
  onSelectHazard,
  onSelectSOS,
  onToggleBaseLayer,
  scope: _scope = 'india',
  heightClass = 'h-[580px]',
}) => {
  const [currentBase, setCurrentBase] = useState<MapLayersState['baseLayer']>(layers.baseLayer || 'light');
  const [focusCycloneKey, setFocusCycloneKey] = useState<number>(0);

  useEffect(() => {
    if (layers.baseLayer) {
      setCurrentBase(layers.baseLayer);
    }
  }, [layers.baseLayer]);

  // Active Cyclonic Systems in North Indian Ocean (Bay of Bengal & Arabian Sea)
  const activeCycloneSystems = customCycloneData ? customCycloneData.systems : ACTIVE_CYCLONES_INDIA;
  const primaryCyclone = activeCycloneSystems.find(c => c.basin === 'Bay of Bengal') || activeCycloneSystems[0];

  // Determine target camera view
  const normalizedState = selectedStateName?.toLowerCase().trim() || 'all';
  let targetCenter: [number, number] = [22.5, 79.5];
  let targetZoom: number = 5;
  let triggerKey = `all-india-${focusCycloneKey}`;

  if (focusCycloneKey > 0 && layers.cycloneTrack && primaryCyclone) {
    targetCenter = primaryCyclone.center;
    targetZoom = 6.5;
    triggerKey = `cyclone-focus-${focusCycloneKey}`;
  } else if (selectedState) {
    targetCenter = selectedState.centerCoordinates;
    targetZoom = 7;
    triggerKey = `state-${selectedState.id}`;
  } else if (normalizedState !== 'all' && STATE_COORDINATES[normalizedState]) {
    targetCenter = STATE_COORDINATES[normalizedState].center;
    targetZoom = STATE_COORDINATES[normalizedState].zoom;
    triggerKey = `filter-${normalizedState}`;
  } else if (normalizedState !== 'all' && layers.sosBeacons && sosBeacons.length > 0) {
    const avgLat = sosBeacons.reduce((sum, b) => sum + b.coordinates[0], 0) / sosBeacons.length;
    const avgLng = sosBeacons.reduce((sum, b) => sum + b.coordinates[1], 0) / sosBeacons.length;
    targetCenter = [avgLat, avgLng];
    targetZoom = 7.5;
    triggerKey = `filter-custom-${normalizedState}`;
  }

  // Google Maps Tile Configuration
  const getGoogleTileConfig = () => {
    switch (currentBase) {
      case 'satellite':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          attribution: 'Map data &copy; Google Maps Satellite Imagery',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
        };
      case 'terrain':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          attribution: 'Map data &copy; Google Maps Terrain',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
        };
      case 'dark':
      case 'light':
      default:
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          attribution: 'Map data &copy; Google Maps',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
        };
    }
  };

  const tileConfig = getGoogleTileConfig();

  const handleToggleBase = () => {
    const next = currentBase === 'satellite' ? 'light' : 'satellite';
    setCurrentBase(next);
    if (onToggleBaseLayer) onToggleBaseLayer();
  };

  const handleFocusCyclone = () => {
    setFocusCycloneKey(prev => prev + 1);
  };

  // Active Wind Data
  const activeStreamlines = customWindData ? customWindData.streamlines : INDIA_WIND_STREAMLINES;
  const activeWarningZones = customWindData ? customWindData.warningZones : HEAVY_WIND_WARNING_ZONES;
  const activeAnemometers = customWindData ? customWindData.anemometers : INDIA_ANEMOMETER_STATIONS;
  const activeIsobars = customWindData ? customWindData.isobars : INDIA_ISOBAR_LINES;

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white`}>
      <MapContainer
        center={[22.5, 79.5]}
        zoom={5}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapCameraController
          targetCenter={targetCenter}
          targetZoom={targetZoom}
          triggerKey={triggerKey}
        />

        <TileLayer
          key={currentBase}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          subdomains={tileConfig.subdomains}
          maxZoom={tileConfig.maxZoom}
        />

        {layers.weatherRadar && (
          <TileLayer
            url="https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png"
            attribution="Radar &copy; RainViewer / IMD Doppler Network"
            opacity={0.65}
            maxZoom={18}
          />
        )}

        {/* ========================================================================= */}
        {/* DEDICATED WIND MAP: ONLY active when layers.isobarWinds === true          */}
        {/* ========================================================================= */}
        {layers.isobarWinds && (
          <>
            {activeWarningZones.map((zone) => (
              <Circle
                key={zone.id}
                center={zone.center}
                radius={zone.radiusMeters}
                pathOptions={{
                  color: zone.severity === 'extreme' ? '#DC2626' : zone.severity === 'severe' ? '#EA580C' : '#F59E0B',
                  fillColor: zone.severity === 'extreme' ? '#DC2626' : zone.severity === 'severe' ? '#EA580C' : '#F59E0B',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              >
                <Popup>
                  <div className="p-2.5 max-w-xs font-sans text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b pb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>{zone.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      Wind Speed: <strong className="text-red-700">{zone.currentWindKmh} km/h</strong> (Peak Gusts: <strong className="text-red-700">{zone.peakGustKmh} km/h</strong>)
                    </div>
                    <p className="text-[10.5px] text-slate-600 leading-tight">{zone.alertMessage}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Affected: {zone.affectedStates.join(', ')}
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {activeIsobars.map((isobar) => (
              <React.Fragment key={isobar.id}>
                <Polyline
                  positions={isobar.points}
                  pathOptions={{
                    color: '#38BDF8',
                    weight: 1.5,
                    opacity: 0.65,
                    dashArray: '4, 8',
                  }}
                />
                {isobar.points.length > 0 && (
                  <Marker
                    position={isobar.points[Math.floor(isobar.points.length / 2)]}
                    icon={createIsobarLabelIcon(isobar.pressureHpa)}
                  />
                )}
              </React.Fragment>
            ))}

            {activeStreamlines.map((stream) => {
              const isUpstream = stream.flowType === 'upstream';
              const midPoint = stream.points[Math.floor(stream.points.length / 2)];

              return (
                <React.Fragment key={stream.id}>
                  <Polyline
                    positions={stream.points}
                    pathOptions={{
                      color: stream.color,
                      weight: 7,
                      opacity: 0.25,
                    }}
                  />
                  <Polyline
                    positions={stream.points}
                    pathOptions={{
                      color: stream.color,
                      weight: stream.avgSpeedKmh > 80 ? 4 : 2.5,
                      opacity: 0.9,
                      dashArray: '10, 15',
                      className: 'wind-animated-streamline',
                    }}
                  />
                  <Marker
                    position={midPoint}
                    icon={createStreamlineNodeIcon(stream.name, stream.avgSpeedKmh, stream.flowType, stream.color)}
                  >
                    <Popup>
                      <div className="p-3 max-w-xs font-sans text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b pb-1">
                          <Wind className="w-4 h-4 text-blue-600" />
                          <span>{stream.name}</span>
                        </div>
                        <div className="text-[11px] space-y-1">
                          <div>Flow Type: <strong className={isUpstream ? 'text-blue-700' : 'text-emerald-700'}>{isUpstream ? '▲ Upstream Inflow / Jet' : '▼ Downstream Advection'}</strong></div>
                          <div>Velocity: <strong>{stream.avgSpeedKmh} km/h (Gusts {stream.maxGustKmh} km/h)</strong></div>
                          <div>Beaufort Rating: <strong className="text-amber-700">{stream.beaufortScale}</strong></div>
                          <div>Upstream Origin: <span className="text-slate-600">{stream.originRegion}</span></div>
                          <div>Downstream Destination: <span className="text-slate-600">{stream.destinationRegion}</span></div>
                        </div>
                        <p className="text-[10.5px] text-slate-600 leading-tight pt-1 border-t">{stream.description}</p>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}

            {activeAnemometers.map((station) => (
              <Marker
                key={station.id}
                position={station.coordinates}
                icon={createAnemometerIcon(
                  station.windSpeedKmh,
                  station.gustSpeedKmh,
                  station.directionDegrees,
                  station.cardinalDirection,
                  station.status
                )}
              >
                <Popup>
                  <div className="p-3 max-w-xs font-sans text-xs space-y-2">
                    <div className="flex items-center justify-between border-b pb-1">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-slate-900">{station.stationName}</h4>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        station.status === 'HURRICANE_FORCE' || station.status === 'GALE_WARNING'
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {station.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 font-sans">
                      <div>State: <strong>{station.state}</strong></div>
                      <div>Winds: <strong className="text-slate-900">{station.windSpeedKmh} km/h</strong> (Peak Gusts: <strong className="text-red-700">{station.gustSpeedKmh} km/h</strong>)</div>
                      <div>Wind Vector: <strong>{station.directionDegrees}° ({station.cardinalDirection})</strong></div>
                      <div>Barometric Pressure: <strong>{station.barometricPressureHpa} hPa</strong></div>
                      <div>Beaufort Scale: <strong className="text-amber-700">{station.beaufortCategory}</strong></div>
                      <div>Flow Dynamics: <strong className="text-blue-700">{station.flowRole}</strong></div>
                    </div>

                    <div className="text-[10.5px] text-slate-600 space-y-0.5 border-t pt-1">
                      <div>▲ <strong>Upstream Feed:</strong> {station.upstreamOrigin}</div>
                      <div>▼ <strong>Downstream Target:</strong> {station.downstreamTarget}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* ========================================================================= */}
        {/* DEDICATED CYCLONE MAP: ONLY active when layers.cycloneTrack === true       */}
        {/* ========================================================================= */}
        {layers.cycloneTrack &&
          activeCycloneSystems.map((cyclone) => {
            const pastPoints = cyclone.track.filter(t => !t.isEye && !t.label.includes('+') && !t.isLandfall).map(t => t.coords);
            const pastTrack = [...pastPoints, cyclone.center];

            const futurePoints = cyclone.track.filter(t => !t.isEye && (t.label.includes('+') || t.isLandfall)).map(t => t.coords);
            const forecastTrack = [cyclone.center, ...futurePoints];

            return (
              <React.Fragment key={cyclone.id}>
                {/* 1. Cone of Uncertainty */}
                {cyclone.conePolygon && (
                  <Polygon
                    positions={cyclone.conePolygon}
                    pathOptions={{
                      color: '#EA580C',
                      fillColor: '#EA580C',
                      fillOpacity: 0.18,
                      weight: 2,
                      dashArray: '6, 6',
                    }}
                  />
                )}

                {/* 2. Gale Wind Radii */}
                <Circle
                  center={cyclone.center}
                  radius={cyclone.galeRadiusKm * 1000}
                  pathOptions={{
                    color: '#DC2626',
                    fillColor: '#DC2626',
                    fillOpacity: 0.12,
                    weight: 1.5,
                  }}
                />
                <Circle
                  center={cyclone.center}
                  radius={cyclone.innerEyeRadiusKm * 1000}
                  pathOptions={{
                    color: '#B91C1C',
                    fillColor: '#B91C1C',
                    fillOpacity: 0.22,
                    weight: 2,
                  }}
                />

                {/* 3. Past & Projected Track */}
                {pastTrack.length > 1 && (
                  <Polyline
                    positions={pastTrack}
                    pathOptions={{
                      color: '#475569',
                      weight: 3.5,
                      opacity: 0.85,
                    }}
                  />
                )}
                {forecastTrack.length > 1 && (
                  <Polyline
                    positions={forecastTrack}
                    pathOptions={{
                      color: '#DC2626',
                      weight: 4,
                      dashArray: '8, 8',
                      opacity: 0.95,
                    }}
                  />
                )}

                {/* 4. Track Waypoint Markers */}
                {cyclone.track.map((pt, idx) => {
                  if (pt.isEye) return null;
                  return (
                    <Marker
                      key={idx}
                      position={pt.coords}
                      icon={createCycloneTrackPointIcon(pt.label, `${pt.windKmh} km/h`, pt.isLandfall)}
                    >
                      <Popup>
                        <div className="p-2.5 max-w-xs font-sans text-xs space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <span>🌀 {cyclone.name} Track Point</span>
                          </div>
                          <p className="text-slate-600">Time: <strong>{pt.time}</strong></p>
                          <p className="text-slate-600">Expected Winds: <strong className="text-red-600">{pt.windKmh} km/h</strong></p>
                          <p className="text-slate-600">Central Pressure: {pt.pressureHpa} hPa</p>
                          <p className="text-slate-600">Coordinates: {pt.coords[0].toFixed(2)}°N, {pt.coords[1].toFixed(2)}°E</p>
                          {pt.isLandfall && (
                            <div className="p-1.5 rounded bg-red-100 text-red-800 font-bold mt-1 text-[11px]">
                              ⚠️ Projected Landfall Zone: {cyclone.landfallTarget}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* 5. Active Cyclone Eye Spinning Vortex Marker */}
                <Marker
                  position={cyclone.center}
                  icon={createCycloneEyeIcon(cyclone.name, `${cyclone.intensityCode} • ${cyclone.windSpeedKmh} km/h`)}
                  eventHandlers={{
                    click: () => onSelectHazard && onSelectHazard('HAZ-2026-CYC-ARNAB'),
                  }}
                >
                  <Popup>
                    <div className="p-3 max-w-xs font-sans space-y-2">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">🌀</span>
                          <h3 className="font-black text-xs text-slate-900">
                            CYCLONE "{cyclone.name}" ({cyclone.basin})
                          </h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          cyclone.imdAlertLevel === 'RED_WARNING' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-black'
                        }`}>
                          {cyclone.imdAlertLevel.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] space-y-1">
                        <div>Classification: <strong className="text-red-700">{cyclone.category}</strong></div>
                        <div>Eye Coordinates: <strong>{cyclone.center[0]}°N, {cyclone.center[1]}°E ({cyclone.basin})</strong></div>
                        <div>Sustained Winds: <strong className="text-red-700">{cyclone.windSpeedKmh} km/h (Gusts {cyclone.gustSpeedKmh} km/h)</strong></div>
                        <div>Central Pressure: <strong>{cyclone.centralPressureHpa} hPa</strong></div>
                        <div>Movement: <strong>{cyclone.movementDirection} @ {cyclone.movementSpeedKmh} km/h</strong></div>
                        <div>Storm Surge: <strong>{cyclone.stormSurgeMeters}</strong></div>
                      </div>

                      <p className="text-[10.5px] text-slate-700 leading-snug">
                        {cyclone.synopticSummary}
                      </p>

                      <div className="text-[10px] font-mono text-slate-500 bg-slate-100 p-1.5 rounded border border-slate-200">
                        Source: IMD Cyclone Warning Division & ISRO MOSDAC INSAT-3DR
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* ========================================================================= */}
        {/* DEDICATED SOS RESCUE MAP: ONLY active when layers.sosBeacons === true     */}
        {/* ========================================================================= */}
        {layers.sosBeacons &&
          sosBeacons.map((sos) => {
            const alias = sos.anonymousAlias || (sos as any).victimName || 'Citizen in Distress';
            const distanceTag = (sos as any).distanceKm ? `${(sos as any).distanceKm} km` : 'SOS';
            const label = `${distanceTag} • ${alias.split(' ')[0]}`;

            return (
              <Marker
                key={sos.id}
                position={sos.coordinates}
                icon={createSOSIcon(sos.triageStatus, label)}
                eventHandlers={{
                  click: () => onSelectSOS && onSelectSOS(sos.id),
                }}
              >
                <Popup>
                  <div className="p-3 max-w-xs font-sans">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                        {sos.id}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          sos.triageStatus === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sos.triageStatus === 'ACCEPTED' || sos.triageStatus === 'RESPONDER_EN_ROUTE'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-red-100 text-red-800 animate-pulse'
                        }`}
                      >
                        {sos.triageStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 mb-1">
                      {sos.emergencyTitle}
                    </h4>
                    <div className="text-[11px] text-slate-600 mb-1">
                      📍 {sos.locationName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-200 mb-2 space-y-0.5">
                      <div>
                        Victim:{' '}
                        <span className="font-bold text-slate-800">
                          {(sos as any).victimName || sos.anonymousAlias || 'Citizen in Distress'}
                        </span>
                      </div>
                      <div>
                        Persons: <strong>{sos.personsCount}</strong> • Battery: {sos.batteryPercent}% • Signal: {(sos as any).signalStatus || '4G LTE'}
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectSOS && onSelectSOS(sos.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      View Victim Profile & Triage
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        <GoogleMapOverlayControls
          baseLayer={currentBase}
          showCycloneFocus={layers.cycloneTrack}
          onToggleLayer={handleToggleBase}
          onFocusCyclone={handleFocusCyclone}
          userLocation={userLocation}
        />
      </MapContainer>
    </div>
  );
};

export default IndiaSafetyMap;
