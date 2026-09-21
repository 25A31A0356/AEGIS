import React from 'react';
import { Info } from 'lucide-react';

export const MapLegend: React.FC = () => {
  return (
    <div className="bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200 p-3 shadow-card font-sans text-xs">
      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-700 uppercase mb-2 pb-1.5 border-b border-slate-100">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span>Authoritative Symbology</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Severity Scale */}
        <div>
          <div className="text-[10px] font-mono text-slate-400 font-bold mb-1">RISK SEVERITY</div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
              <span className="text-slate-700 font-medium">Critical (Red)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-700 font-medium">Warning (Orange)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <span className="text-slate-700 font-medium">Moderate (Yellow)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-700 font-medium">Normal / Safe (Green)</span>
            </div>
          </div>
        </div>

        {/* Nature of Signal */}
        <div>
          <div className="text-[10px] font-mono text-slate-400 font-bold mb-1">SIGNAL NATURE</div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-[9px] bg-slate-800 text-white px-1 rounded">F</span>
              <span className="text-slate-700">Forecast (Modeled)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-[9px] bg-amber-600 text-white px-1 rounded">W</span>
              <span className="text-slate-700">Warning (Advisory)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-[9px] bg-red-600 text-white px-1 rounded">I</span>
              <span className="text-slate-700">Incident (Ground Event)</span>
            </div>
          </div>
        </div>

        {/* Tactical Markers */}
        <div>
          <div className="text-[10px] font-mono text-slate-400 font-bold mb-1">DISPATCH MARKERS</div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[8px] font-bold flex items-center justify-center">
                SOS
              </span>
              <span className="text-slate-700">Citizen SOS Beacon</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-indigo-600 text-white font-mono text-[9px] flex items-center justify-center">
                🏠
              </span>
              <span className="text-slate-700">Evacuation Shelter</span>
            </div>
          </div>
        </div>

        {/* Radar Reflectivity */}
        <div>
          <div className="text-[10px] font-mono text-slate-400 font-bold mb-1">RADAR (DWR)</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="h-3 flex-1 bg-gradient-to-r from-sky-400 via-amber-400 to-red-600 rounded-sm" />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-0.5">
            <span>20 dBZ (Light)</span>
            <span>65 dBZ (Severe)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
