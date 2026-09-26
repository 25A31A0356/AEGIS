import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
  Tooltip,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  Crosshair,
  Compass,
  Layers,
  PhoneCall,
  Clock,
  Radio,
} from 'lucide-react';
import { TechnicalLayerType } from './TechnicalLayerSwitcher';
import { MapService } from '../../services/mapService';
import { LocationService, NearbyActivityItem } from '../../services/locationService';

export interface MapFeatureItem {
  id: string;
  layer: 'hazards' | 'reports' | 'sos_beacons' | 'responders' | 'shelters' | 'road_hazards' | 'safe_events' | string;
  coordinates: [number, number];
  title: string;
  description: string;
  category: string;
  severity: string;
  status?: string;
  isLive?: boolean;
  lastLocationTime?: string;
  callerName?: string;
  casualtiesCount?: number;
  batteryPercent?: number;
  responderId?: string;
  sosId?: string;
  etaSeconds?: number;
  distanceMeters?: number;
  capacity?: number;
  amenities?: string[];
  district?: string;
  state?: string;
  icon?: string;
}

interface InteractiveLocationMapProps {
  centerCoordinates: [number, number];
  locationName: string;
  activeTechnicalLayer: TechnicalLayerType;
  features?: MapFeatureItem[];
  hazards?: NearbyActivityItem[];
  selectedHazard: NearbyActivityItem | null;
  onSelectHazard: (hazard: NearbyActivityItem) => void;
  onSelectCoordinates: (coords: [number, number], name: string) => void;
  onUseCurrentGPS: () => void;
  onViewSafetyGuide?: (slug: string) => void;
  heightClass?: string;
}

const MapCenterController: React.FC<{ center: [number, number]; zoom: number }> = ({
  center,
  zoom,
}) => {
  const map = useMap();
  const lastCenterKeyRef = React.useRef<string>("");

  React.useEffect(() => {
    const key = `${center[0].toFixed(3)}_${center[1].toFixed(3)}`;
    if (key !== lastCenterKeyRef.current) {
      lastCenterKeyRef.current = key;
      const currentZoom = map.getZoom();
      map.setView(center, currentZoom >= 13 ? currentZoom : zoom, { animate: true, duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
};

const GoogleLiveMapControls: React.FC<{
  onRecenter: () => void;
}> = ({ onRecenter }) => {
  return (
    <div className="absolute bottom-4 right-4 z-400 flex flex-col gap-2 items-center pointer-events-auto">
      <button
        type="button"
        onClick={onRecenter}
        className="w-10 h-10 rounded-xl bg-white dark:bg-[#071828] hover:bg-slate-50 dark:hover:bg-[#0B1E30] text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-[#18C3D0] shadow-card border border-slate-200 dark:border-[#1E3347] flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
        title="Refresh & Center Location"
      >
        <Crosshair className="w-5 h-5 text-blue-600 dark:text-[#18C3D0]" />
      </button>
    </div>
  );
};

// 1. SOS Distress Beacon Marker Icon
const createSOSBeaconIcon = (status: string = 'TRIGGERED') => {
  const isIncoming = status === 'TRIGGERED' || status === 'PENDING';
  const color = isIncoming ? '#DC2626' : '#EA580C';
  return L.divIcon({
    className: 'agies-sos-pin',
    html: `
      <div class="relative flex flex-col items-center justify-center -translate-y-4 cursor-pointer group">
        <div class="absolute -top-1 w-9 h-9 rounded-full bg-red-600/40 animate-ping"></div>
        <div class="w-8 h-8 rounded-full border-2 border-white shadow-elevated flex items-center justify-center text-white text-[10px] font-black font-mono" style="background-color: ${color};">
          SOS
        </div>
        <div class="w-1.5 h-1.5 rotate-45 -mt-0.5 shadow-sm" style="background-color: ${color};"></div>
      </div>
    `,
    iconSize: [32, 36],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// 2. Active Responder Marker Icon (Live GPS vs Last Known)
const createResponderMarkerIcon = (callsign: string, isLive: boolean = true) => {
  const badgeColor = isLive ? 'bg-sky-500' : 'bg-slate-500';
  return L.divIcon({
    className: 'agies-responder-pin',
    html: `
      <div class="relative flex flex-col items-center justify-center -translate-y-3 cursor-pointer group">
        ${isLive ? '<div class="absolute -top-1 w-8 h-8 rounded-full bg-sky-500/35 animate-ping"></div>' : ''}
        <div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-sky-400 shadow-elevated flex items-center justify-center text-xs text-white">
          🚑
        </div>
        <span class="mt-0.5 px-1.5 py-0.2 rounded ${badgeColor} text-white text-[8px] font-mono font-bold whitespace-nowrap shadow-xs">
          ${callsign.substring(0, 14)}
        </span>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 34],
    popupAnchor: [0, -34],
  });
};

// 3. Relief Shelter Marker Icon
const createShelterIcon = () => {
  return L.divIcon({
    className: 'agies-shelter-pin',
    html: `
      <div class="w-6 h-6 rounded-lg bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[11px]">
        🏠
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// 3b. Emergency Medical & Civil Defense Facility Icon
const createFacilityIcon = (category: string = 'hospital') => {
  const isHospital = category.toLowerCase().includes('hospital') || category.toLowerCase().includes('medical');
  const isFire = category.toLowerCase().includes('fire');
  const emoji = isHospital ? '🏥' : isFire ? '🚒' : '🏢';
  const color = isHospital ? '#059669' : isFire ? '#DC2626' : '#2563EB';
  return L.divIcon({
    className: 'agies-facility-pin',
    html: `
      <div class="w-6 h-6 rounded-lg border-2 border-white shadow-md flex items-center justify-center text-white text-[11px]" style="background-color: ${color};">
        ${emoji}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// 4. Hazard & Community Report Marker Icon
const createHazardPinIcon = (type: string, severity: string) => {
  let color = '#EA4335';
  let iconHtml = '⚠️';

  switch (type?.toLowerCase()) {
    case 'flood':
    case 'heavy rain':
      color = severity.toLowerCase() === 'critical' ? '#EA4335' : '#4285F4';
      iconHtml = '🌊';
      break;
    case 'cyclone':
      color = '#FBBC04';
      iconHtml = '🌀';
      break;
    case 'lightning':
      color = '#FBBC04';
      iconHtml = '⚡';
      break;
    case 'fire':
      color = '#EA4335';
      iconHtml = '🔥';
      break;
    case 'earthquake':
      color = '#EA4335';
      iconHtml = '⚡';
      break;
    default:
      color = '#EA4335';
      iconHtml = '⛔';
      break;
  }

  return L.divIcon({
    className: 'agies-hazard-pin',
    html: `
      <div class="relative flex flex-col items-center justify-center -translate-y-4 cursor-pointer group">
        <div class="w-7 h-7 rounded-full border-2 border-white shadow-float flex items-center justify-center text-xs font-bold" style="background-color: ${color};">
          <span>${iconHtml}</span>
        </div>
        <div class="w-1.5 h-1.5 rotate-45 -mt-0.5 shadow-sm" style="background-color: ${color};"></div>
      </div>
    `,
    iconSize: [28, 32],
    iconAnchor: [14, 30],
    popupAnchor: [0, -30],
  });
};

// Active Center Location Pin
const createActiveLocationPinIcon = (label: string) => {
  return L.divIcon({
    className: 'agies-center-pin',
    html: `
      <div class="relative flex flex-col items-center justify-center -translate-y-4 cursor-pointer">
        <div class="absolute -top-2 w-10 h-10 rounded-full bg-[#18C3D0]/35 animate-ping"></div>
        <div class="w-8 h-8 rounded-2xl bg-[#075B8A] border-2 border-[#18C3D0] shadow-float flex items-center justify-center text-white">
          <svg class="w-4 h-4 text-[#18C3D0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#18C3D0"/>
          </svg>
        </div>
        <span class="mt-0.5 px-2 py-0.5 rounded-full bg-[#075B8A] text-[#18C3D0] text-[9px] font-mono font-bold tracking-tight shadow-xs whitespace-nowrap">
          ${label}
        </span>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

export const InteractiveLocationMap: React.FC<InteractiveLocationMapProps> = ({
  centerCoordinates,
  locationName,
  activeTechnicalLayer,
  features = [],
  hazards: _hazards,
  selectedHazard: _selectedHazard,
  onSelectHazard,
  onSelectCoordinates,
  onUseCurrentGPS,
  onViewSafetyGuide: _onViewSafetyGuide,
  heightClass = 'h-[580px]',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom] = useState(11);
  const [isSatellite, setIsSatellite] = useState(activeTechnicalLayer === 'satellite');

  const tileProvider = MapService.getTileProvider(
    isSatellite || activeTechnicalLayer === 'satellite' ? 'satellite' : 'streets'
  );

  const radarCells = MapService.getRadarStormCells(centerCoordinates);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    try {
      const results = await LocationService.searchLocation(trimmed);
      if (results && results.length > 0) {
        const top = results[0];
        onSelectCoordinates(top.coordinates, top.name);
      } else {
        onSelectCoordinates([centerCoordinates[0] + 0.015, centerCoordinates[1] + 0.015], trimmed);
      }
    } catch {
      onSelectCoordinates([centerCoordinates[0] + 0.015, centerCoordinates[1] + 0.015], trimmed);
    }
    setSearchQuery('');
  };

  // Build connecting polylines between active responders and their target SOS beacons
  const connectingPolylines: { from: [number, number]; to: [number, number]; label: string }[] = [];
  const sosMap = new Map<string, [number, number]>();

  features.forEach(f => {
    if (f.layer === 'sos_beacons' && f.sosId) {
      sosMap.set(f.sosId, f.coordinates);
    }
  });

  features.forEach(f => {
    if (f.layer === 'responders' && f.sosId && sosMap.has(f.sosId)) {
      const targetCoords = sosMap.get(f.sosId)!;
      connectingPolylines.push({
        from: f.coordinates,
        to: targetCoords,
        label: `${f.title} → Target SOS`
      });
    }
  });

  return (
    <div className="bg-white dark:bg-[#071828] rounded-[20px] border border-[#DCEBED] dark:border-[#1E3347] p-5 shadow-card font-sans space-y-4">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#DCEBED] dark:border-[#1E3347]">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#075B8A] dark:text-[#18C3D0]" />
            <h3 className="font-extrabold text-sm text-[#075B8A] dark:text-[#18C3D0] uppercase tracking-wider font-sans">
              Live Emergency Operations Map
            </h3>
          </div>
          <p className="text-[11px] text-[#708696] dark:text-slate-400 mt-0.5">
            Authoritative PostGIS GIS Stream • Active Sector: <strong className="text-[#18364A] dark:text-white">{locationName}</strong>
          </p>
        </div>

        {/* Search Field & GPS Button */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#708696] dark:text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian district, city or state..."
              className="w-full bg-[#F4F8FA] dark:bg-[#0B1E30] border border-[#DCEBED] dark:border-[#1E3347] rounded-full pl-8 pr-3 py-1.5 text-xs text-[#18364A] dark:text-slate-100 placeholder:text-[#708696] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#18C3D0] focus:ring-1 focus:ring-[#18C3D0]"
            />
          </form>

          <button
            type="button"
            onClick={onUseCurrentGPS}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDFAFC] dark:bg-[#075B8A]/30 hover:bg-[#18C3D0] dark:hover:bg-[#18C3D0] text-[#075B8A] dark:text-[#18C3D0] hover:text-[#075B8A] dark:hover:text-[#071828] text-xs font-bold border border-[#AEEBF0] dark:border-[#1E3347] transition-colors shadow-xs shrink-0 cursor-pointer"
            title="Center on My Real GPS Location"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#075B8A] dark:text-[#18C3D0]" />
            <span className="hidden sm:inline">My GPS</span>
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-[#DCEBED] dark:border-[#1E3347] shadow-inner`}>
        <MapContainer
          center={centerCoordinates}
          zoom={zoom}
          zoomControl={false}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <MapCenterController center={centerCoordinates} zoom={zoom} />

          <TileLayer
            key={tileProvider.id + (isSatellite ? '-sat' : '-str')}
            url={tileProvider.url}
            attribution={tileProvider.attribution}
            subdomains={tileProvider.subdomains || ['0', '1', '2', '3']}
            maxZoom={tileProvider.maxZoom || 20}
          />

          <GoogleLiveMapControls
            onRecenter={() => onSelectCoordinates(centerCoordinates, locationName)}
            
          />

          {/* Center Location Pin */}
          <Marker
            position={centerCoordinates}
            icon={createActiveLocationPinIcon(locationName)}
          >
            <Popup>
              <div className="p-2 text-xs font-sans text-[#18364A]">
                <strong className="text-[#075B8A] block font-bold">{locationName}</strong>
                <span className="text-[10.5px] text-[#708696] font-mono">
                  Coordinates: {centerCoordinates[0].toFixed(4)}°N, {centerCoordinates[1].toFixed(4)}°E
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Dynamic Polylines between Responders and SOS Targets */}
          {connectingPolylines.map((line, idx) => (
            <Polyline
              key={`polyline_${idx}`}
              positions={[line.from, line.to]}
              pathOptions={{
                color: '#0284C7',
                weight: 3,
                dashArray: '6, 8',
                opacity: 0.85,
              }}
            />
          ))}

          {/* Radar Reflectivity Rings Overlay */}
          {activeTechnicalLayer === 'radar' &&
            radarCells.map((cell) => {
              const { fill, stroke } = MapService.getRadarIntensityColor(cell.intensity);
              return (
                <Circle
                  key={cell.id}
                  center={cell.center}
                  radius={cell.radiusMeters}
                  pathOptions={{
                    color: stroke,
                    fillColor: fill,
                    fillOpacity: cell.intensity === 'heavy' ? 0.45 : cell.intensity === 'moderate' ? 0.3 : 0.18,
                    weight: 1.5,
                  }}
                >
                  <Tooltip permanent={false}>
                    <div className="text-[10px] font-mono">
                      <strong>{cell.intensity.toUpperCase()} RADAR CELL</strong>
                      <div>Reflectivity: {cell.dbz} dBZ</div>
                    </div>
                  </Tooltip>
                </Circle>
              );
            })}

          {/* Authoritative Feature Markers */}
          {features.map((feat) => {
            // 1. SOS Beacons
            if (feat.layer === 'sos_beacons') {
              return (
                <Marker
                  key={feat.id}
                  position={feat.coordinates}
                  icon={createSOSBeaconIcon(feat.status)}
                  eventHandlers={{
                    click: () => onSelectHazard({
                      id: feat.id,
                      hazardType: feat.category,
                      title: feat.title,
                      locationName: feat.district || 'Distress Zone',
                      distanceKm: LocationService.calculateDistanceKm(centerCoordinates, feat.coordinates),
                      timestamp: feat.lastLocationTime || 'Live',
                      severity: 'Critical',
                      coordinates: feat.coordinates,
                      source: 'Citizen SOS',
                      status: feat.status || 'Active',
                      recommendedAction: feat.description,
                      safetyGuideSlug: 'floods'
                    })
                  }}
                >
                  <Popup>
                    <div className="p-2.5 max-w-xs font-sans text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
                          {feat.id}
                        </span>
                        <span className="font-mono text-[9px] font-bold bg-red-100 text-red-800 px-1.5 py-0.5 rounded uppercase">
                          {feat.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mb-1">{feat.title}</h4>
                      <p className="text-[11px] text-slate-600 mb-1.5">{feat.description}</p>
                      <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 space-y-0.5">
                        <div>Casualties: <strong>{feat.casualtiesCount || 1}</strong> • Battery: {feat.batteryPercent || 100}%</div>
                        <div>GPS Fix: {feat.coordinates[0].toFixed(4)}°N, {feat.coordinates[1].toFixed(4)}°E</div>
                        {feat.lastLocationTime && (
                          <div className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Updated: {new Date(feat.lastLocationTime).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            }

            // 2. Responders
            if (feat.layer === 'responders') {
              return (
                <Marker
                  key={feat.id}
                  position={feat.coordinates}
                  icon={createResponderMarkerIcon(feat.title, feat.isLive)}
                >
                  <Popup>
                    <div className="p-2.5 max-w-xs font-sans text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sky-800">{feat.title}</span>
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${feat.isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          {feat.isLive ? 'LIVE GPS' : 'LAST KNOWN'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mb-1">{feat.description}</div>
                      <div className="text-[10px] font-mono text-slate-500 bg-sky-50 p-1.5 rounded border border-sky-200 space-y-0.5">
                        {feat.sosId && <div>Assigned SOS: <strong className="text-red-700">{feat.sosId}</strong></div>}
                        {feat.distanceMeters !== undefined && <div>Distance: {(feat.distanceMeters / 1000).toFixed(1)} km</div>}
                        <div>Last Telemetry: {feat.lastLocationTime ? new Date(feat.lastLocationTime).toLocaleTimeString() : 'N/A'}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            }

            // 3. Shelters
            if (feat.layer === 'shelters') {
              return (
                <Marker
                  key={feat.id}
                  position={feat.coordinates}
                  icon={createShelterIcon()}
                >
                  <Popup>
                    <div className="p-2 max-w-xs font-sans text-xs">
                      <strong className="text-emerald-800 block font-bold mb-0.5">🏠 {feat.title}</strong>
                      <div className="text-slate-600 text-[11px]">Capacity: {feat.capacity || 1000} persons</div>
                      <div className="text-slate-500 text-[10px] mt-1">Location: {feat.district}, {feat.state}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            }

            // 3b. Emergency Facilities (Hospitals, Fire, Civil Defense)
            if (feat.layer === 'facilities') {
              return (
                <Marker
                  key={feat.id}
                  position={feat.coordinates}
                  icon={createFacilityIcon(feat.category)}
                >
                  <Popup>
                    <div className="p-2 max-w-xs font-sans text-xs">
                      <strong className="text-emerald-800 dark:text-emerald-400 block font-bold mb-0.5">{feat.title}</strong>
                      <div className="text-slate-600 dark:text-slate-300 text-[11px] font-mono capitalize">Type: {feat.category}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-1">{feat.district || 'Sector'}, {feat.state || 'India'}</div>
                      {feat.status && <div className="text-[10px] font-bold font-mono text-emerald-600 mt-0.5">Status: {feat.status}</div>}
                    </div>
                  </Popup>
                </Marker>
              );
            }

            // 4. Hazards & Reports
            return (
              <Marker
                key={feat.id}
                position={feat.coordinates}
                icon={createHazardPinIcon(feat.category, feat.severity)}
                eventHandlers={{
                  click: () => onSelectHazard({
                    id: feat.id,
                    hazardType: feat.category,
                    title: feat.title,
                    locationName: feat.district || 'Active Zone',
                    distanceKm: LocationService.calculateDistanceKm(centerCoordinates, feat.coordinates),
                    timestamp: feat.lastLocationTime || 'Observed',
                    severity: feat.severity === 'CRITICAL' ? 'Critical' : feat.severity === 'HIGH' ? 'Warning' : 'Watch',
                    coordinates: feat.coordinates,
                    source: feat.layer === 'reports' ? 'Community Report' : 'Official Observation',
                    status: feat.status || 'Active',
                    recommendedAction: feat.description,
                    safetyGuideSlug: 'floods'
                  })
                }}
              >
                <Popup>
                  <div className="p-2.5 max-w-xs font-sans text-xs">
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-600 text-white mb-1 inline-block">
                      {feat.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">{feat.title}</h4>
                    <p className="text-[11px] text-slate-600 mb-1">{feat.description}</p>
                    <div className="text-[10px] font-mono text-slate-400">
                      Coordinates: {feat.coordinates[0].toFixed(4)}°N, {feat.coordinates[1].toFixed(4)}°E
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Map Overlay Badge */}
        <div className="absolute top-3 left-3 z-400 bg-white/95 dark:bg-[#071828]/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-[#DCEBED] dark:border-[#1E3347] shadow-card text-[11px] font-mono text-[#075B8A] dark:text-[#18C3D0] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#18C3D0] animate-ping" />
          <span>Live Operations Layer • <strong>{features.length} Entities Streamed</strong></span>
        </div>
      </div>
    </div>
  );
};
