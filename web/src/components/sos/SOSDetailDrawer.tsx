import React, { useState } from 'react';
import { SOSBeacon, SOSTriageStatus } from '../../types/sos';
import {
  X,
  MapPin,
  Clock,
  Navigation,
  Car,
  Shield,
  Eye,
  UserCheck,
  Lock,
} from 'lucide-react';

interface SOSDetailDrawerProps {
  beacon: SOSBeacon | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: SOSTriageStatus, notes?: string) => void;
  onSimulateRoute: (beacon: SOSBeacon) => void;
  onOpenDispatchControl?: (beacon: SOSBeacon) => void;
  initialRole?: 'citizen' | 'responder' | 'admin';
}

export const SOSDetailDrawer: React.FC<SOSDetailDrawerProps> = ({
  beacon,
  onClose,
  onUpdateStatus,
  onSimulateRoute,
  onOpenDispatchControl,
  initialRole = 'responder',
}) => {
  const [operatorNote, setOperatorNote] = useState('');
  const [activeRoleView, setActiveRoleView] = useState<'citizen' | 'responder' | 'admin'>(initialRole);

  if (!beacon) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorNote.trim()) return;
    onUpdateStatus(beacon.id, beacon.triageStatus, operatorNote.trim());
    setOperatorNote('');
  };

  const isAccepted = beacon.triageStatus === 'ACCEPTED' || beacon.triageStatus === 'acknowledged';
  const isEnRoute = beacon.triageStatus === 'RESPONDER_EN_ROUTE' || beacon.triageStatus === 'dispatching';
  const isOnSite = beacon.triageStatus === 'ON_SITE' || beacon.triageStatus === 'on_scene';
  const isResolved = beacon.triageStatus === 'RESOLVED' || beacon.triageStatus === 'resolved';

  const isCitizenView = activeRoleView === 'citizen';
  const isResponderView = activeRoleView === 'responder' || activeRoleView === 'admin';
  const isAdminView = activeRoleView === 'admin';

  return (
    <div className="fixed inset-y-0 right-0 z-40 max-w-full flex pl-6 sm:pl-10">
      <div className="w-screen max-w-md bg-white dark:bg-[#071828] shadow-2xl border-l border-slate-200 dark:border-[#1E3347] flex flex-col font-sans animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 dark:bg-[#040D14] text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                {beacon.id}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {beacon.triageStatus.replace(/_/g, ' ')}
              </span>
              {beacon.isLiveBackend && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 flex items-center gap-1 border border-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE STREAM
                </span>
              )}
            </div>
            <h3 className="text-sm font-extrabold text-white leading-snug">
              {beacon.emergencyTitle}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {isCitizenView ? (
                <span>Area: <strong className="text-slate-200">{beacon.district}, {beacon.state}</strong></span>
              ) : (
                <span>Citizen: <strong className="text-slate-200">{beacon.anonymousAlias || 'Anonymous'}</strong> ({beacon.phoneMasked || 'Redacted'})</span>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role View Switcher */}
        <div className="px-4 py-2 bg-slate-100 dark:bg-[#0B1E30] border-b border-slate-200 dark:border-[#1E3347] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
            <Shield className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Role View:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveRoleView('citizen')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                activeRoleView === 'citizen' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-white dark:bg-[#071828] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setActiveRoleView('responder')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                activeRoleView === 'responder' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#071828] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Responder
            </button>
            <button
              onClick={() => setActiveRoleView('admin')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                activeRoleView === 'admin' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-[#071828] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Location & GPS Fix */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1E30] border border-slate-200 dark:border-[#1E3347]">
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">
              Geographic Region & Sector
            </div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{beacon.locationName}, {beacon.district}, {beacon.state}</span>
            </div>

            {/* Precision info displayed conditionally based on role */}
            {isResponderView ? (
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-2 grid grid-cols-3 gap-2 bg-white dark:bg-[#071828] p-2 rounded-lg border border-slate-100 dark:border-[#1E3347] text-center">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">LAT/LNG</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {beacon.coordinates[0].toFixed(3)}, {beacon.coordinates[1].toFixed(3)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">ACCURACY</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">±{beacon.gpsAccuracyMeters}m</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">BATTERY</span>
                  <span className={`font-bold ${beacon.batteryPercent < 20 ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'}`}>
                    {beacon.batteryPercent}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Exact coordinates protected. Approximate Sector: {beacon.district}, {beacon.state}.</span>
              </div>
            )}
          </div>

          {/* Citizen Public Safety Briefing */}
          {isCitizenView && (
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2 text-xs">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Public Emergency Notice</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                An active distress signal is currently registered in this sector. Emergency agencies have been alerted. Avoid unnecessary movement near lowlands and storm drainage basins.
              </p>
              <div className="bg-white dark:bg-[#071828] p-2.5 rounded-lg border border-blue-100 dark:border-blue-900 text-[11px] text-slate-600 dark:text-slate-400 font-mono space-y-1">
                <div>Severity: <strong className="text-red-600 uppercase">{beacon.severity}</strong></div>
                <div>Status: <strong className="text-blue-700 dark:text-blue-400 uppercase">{beacon.triageStatus.replace(/_/g, ' ')}</strong></div>
                <div>Timestamp: <strong>{new Date(beacon.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST</strong></div>
              </div>
                {onOpenDispatchControl && (
                  <button
                    onClick={() => onOpenDispatchControl(beacon)}
                    className="col-span-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Ranked Responder Match & Dispatch</span>
                  </button>
                )}
            </div>
          )}

          {/* Assigned Responder Unit Details (Responder / Admin View) */}
          {isResponderView && beacon.assignedUnit && (
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Assigned Responder Unit</span>
                </div>
                <span className="text-[9px] font-mono uppercase bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200 font-bold px-1.5 py-0.5 rounded">
                  {beacon.assignedUnit.unitType}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {beacon.assignedUnit.callsign} ({beacon.assignedUnit.unitName})
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Commander: <strong>{beacon.assignedUnit.commanderName}</strong> • Tel:{' '}
                <a href={`tel:${beacon.assignedUnit.commanderContact}`} className="text-sky-700 dark:text-sky-400 underline font-mono">
                  {beacon.assignedUnit.commanderContact}
                </a>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-white dark:bg-[#071828] p-2 rounded-lg border border-sky-100 dark:border-[#1E3347] font-mono text-[10px] text-center">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">ESTIMATED ETA</span>
                  <span className="text-xs font-extrabold text-sky-900 dark:text-sky-300">{beacon.assignedUnit.etaMinutes} Minutes</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">CORRIDOR DIST</span>
                  <span className="text-xs font-extrabold text-sky-900 dark:text-sky-300">{beacon.assignedUnit.distanceKm} km</span>
                </div>
              </div>
                {onOpenDispatchControl && (
                  <button
                    onClick={() => onOpenDispatchControl(beacon)}
                    className="col-span-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Ranked Responder Match & Dispatch</span>
                  </button>
                )}
            </div>
          )}

          {/* Medical & Situational Notes (Responder / Admin View) */}
          {isResponderView && (beacon.medicalConditions || beacon.specialNeeds) && (
            <div className="p-3.5 rounded-xl bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs">
              <div className="text-[10px] font-mono uppercase font-bold text-red-700 dark:text-red-400 mb-1">
                Medical & Extraction Assessment
              </div>
              {beacon.medicalConditions && (
                <div className="text-slate-800 dark:text-slate-200 mb-1">
                  <strong>Medical Conditions:</strong> {beacon.medicalConditions}
                </div>
              )}
              {beacon.specialNeeds && (
                <div className="text-slate-800 dark:text-slate-200">
                  <strong>Special Extraction Needs:</strong> {beacon.specialNeeds}
                </div>
              )}
            </div>
          )}

          {/* Triage Action Transitions (Responder / Admin View) */}
          {isResponderView && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider mb-2">
                Dispatch State Machine
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onUpdateStatus(beacon.id, 'ACCEPTED')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                    isAccepted ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Acknowledge
                </button>

                <button
                  onClick={() => onUpdateStatus(beacon.id, 'RESPONDER_EN_ROUTE')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                    isEnRoute ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Dispatch Unit
                </button>

                <button
                  onClick={() => onUpdateStatus(beacon.id, 'ON_SITE')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                    isOnSite ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Mark On-Scene
                </button>

                <button
                  onClick={() => onUpdateStatus(beacon.id, 'RESOLVED')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                    isResolved ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Mark Resolved
                </button>
              </div>
                {onOpenDispatchControl && (
                  <button
                    onClick={() => onOpenDispatchControl(beacon)}
                    className="col-span-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Ranked Responder Match & Dispatch</span>
                  </button>
                )}
            </div>
          )}

          {/* Emergency Driving Route Simulator Trigger (Responder / Admin View) */}
          {isResponderView && (
            <div>
              <button
                onClick={() => onSimulateRoute(beacon)}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Generate Emergency Response Route</span>
              </button>
            </div>
          )}

          {/* Triage Log Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              Dispatch & Audit Log
            </h4>
            <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-3.5 pl-3 py-1">
              {beacon.timeline.map((evt, idx) => (
                <div key={idx} className="relative text-xs">
                  <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-100 border-2 border-white dark:border-[#071828] ring-1 ring-slate-300 dark:ring-slate-600" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{evt.action}</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{evt.timestamp}</span>
                  </div>
                  {isAdminView && <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">By: {evt.actor}</div>}
                  {evt.notes && (
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 bg-slate-50 dark:bg-[#0B1E30] p-1.5 rounded border border-slate-100 dark:border-[#1E3347]">
                      {evt.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operator Dispatch Note Form (Admin / Responder View) */}
          {isResponderView && (
            <form onSubmit={handleAddNote} className="pt-2 border-t border-slate-100 dark:border-[#1E3347]">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                Add Dispatcher / Incident Note
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={operatorNote}
                  onChange={(e) => setOperatorNote(e.target.value)}
                  placeholder="Log unit radio update or medical note..."
                  className="flex-1 bg-slate-50 dark:bg-[#0B1E30] border border-slate-200 dark:border-[#1E3347] text-slate-900 dark:text-slate-100 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Log
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
