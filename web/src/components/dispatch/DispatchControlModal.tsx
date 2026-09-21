import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/apiClient';
import { SOSBeacon } from '../../types/sos';
import { Shield, UserCheck, Crosshair, Navigation, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';

interface DispatchControlModalProps {
  beacon: SOSBeacon;
  isOpen: boolean;
  onClose: () => void;
  onDispatchSuccess: (assignedBeacon: any) => void;
}

export interface CandidateResponder {
  user_id: string;
  name: string;
  phone_masked: string;
  role: string;
  distance_km: number;
  composite_score: number;
  proximity_score: number;
  capability_score: number;
  gps_freshness_score: number;
  workload_score: number;
  is_gps_fresh: boolean;
  matched_skills: string[];
  selection_rationale: string;
}

export const DispatchControlModal: React.FC<DispatchControlModalProps> = ({
  beacon,
  isOpen,
  onClose,
  onDispatchSuccess,
}) => {
  const [candidates, setCandidates] = useState<CandidateResponder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<string>('MOTORCYCLE');
  const [notes, setNotes] = useState<string>('Dispatched via AEGIS Central Operations Command Desk');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadCandidates() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await ApiClient.get<any>(`/sos/${beacon.id}/candidates`);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setCandidates(list);
        if (list.length > 0) {
          setSelectedCandidateId(list[0].user_id);
        }
      } catch (err: any) {
        console.warn('[DispatchControlModal] Failed to load candidates:', err);
        setErrorMsg('Failed to query candidate responders. You can still initiate automatic emergency broadcast dispatch.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadCandidates();
  }, [isOpen, beacon.id]);

  if (!isOpen) return null;

  const handleAssign = async () => {
    setIsDispatching(true);
    setErrorMsg(null);
    try {
      const payload = {
        responder_user_id: selectedCandidateId,
        vehicle_type: vehicleType,
        notes,
      };

      const res = await ApiClient.post<any>(`/sos/${beacon.id}/dispatch`, payload);
      if (res && (res.id || res.data)) {
        onDispatchSuccess(res.data || res);
        onClose();
        return;
      }
      throw new Error('Dispatch failed: invalid response from server.');
    } catch (err: any) {
      console.error('[DispatchControlModal] Dispatch failed:', err);
      setErrorMsg(err.message || 'Dispatch command failed. Ensure your operator token has required permissions.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0E1C2A] rounded-3xl p-6 shadow-2xl border border-[#DCEBED] dark:border-[#1E3347] font-sans space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCEBED] dark:border-[#1E3347]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18364A] dark:text-slate-100">
                Authoritative Dispatch Control: {beacon.id}
              </h3>
              <p className="text-xs text-[#708696] dark:text-slate-400">
                Multi-Factor Geospatial Responder Matching • {beacon.emergencyTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SOS Summary Strip */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#07131D] border border-slate-200 dark:border-[#1E3347] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block">CALLER</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{beacon.anonymousAlias}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">CATEGORY</span>
            <span className="font-bold text-red-600 uppercase">{beacon.emergencyType}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">LOCATION</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{beacon.district}, {beacon.state}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">GPS FIX</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {beacon.coordinates[0].toFixed(3)}°N, {beacon.coordinates[1].toFixed(3)}°E
            </span>
          </div>
        </div>

        {/* Candidates Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#708696] dark:text-slate-400 uppercase tracking-wider font-mono">
              Ranked Candidate Responders ({candidates.length})
            </h4>
            <span className="text-[10px] text-slate-400">Score = 40% Dist + 30% Skill + 20% GPS + 10% Workload</span>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Evaluating geospatial proximity and capability matching...
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center text-xs text-amber-800 dark:text-amber-300">
              No active opted-in responders currently located within the 20km search radius. You can dispatch an automated broadcast to the sector.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {candidates.map((cand, idx) => {
                const isSelected = selectedCandidateId === cand.user_id;
                return (
                  <button
                    key={cand.user_id}
                    type="button"
                    onClick={() => setSelectedCandidateId(cand.user_id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-[#1E3347] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{cand.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({cand.phone_masked})</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {cand.role}
                        </span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="font-extrabold text-sky-600 dark:text-sky-400">
                          Score: {(cand.composite_score * 100).toFixed(0)}%
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1.5">• {cand.distance_km.toFixed(1)} km</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      <strong>Rationale:</strong> {cand.selection_rationale}
                    </p>

                    {cand.matched_skills && cand.matched_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cand.matched_skills.map((s) => (
                          <span key={s} className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dispatch Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
          <div>
            <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
              Tactical Vehicle Type
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2"
            >
              <option value="MOTORCYCLE">Rapid Response Motorcycle (Fastest)</option>
              <option value="AMBULANCE">Emergency Ambulance (Medical Unit)</option>
              <option value="4X4_JEEP">4x4 All-Terrain Rescue Vehicle</option>
              <option value="BOAT">Inflatable Rescue Boat (Flood Specialized)</option>
              <option value="ON_FOOT">Foot Patrol / Search Team</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
              Operator Order Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Code Red Priority Deployment"
              className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#DCEBED] dark:border-[#1E3347] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isDispatching}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#708696] hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={isDispatching || (!selectedCandidateId && candidates.length > 0)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isDispatching ? 'Authorizing Dispatch...' : 'Authorize & Dispatch Unit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
