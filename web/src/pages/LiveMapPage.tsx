import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { useSOS } from '../context/SOSContext';
import { HazardService } from '../services/hazardService';
import { IndiaSafetyMap, MapLayersState } from '../components/map/IndiaSafetyMap';
import { DEMO_STATES } from '../data/demoStates';
import { DEMO_SHELTERS } from '../data/demoShelters';
import { SOSBeacon } from '../types/sos';
import { ShieldCheck, Radio } from 'lucide-react';

export const LiveMapPage: React.FC = () => {
  const { selectedLocation } = useLocation();
  const { beacons, updateBeaconTriage } = useSOS();
  const hazards = HazardService.getAllHazards();

  const [mapMode, setMapMode] = useState<'weather' | 'sos'>('weather');
  const [selectedBeacon, setSelectedBeacon] = useState<SOSBeacon | null>(null);

  const [mapLayers, setMapLayers] = useState<MapLayersState>({
    weatherRadar: true,
    isobarWinds: false,
    floodInundation: true,
    cycloneTrack: true,
    wildfireHotspots: false,
    earthquakes: true,
    sosBeacons: true,
    safeShelters: true,
    baseLayer: 'dark',
  });

  const city = selectedLocation?.name || 'Visakhapatnam';
  const coords: [number, number] = selectedLocation?.coordinates && selectedLocation.coordinates.length === 2
    ? [selectedLocation.coordinates[0], selectedLocation.coordinates[1]]
    : [17.6868, 83.2185];

  const toggleLayer = (key: keyof Omit<MapLayersState, 'baseLayer'>) => {
    setMapLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleBaseLayer = () => {
    setMapLayers((prev) => ({
      ...prev,
      baseLayer: prev.baseLayer === 'satellite' ? 'dark' : prev.baseLayer === 'dark' ? 'light' : 'satellite',
    }));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header & Tactical Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              AEGIS Operational GIS Maps
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#a1a1aa] mt-0.5">
            Real-time multi-hazard geospatial intelligence & tactical distress grid.
          </p>
        </div>

        {/* Mode Toggle: Weather & Hazard GIS vs SOS Command Map */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#111111] p-1.5 rounded-xl border border-slate-200 dark:border-[#27272a] shadow-xs">
          <button
            onClick={() => {
              setMapMode('weather');
              setMapLayers((prev) => ({ ...prev, weatherRadar: true, floodInundation: true, sosBeacons: false }));
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapMode === 'weather'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-slate-600 dark:text-[#a1a1aa] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Weather & Hazard GIS</span>
          </button>
          <button
            onClick={() => {
              setMapMode('sos');
              setMapLayers((prev) => ({ ...prev, sosBeacons: true, weatherRadar: false }));
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapMode === 'sos'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-[#a1a1aa] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>SOS Tactical Map</span>
            {beacons.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-700 text-white">
                {beacons.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Layer Pills Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Active Overlays:
        </span>
        {[
          { key: 'weatherRadar', label: 'Doppler Radar', icon: '🌧️' },
          { key: 'floodInundation', label: 'Flood Zones', icon: '🌊' },
          { key: 'cycloneTrack', label: 'Cyclone Cones', icon: '🌀' },
          { key: 'earthquakes', label: 'Seismic', icon: '⚡' },
          { key: 'safeShelters', label: 'Relief Shelters', icon: '🏥' },
          { key: 'sosBeacons', label: 'SOS Beacons', icon: '🚨' },
        ].map(({ key, label, icon }) => {
          const isActive = mapLayers[key as keyof typeof mapLayers];
          return (
            <button
              key={key}
              onClick={() => toggleLayer(key as any)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-transparent shadow-xs'
                  : 'bg-white dark:bg-[#111111] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#27272a] hover:border-slate-400'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative w-full h-[620px] rounded-2xl border border-slate-200 dark:border-[#27272a] overflow-hidden shadow-xs dark:shadow-md">
        <IndiaSafetyMap
          hazards={hazards}
          states={DEMO_STATES}
          sosBeacons={beacons}
          shelters={DEMO_SHELTERS}
          layers={mapLayers}
          userLocation={coords}
          onSelectSOS={(id) => {
            const found = beacons.find((b) => b.id === id);
            if (found) setSelectedBeacon(found);
          }}
          onToggleBaseLayer={toggleBaseLayer}
          heightClass="h-full"
        />

        {/* Slide-in SOS Details Panel */}
        {selectedBeacon && (
          <div className="absolute top-4 right-4 z-500 w-84 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-[#27272a] p-4 shadow-2xl space-y-3 animate-in slide-in-from-right text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#27272a]">
              <div>
                <span className="text-[10px] font-bold font-mono uppercase bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                  {selectedBeacon.triageStatus || 'ACTIVE DISTRESS'}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                  Beacon: {selectedBeacon.id}
                </h4>
              </div>
              <button
                onClick={() => setSelectedBeacon(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#18181b] cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-1.5 text-slate-600 dark:text-[#a1a1aa]">
              <p><span className="font-semibold text-slate-800 dark:text-white">Emergency:</span> {selectedBeacon.emergencyType}</p>
              <p><span className="font-semibold text-slate-800 dark:text-white">District:</span> {selectedBeacon.district || 'Local Sector'}</p>
              <p><span className="font-semibold text-slate-800 dark:text-white">Phone (Masked):</span> {selectedBeacon.phoneMasked || '+91 98*** **210'}</p>
              <p><span className="font-semibold text-slate-800 dark:text-white">Persons:</span> {selectedBeacon.personsCount || 1}</p>
              <p><span className="font-semibold text-slate-800 dark:text-white">Coordinates:</span> {selectedBeacon.coordinates.join(', ')}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#27272a] flex gap-2">
              <button
                onClick={() => {
                  updateBeaconTriage(selectedBeacon.id, 'ACCEPTED');
                  setSelectedBeacon(null);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-black font-bold transition-all shadow-xs cursor-pointer"
              >
                Dispatch Responder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMapPage;
