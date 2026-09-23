import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { useSOS } from '../context/SOSContext';
import { HazardService } from '../services/hazardService';
import { SOSBeacon } from '../types/sos';

export const LiveMapPage: React.FC = () => {
  const { selectedLocation } = useLocation();
  const { beacons, updateBeaconTriage } = useSOS();
  const hazards = HazardService.getAllHazards();

  const [mapMode, setMapMode] = useState<'weather' | 'sos'>('weather');
  const [selectedWeatherLayer, setSelectedWeatherLayer] = useState<'temperature' | 'rainfall' | 'wind' | 'humidity' | 'cloud' | 'alerts'>('rainfall');
  const [selectedBeacon, setSelectedBeacon] = useState<SOSBeacon | null>(null);

  const city = selectedLocation?.name || 'Visakhapatnam';

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header & Map Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            AEGIS Operational GIS Maps
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#a1a1aa]">
            High-clarity tactical geographic views for Republic of India.
          </p>
        </div>

        {/* Mode Toggle: Weather Map vs SOS Map */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#111111] p-1.5 rounded-xl border border-slate-200 dark:border-[#27272a] shadow-xs">
          <button
            onClick={() => setMapMode('weather')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mapMode === 'weather'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-slate-600 dark:text-[#a1a1aa] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Weather Map
          </button>
          <button
            onClick={() => setMapMode('sos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapMode === 'sos'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-[#a1a1aa] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>SOS Map</span>
            {beacons.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-700 text-white">
                {beacons.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative w-full h-[580px] bg-slate-100 dark:bg-[#0a0a0c] rounded-2xl border border-slate-200 dark:border-[#27272a] overflow-hidden shadow-xs dark:shadow-md">
        {/* Floating Layer Control Panel (Weather Map Mode) */}
        {mapMode === 'weather' && (
          <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-[#27272a] p-3.5 shadow-xl space-y-2 text-xs">
            <p className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">
              Weather Overlays
            </p>
            <div className="flex flex-col gap-1">
              {(['temperature', 'rainfall', 'wind', 'humidity', 'cloud', 'alerts'] as const).map((layer) => (
                <label
                  key={layer}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    selectedWeatherLayer === layer ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold' : 'hover:bg-slate-100 dark:hover:bg-[#18181b] text-slate-600 dark:text-[#a1a1aa]'
                  }`}
                >
                  <input
                    type="radio"
                    name="weather_layer"
                    checked={selectedWeatherLayer === layer}
                    onChange={() => setSelectedWeatherLayer(layer)}
                    className="accent-slate-900 dark:accent-white"
                  />
                  <span className="capitalize">{layer}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Map Canvas with Geographic Silhouette */}
        <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white relative">
          <div className="text-center space-y-2 z-0">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 text-6xl">public</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {mapMode === 'weather' ? `India Weather GIS • Active Layer: ${selectedWeatherLayer.toUpperCase()}` : 'National SOS Distress Grid (Aggregated Clustered Events)'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Centering on: {city} &bull; Coordinates: {selectedLocation?.coordinates?.join(', ') || '17.68, 83.21'}
            </p>
          </div>

          {/* SOS Markers Simulation when in SOS Mode */}
          {mapMode === 'sos' && (
            <div className="absolute inset-0 p-8 flex flex-wrap items-center justify-around pointer-events-none">
              {beacons.slice(0, 5).map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBeacon(b)}
                  className="pointer-events-auto p-2 rounded-xl bg-red-600 text-white text-xs font-bold font-mono shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  SOS &times; {i === 0 ? 3 : 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Slide-in SOS Details Panel */}
        {selectedBeacon && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-4 shadow-2xl space-y-3 animate-in slide-in-from-right text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#27272a]">
              <div>
                <span className="text-[10px] font-bold font-mono uppercase bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                  {selectedBeacon.triageStatus}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                  {selectedBeacon.id}
                </h4>
              </div>
              <button onClick={() => setSelectedBeacon(null)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#18181b]">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-1.5 text-slate-600 dark:text-[#a1a1aa]">
              <p><span className="font-semibold text-slate-800 dark:text-white">District:</span> {selectedBeacon.district || 'Local Sector'}</p>
              <p><span className="font-semibold text-slate-800 dark:text-white">Emergency:</span> {selectedBeacon.emergencyType}</p>
              <p><span className="font-semibold text-slate-800 dark:text-white">Phone (Masked):</span> {selectedBeacon.phoneMasked || '+91 98**** 3210'}</p>
              <p><span className="font-semibold text-slate-800 dark:text-white">Persons in Need:</span> {selectedBeacon.personsCount || 1}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#27272a] flex gap-2">
              <button
                onClick={() => updateBeaconTriage(selectedBeacon.id, 'ACCEPTED')}
                className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-black font-bold transition-all shadow-xs cursor-pointer"
              >
                Acknowledge
              </button>
              <button
                onClick={() => updateBeaconTriage(selectedBeacon.id, 'RESOLVED')}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs cursor-pointer"
              >
                Resolve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMapPage;
