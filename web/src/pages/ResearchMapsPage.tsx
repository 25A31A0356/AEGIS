import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { IndiaSafetyMap, MapLayersState } from '../components/map/IndiaSafetyMap';
import { HazardService } from '../services/hazardService';
import { DEMO_STATES } from '../data/demoStates';
import { DEMO_SHELTERS } from '../data/demoShelters';

export const ResearchMapsPage: React.FC = () => {
  const { selectedLocation } = useLocation();
  const hazards = HazardService.getAllHazards();
  const [selectedLayer, setSelectedLayer] = useState<'normal' | 'satellite' | 'cyclone' | 'radar' | 'wind' | 'rainfall' | 'temperature' | 'humidity' | 'cloud'>('radar');

  const layers = [
    { id: 'normal', label: 'Streets Map', desc: 'Standard geographic base layer' },
    { id: 'satellite', label: 'Satellite Imagery', desc: 'High-resolution multispectral telemetry' },
    { id: 'cyclone', label: 'Cyclone Cones', desc: 'IMD storm cone and track history' },
    { id: 'radar', label: 'Doppler Radar', desc: 'Precipitation reflectivity radar' },
    { id: 'wind', label: 'Wind Velocity', desc: 'Streamlines & gust vectors' },
    { id: 'rainfall', label: 'Rainfall Inundation', desc: 'Flood basin accumulation' },
    { id: 'temperature', label: 'Thermal Anomaly', desc: 'Surface thermal gradients' },
  ];

  const mapLayers: MapLayersState = {
    weatherRadar: selectedLayer === 'radar' || selectedLayer === 'rainfall',
    isobarWinds: selectedLayer === 'wind',
    floodInundation: selectedLayer === 'rainfall',
    cycloneTrack: selectedLayer === 'cyclone',
    wildfireHotspots: selectedLayer === 'temperature',
    earthquakes: true,
    sosBeacons: false,
    safeShelters: true,
    baseLayer: selectedLayer === 'satellite' ? 'satellite' : 'dark',
  };

  const coords: [number, number] = selectedLocation?.coordinates && selectedLocation.coordinates.length === 2
    ? [selectedLocation.coordinates[0], selectedLocation.coordinates[1]]
    : [17.6868, 83.2185];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      <div className="border-b border-slate-200 dark:border-[#27272a] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Scientific & Environmental Research GIS
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#a1a1aa] mt-0.5">
            Dedicated multi-layer research GIS workspace for academic & atmospheric monitoring.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#18181b] px-3 py-1 rounded-full border border-slate-200 dark:border-[#27272a] self-start sm:self-auto">
          GIS Active: {selectedLayer.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Layer Selector */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-4 shadow-xs dark:shadow-md space-y-2">
          <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">
            Research GIS Layers
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

        {/* Dominant Map Canvas */}
        <div className="lg:col-span-3 h-[620px] rounded-2xl border border-slate-200 dark:border-[#27272a] overflow-hidden shadow-xs dark:shadow-md relative">
          <IndiaSafetyMap
            hazards={hazards}
            states={DEMO_STATES}
            sosBeacons={[]}
            shelters={DEMO_SHELTERS}
            layers={mapLayers}
            userLocation={coords}
            heightClass="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ResearchMapsPage;
