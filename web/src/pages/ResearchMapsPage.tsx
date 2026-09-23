import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';

export const ResearchMapsPage: React.FC = () => {
  const { selectedLocation } = useLocation();
  const [selectedLayer, setSelectedLayer] = useState<'normal' | 'satellite' | 'cyclone' | 'radar' | 'wind' | 'rainfall' | 'temperature' | 'humidity' | 'cloud'>('radar');

  const layers = [
    { id: 'normal', label: 'Normal Map', desc: 'Standard geographic base' },
    { id: 'satellite', label: 'Satellite Map', desc: 'High-resolution multispectral imagery' },
    { id: 'cyclone', label: 'Cyclone Tracks', desc: 'IMD storm cone and track history' },
    { id: 'radar', label: 'Weather Radar', desc: 'Doppler precipitation reflectivity' },
    { id: 'wind', label: 'Wind Velocity', desc: 'Streamlines & gust vectors' },
    { id: 'rainfall', label: 'Rainfall Distribution', desc: '24h accumulated precipitation' },
    { id: 'temperature', label: 'Surface Temperature', desc: 'Thermal radiometric anomalies' },
    { id: 'humidity', label: 'Relative Humidity', desc: 'Atmospheric moisture index' },
    { id: 'cloud', label: 'Cloud Cover', desc: 'Infrared cloud top telemetry' },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      <div className="border-b border-slate-200 dark:border-[#27272a] pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Scientific & Environmental Research Maps
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#a1a1aa]">
            Dedicated multi-layer research GIS workspace for academic & environmental monitoring.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#18181b] px-3 py-1 rounded-full border border-slate-200 dark:border-[#27272a]">
          GIS Active: {selectedLayer.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Floating Layer Selector (1 Col) */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-4 shadow-xs dark:shadow-md space-y-2">
          <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">
            Research Map Layers
          </p>
          <div className="space-y-1.5">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id as any)}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                  selectedLayer === layer.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold shadow-xs'
                    : 'hover:bg-slate-100 dark:hover:bg-[#18181b] text-slate-700 dark:text-[#a1a1aa] border border-transparent'
                }`}
              >
                <p className="leading-tight">{layer.label}</p>
                <p className={`text-[10px] font-normal mt-0.5 ${selectedLayer === layer.id ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}>{layer.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dominant Map View (3 Cols) */}
        <div className="lg:col-span-3 h-[600px] bg-slate-50 dark:bg-[#0a0a0c] rounded-2xl border border-slate-200 dark:border-[#27272a] overflow-hidden relative flex items-center justify-center text-slate-900 dark:text-white shadow-xs dark:shadow-md">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 text-6xl">satellite_alt</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Displaying Layer: <span className="text-slate-900 dark:text-white font-bold">{selectedLayer.toUpperCase()}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sector: {selectedLocation?.name || 'Visakhapatnam'} &bull; Coverage: Pan-India
            </p>
          </div>

          {/* Floating Time Slider & Legend Controls */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-md rounded-xl p-3 border border-slate-200 dark:border-[#27272a] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
            <span className="font-mono">Timestamp: 2026-09-22 18:00 IST</span>
            <span>Resolution: 1.2km High-Precision Mesh</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchMapsPage;
