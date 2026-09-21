import React from 'react';
import { HazardItem } from '../../types/hazard';
import {
  AlertTriangle,
  Wind,
  Droplets,
  Zap,
  Mountain,
  Building2,
  Radiation,
  ChevronRight,
  MapPin,
} from 'lucide-react';

interface HazardCardProps {
  hazard: HazardItem;
  onClick: (hazard: HazardItem) => void;
}

export const HazardCard: React.FC<HazardCardProps> = ({ hazard, onClick }) => {
  const getCategoryIcon = () => {
    switch (hazard.category) {
      case 'cyclone':
        return <Wind className="w-5 h-5 text-red-500" />;
      case 'flood':
      case 'flash_flood':
        return <Droplets className="w-5 h-5 text-sky-500" />;
      case 'thunderstorm':
      case 'lightning':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'landslide':
      case 'earthquake':
        return <Mountain className="w-5 h-5 text-amber-700" />;
      case 'chemical_spill':
        return <Radiation className="w-5 h-5 text-emerald-600" />;
      case 'building_collapse':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getSeverityBadge = () => {
    switch (hazard.severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'moderate':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getNatureBadge = () => {
    switch (hazard.nature) {
      case 'incident':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-slate-800 text-white';
    }
  };

  return (
    <div
      onClick={() => onClick(hazard)}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card hover:border-slate-300 hover:shadow-elevated transition-all cursor-pointer group flex flex-col justify-between font-sans"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded shadow-xs ${getNatureBadge()}`}>
              {hazard.nature}
            </span>
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadge()}`}>
              {hazard.severity}
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            {hazard.id}
          </span>
        </div>

        {/* Title and Category */}
        <div className="flex items-start gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
            {getCategoryIcon()}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
              {hazard.title}
            </h4>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{hazard.location.district}, {hazard.location.state}</span>
            </div>
          </div>
        </div>

        {/* Headline Description */}
        <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
          {hazard.headline}
        </p>

        {/* Telemetry Metrics Chips if present */}
        {hazard.metrics && (
          <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {hazard.metrics.windSpeedKmph && (
              <div>
                <span className="text-[10px] text-slate-400 block">WIND SPEED</span>
                <span className="font-bold text-slate-900">{hazard.metrics.windSpeedKmph} km/h</span>
              </div>
            )}
            {hazard.metrics.rainfallMm && (
              <div>
                <span className="text-[10px] text-slate-400 block">24H RAINFALL</span>
                <span className="font-bold text-slate-900">{hazard.metrics.rainfallMm} mm</span>
              </div>
            )}
            {hazard.metrics.floodLevelMeters && (
              <div>
                <span className="text-[10px] text-slate-400 block">RIVER STAGE</span>
                <span className="font-bold text-red-600">{hazard.metrics.floodLevelMeters} m</span>
              </div>
            )}
            {hazard.metrics.populationAtRisk && (
              <div>
                <span className="text-[10px] text-slate-400 block">POPULATION AT RISK</span>
                <span className="font-bold text-slate-900">{hazard.metrics.populationAtRisk.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px] font-mono truncate max-w-[200px] text-slate-400">
          {hazard.source.agency}
        </span>
        <span className="text-xs font-bold text-slate-800 group-hover:text-red-600 flex items-center gap-1 transition-colors">
          View Protocol <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
};
