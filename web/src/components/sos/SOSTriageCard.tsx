import React from 'react';
import { SOSBeacon, SOSTriageStatus } from '../../types/sos';
import {
  MapPin,
  Navigation,
  Car,
} from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface SOSTriageCardProps {
  beacon: SOSBeacon;
  isSelected: boolean;
  onSelect: (beacon: SOSBeacon) => void;
  onUpdateStatus: (id: string, newStatus: SOSTriageStatus) => void;
  onSimulateRoute: (beacon: SOSBeacon) => void;
}

export const SOSTriageCard: React.FC<SOSTriageCardProps> = ({
  beacon,
  isSelected,
  onSelect,
  onUpdateStatus,
  onSimulateRoute,
}) => {
  const { t } = useTranslation();
  const isIncoming = beacon.triageStatus === 'PENDING' || beacon.triageStatus === 'MATCHING' || beacon.triageStatus === 'OFFERED' || beacon.triageStatus === 'incoming';
  const isAccepted = beacon.triageStatus === 'ACCEPTED' || beacon.triageStatus === 'acknowledged';
  const isEnRoute = beacon.triageStatus === 'RESPONDER_EN_ROUTE' || beacon.triageStatus === 'dispatching';
  const isOnSite = beacon.triageStatus === 'ON_SITE' || beacon.triageStatus === 'on_scene';
  const isResolved = beacon.triageStatus === 'RESOLVED' || beacon.triageStatus === 'resolved';
  const isCancelled = beacon.triageStatus === 'CANCELLED' || beacon.triageStatus === 'cancelled';

  const getStatusBadge = () => {
    if (isIncoming) return 'bg-red-600 text-white animate-pulse';
    if (isAccepted) return 'bg-amber-500 text-white';
    if (isEnRoute) return 'bg-sky-600 text-white';
    if (isOnSite) return 'bg-purple-600 text-white';
    if (isResolved) return 'bg-emerald-600 text-white';
    if (isCancelled) return 'bg-slate-500 text-white';
    return 'bg-slate-500 text-white';
  };

  const formatDisplayStatus = () => {
    if (isIncoming) return 'PENDING';
    if (isAccepted) return 'ACCEPTED';
    if (isEnRoute) return 'EN ROUTE';
    if (isOnSite) return 'ON SCENE';
    if (isResolved) return 'RESOLVED';
    if (isCancelled) return 'CANCELLED';
    return beacon.triageStatus.replace(/_/g, ' ');
  };

  return (
    <div
      onClick={() => onSelect(beacon)}
      className={`p-4 rounded-2xl border transition-all cursor-pointer font-sans ${
        isSelected
          ? 'bg-red-50/40 dark:bg-red-950/30 border-red-500 shadow-elevated ring-1 ring-red-500/30'
          : 'bg-white dark:bg-[#071828] border-slate-200 dark:border-[#1E3347] hover:border-slate-300 dark:hover:border-slate-600 shadow-card'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-extrabold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
            {beacon.id}
          </span>
          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${getStatusBadge()}`}>
            {formatDisplayStatus()}
          </span>
          {beacon.isLiveBackend && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-slate-500">
          <span>{new Date(beacon.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Title & Masked Caller */}
      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 leading-snug mb-0.5">
        {beacon.emergencyTitle}
      </h4>
      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">
        Citizen: <span className="font-bold text-slate-700 dark:text-slate-300">{beacon.anonymousAlias || 'Citizen'}</span> ({beacon.phoneMasked || 'Redacted'})
      </div>

      {/* Location */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{beacon.locationName}</span>
      </div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-[#0B1E30] border border-slate-100 dark:border-[#1E3347] font-mono text-[10px] mb-3 text-center">
        <div>
          <span className="text-slate-400 dark:text-slate-500 block">SOULS</span>
          <span className="font-bold text-slate-900 dark:text-slate-200">{beacon.personsCount} Pers</span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block">BATTERY</span>
          <span className={`font-bold ${beacon.batteryPercent < 20 ? 'text-red-600' : 'text-slate-900 dark:text-slate-200'}`}>
            {beacon.batteryPercent}%
          </span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block">GPS FIX</span>
          <span className="font-bold text-slate-900 dark:text-slate-200">±{beacon.gpsAccuracyMeters}m</span>
        </div>
      </div>

      {/* Assigned Responder Unit if dispatched */}
      {beacon.assignedUnit && (
        <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-[11px] mb-3 text-sky-900 dark:text-sky-200 space-y-1">
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
              <span>{beacon.assignedUnit.callsign}</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200 px-1.5 py-0.2 rounded">
              {beacon.assignedUnit.unitType}
            </span>
          </div>
          <div className="text-[10px] font-mono text-sky-700 dark:text-sky-300 flex items-center justify-between">
            <span>Cmd: {beacon.assignedUnit.commanderName}</span>
            <span className="font-bold">ETA {beacon.assignedUnit.etaMinutes}m ({beacon.assignedUnit.distanceKm} km)</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-[#1E3347]">
        {isIncoming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(beacon.id, 'ACCEPTED');
            }}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Acknowledge
          </button>
        )}

        {(isIncoming || isAccepted) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(beacon.id, 'RESPONDER_EN_ROUTE');
            }}
            className="flex-1 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Dispatch Unit
          </button>
        )}

        {isEnRoute && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(beacon.id, 'ON_SITE');
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Mark On-Scene
          </button>
        )}

        {isOnSite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(beacon.id, 'RESOLVED');
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Mark Resolved
          </button>
        )}

        {/* Get Emergency Route Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSimulateRoute(beacon);
          }}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#0B1E30] hover:bg-sky-100 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 border border-slate-200 dark:border-[#1E3347] transition-colors cursor-pointer"
          title="Compute Emergency Navigation Driving Path"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
