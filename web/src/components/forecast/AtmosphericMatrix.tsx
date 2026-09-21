import React from 'react';
import { WeatherTelemetry } from '../../types/weather';
import { Sun, Eye, Cloud, Droplet, Sunrise } from 'lucide-react';

interface AtmosphericMatrixProps {
  weather: WeatherTelemetry;
}

export const AtmosphericMatrix: React.FC<AtmosphericMatrixProps> = ({ weather }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 font-sans">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 font-sans">
            Atmospheric & Solar Sensor Grid
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Ground Truth Environmental Telemetry
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          AUTOMATED STATION
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* UV Index */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono mb-1">
            <span>UV INDEX</span>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {weather.uvIndex} <span className="text-xs font-sans text-slate-500">/ 12</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold">{weather.uvStatus} Level</div>
        </div>

        {/* Solar Radiation */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono mb-1">
            <span>SOLAR FLUX</span>
            <Sun className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {weather.solarRadiationWm2}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">W / m²</div>
        </div>

        {/* Visibility */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono mb-1">
            <span>VISIBILITY</span>
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {weather.visibilityKm} <span className="text-xs font-sans text-slate-500">km</span>
          </div>
          <div className="text-[10px] text-slate-500">Optically Clear</div>
        </div>

        {/* Cloud Cover */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono mb-1">
            <span>CLOUD COVER</span>
            <Cloud className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {weather.cloudCoverPercent}%
          </div>
          <div className="text-[10px] text-slate-500">Cumulonimbus</div>
        </div>

        {/* Dew Point */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono mb-1">
            <span>DEW POINT</span>
            <Droplet className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {weather.dewPointCelsius}°C
          </div>
          <div className="text-[10px] text-slate-500">Saturation Index</div>
        </div>

        {/* Ephemeris */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-mono">
          <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
            <span>EPHEMERIS</span>
            <Sunrise className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-[11px] font-bold text-slate-800">
            Rise: {weather.sunrise}
          </div>
          <div className="text-[11px] font-bold text-slate-600">
            Set: {weather.sunset}
          </div>
        </div>
      </div>
    </div>
  );
};
