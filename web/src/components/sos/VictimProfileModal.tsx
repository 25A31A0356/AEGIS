import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { StateVictimProfile } from '../../data/stateVictimBeacons';
import { X, Phone, Users, ShieldAlert, Battery, Radio, MapPin, CheckCircle2, HeartHandshake } from 'lucide-react';

interface VictimProfileModalProps {
  victim: StateVictimProfile | null;
  isOpen: boolean;
  onClose: () => void;
  userLocation?: [number, number] | null;
  onOfferHelp?: (victim: StateVictimProfile) => void;
}

export const VictimProfileModal: React.FC<VictimProfileModalProps> = ({
  victim,
  isOpen,
  onClose,
  userLocation,
  onOfferHelp,
}) => {
  const [isAidDispatched, setIsAidDispatched] = useState<boolean>(false);

  if (!isOpen || !victim) return null;

  // Calculate approximate distance
  let distanceKm = 1.2;
  if (userLocation && victim.coordinates) {
    const [lat1, lon1] = userLocation;
    const [lat2, lon2] = victim.coordinates;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = Math.max(0.5, Math.round(R * c * 10) / 10);
  }

  const estimatedEtaMinutes = Math.max(3, Math.round(distanceKm * 2.2));

  const handleHelpAction = () => {
    setIsAidDispatched(true);
    if (onOfferHelp) {
      onOfferHelp(victim);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0c0c0e] rounded-3xl border-2 border-red-600 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto"
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. MODAL HEADER */}
        <div className="p-5 border-b border-slate-200 dark:border-[#27272a] bg-red-50/70 dark:bg-red-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black font-mono text-base flex items-center justify-center shadow-lg shadow-red-600/30 ring-4 ring-red-500/20 shrink-0">
              SOS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase text-red-600 dark:text-red-400">
                  ACTIVE DISTRESS • {victim.state.toUpperCase()}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-600 text-white">
                  {victim.id}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {victim.victimName} <span className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">(Needs Help)</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Close Victim Profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
          {/* Hero Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] text-center">
            <div>
              <div className="text-base font-black text-red-600 dark:text-red-400 font-mono">
                {distanceKm} km
              </div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Distance Away
              </div>
            </div>
            <div className="border-x border-slate-200 dark:border-[#27272a]">
              <div className="text-base font-black text-sky-600 dark:text-sky-400 font-mono">
                ~{estimatedEtaMinutes} min
              </div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Est. Response ETA
              </div>
            </div>
            <div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-center justify-center gap-1">
                <Battery className="w-4 h-4" />
                {victim.batteryPercent}%
              </div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                {victim.signalStatus}
              </div>
            </div>
          </div>

          {/* Emergency Situation Summary */}
          <div className="p-4 rounded-2xl bg-red-500/10 dark:bg-red-950/30 border border-red-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase text-red-700 dark:text-red-300">
                EMERGENCY SITUATION
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white">
                CRITICAL
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
              {victim.emergencyTitle}
            </h4>
            {victim.medicalConditions && (
              <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white/60 dark:bg-black/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40">
                "{victim.medicalConditions}"
              </p>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium pt-1">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{victim.locationName} ({victim.district}, {victim.state})</span>
            </div>
          </div>

          {/* Direct Emergency & Family Contacts */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              DIRECT EMERGENCY CONTACTS
            </h3>

            {/* Victim Direct Phone */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#27272a]">
              <div>
                <div className="text-[10px] font-bold text-slate-500">SOS Victim Direct Phone</div>
                <div className="text-xs font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {victim.rawPhone || victim.phoneMasked}
                </div>
              </div>
              <a
                href={`tel:${(victim.rawPhone || victim.phoneMasked).replace(/\s+/g, '')}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-sm shadow-red-600/30"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Victim</span>
              </a>
            </div>

            {/* Family Contact */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#27272a]">
              <div>
                <div className="text-[10px] font-bold text-slate-500">
                  Family ({victim.familyRelationship} • {victim.familyContactName})
                </div>
                <div className="text-xs font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {victim.familyContactPhone}
                </div>
              </div>
              <a
                href={`tel:${victim.familyContactPhone.replace(/\s+/g, '')}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-sm"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Call Family</span>
              </a>
            </div>

            {/* Incident Jurisdiction Police Station */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#27272a]">
              <div className="max-w-[70%]">
                <div className="text-[10px] font-bold text-slate-500">Nearby Police Station (Jurisdiction)</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {victim.nearbyPoliceStationName}
                </div>
                <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {victim.nearbyPoliceStationPhone}
                </div>
              </div>
              <a
                href={`tel:${victim.nearbyPoliceStationPhone.replace(/\s+/g, '')}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold transition-all shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Police</span>
              </a>
            </div>

            {/* Hometown Police Desk */}
            {victim.hometownPoliceStationName && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#27272a]">
                <div className="max-w-[70%]">
                  <div className="text-[10px] font-bold text-slate-500">Hometown Control Desk</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {victim.hometownPoliceStationName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    {victim.hometownPoliceStationPhone}
                  </div>
                </div>
                <a
                  href={`tel:${victim.hometownPoliceStationPhone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Control</span>
                </a>
              </div>
            )}
          </div>

          {/* Technical Telemetry */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#18181b] text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#27272a]">
            <span>GPS: {victim.coordinates[0].toFixed(5)}°N, {victim.coordinates[1].toFixed(5)}°E (±{victim.gpsAccuracyMeters}m)</span>
            <span>Elev: {victim.elevationMeters}m</span>
          </div>
        </div>

        {/* 3. FOOTER ACTION */}
        <div className="p-4 border-t border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#111111]">
          {isAidDispatched || victim.triageStatus === 'RESPONDER_EN_ROUTE' || victim.triageStatus === 'ACCEPTED' ? (
            <div className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30">
              <CheckCircle2 className="w-5 h-5" />
              <span>Aid Dispatched & Responder Active for {victim.victimName}</span>
            </div>
          ) : (
            <button
              onClick={handleHelpAction}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm transition-all shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <HeartHandshake className="w-5 h-5" />
              <span>Offer Help & Dispatch Aid to {victim.victimName}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default VictimProfileModal;
