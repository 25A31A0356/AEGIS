import React from 'react';
import { HazardItem } from '../../types/hazard';
import {
  X,
  Clock,
  ShieldCheck,
  Phone,
  MapPin,
} from 'lucide-react';
import { SafetyAdviceCard } from './SafetyAdviceCard';

interface HazardDetailModalProps {
  hazard: HazardItem | null;
  onClose: () => void;
  onViewOnMap?: (hazard: HazardItem) => void;
}

export const HazardDetailModal: React.FC<HazardDetailModalProps> = ({
  hazard,
  onClose,
  onViewOnMap,
}) => {
  if (!hazard) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  hazard.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {hazard.nature.toUpperCase()} • {hazard.severity.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Bulletin ID: {hazard.source.bulletinId}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              {hazard.title}
            </h2>
            <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{hazard.location.district}, {hazard.location.state}</span>
              <span>•</span>
              <span>Issued by {hazard.source.agency}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Overview */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-2">
              Official Bulletin Synopsis
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {hazard.description}
            </p>
          </div>

          {/* Meteorological / Incident Telemetry Grid */}
          {hazard.metrics && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-2">
                Ground & Atmospheric Telemetry
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                {hazard.metrics.windSpeedKmph && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">SUSTAINED GALE</span>
                    <span className="text-base font-extrabold text-slate-900">{hazard.metrics.windSpeedKmph} km/h</span>
                  </div>
                )}
                {hazard.metrics.rainfallMm && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">PRECIPITATION</span>
                    <span className="text-base font-extrabold text-slate-900">{hazard.metrics.rainfallMm} mm</span>
                  </div>
                )}
                {hazard.metrics.floodLevelMeters && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">RIVER STAGE</span>
                    <span className="text-base font-extrabold text-red-600">{hazard.metrics.floodLevelMeters} m</span>
                  </div>
                )}
                {hazard.metrics.populationAtRisk && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">AT-RISK POPULATION</span>
                    <span className="text-base font-extrabold text-slate-900">{hazard.metrics.populationAtRisk.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lifecycle Timeline Progression */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              Event Lifecycle Progression
            </h4>
            <div className="border-l-2 border-slate-200 ml-3 space-y-4 pl-4 py-1">
              {hazard.timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-white ring-2 ring-slate-300" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-900">{step.stage}</span>
                    <span className="text-[11px] font-mono text-slate-400">({step.time})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Source: {step.source}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Safety Protocol Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Actionable "What Should I Do?" Safety Protocols
            </h4>
            <div className="space-y-2.5">
              {hazard.safetyAdvice.map((action, idx) => (
                <SafetyAdviceCard key={idx} action={action} />
              ))}
            </div>
          </div>

          {/* Emergency Helplines for this incident */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-2">
              Designated Emergency Desks
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hazard.emergencyContacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{contact.name}</div>
                    <div className="text-amber-400 font-mono font-bold mt-0.5">{contact.phone}</div>
                  </div>
                  <a
                    href={`tel:${contact.phone.split('/')[0].trim()}`}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-600 text-white transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            Valid until: {new Date(hazard.source.validUntil).toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <button
                onClick={() => {
                  onViewOnMap(hazard);
                  onClose();
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                View on Live GIS Map
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
