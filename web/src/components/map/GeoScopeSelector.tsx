import React from 'react';
import { Map, LocateFixed } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export const GeoScopeSelector: React.FC = () => {
  const { isGpsActive, detectCurrentLocation, resetToNational } = useLocation();

  return (
    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
      <button
        onClick={resetToNational}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          !isGpsActive
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Map className={`w-3.5 h-3.5 ${!isGpsActive ? 'text-sky-600' : 'text-slate-400'}`} />
        <span>India National Grid</span>
      </button>

      <button
        onClick={detectCurrentLocation}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isGpsActive
            ? 'bg-white text-sky-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <LocateFixed className={`w-3.5 h-3.5 ${isGpsActive ? 'text-sky-600 animate-spin' : 'text-slate-400'}`} />
        <span>{isGpsActive ? 'My GPS Sector Locked' : 'Locate My GPS'}</span>
        {isGpsActive && (
          <span className="text-[9px] font-mono bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">
            LIVE
          </span>
        )}
      </button>
    </div>
  );
};
