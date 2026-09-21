import React from 'react';
import { SimulatedRoute } from '../../services/routingService';
import { SOSBeacon } from '../../types/sos';
import { Navigation, X, Car, Radio } from 'lucide-react';

interface SOSRouteSimulatorProps {
  route: SimulatedRoute | null;
  beacon: SOSBeacon | null;
  onClose: () => void;
}

export const SOSRouteSimulator: React.FC<SOSRouteSimulatorProps> = ({
  route,
  beacon,
  onClose,
}) => {
  if (!route || !beacon) return null;

  const isLiveStream = Boolean(beacon.assignedUnit?.responderCoordinates);

  return (
    <div className="bg-white rounded-2xl border border-sky-200 shadow-elevated p-5 font-sans animate-in slide-in-from-bottom duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl ${isLiveStream ? 'bg-emerald-600' : 'bg-sky-600'} text-white flex items-center justify-center`}>
            {isLiveStream ? <Radio className="w-4 h-4 animate-pulse" /> : <Navigation className="w-4 h-4 animate-spin-slow" />}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 font-mono flex items-center gap-1.5">
              <span>{isLiveStream ? 'LIVE RESPONDER GPS TRACKING CORRIDOR' : 'SIMULATED TACTICAL DISPATCH CORRIDOR'}</span>
            </h4>
            <div className="text-[11px] text-slate-500 font-mono">
              Target: <strong className="text-red-600">{beacon.id}</strong> • {beacon.emergencyTitle}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-sky-50 border border-sky-100 mb-4 font-mono text-xs">
        <div>
          <span className="text-[10px] text-sky-700 block">ESTIMATED ETA</span>
          <span className="text-lg font-extrabold text-sky-950">{route.estimatedTimeMinutes} Minutes</span>
        </div>
        <div>
          <span className="text-[10px] text-sky-700 block">DISTANCE</span>
          <span className="text-lg font-extrabold text-sky-950">{route.totalDistanceKm} km</span>
        </div>
        <div>
          <span className="text-[10px] text-sky-700 block">CORRIDOR STATUS</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            beacon.triageStatus === 'ON_SITE' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-700'
          }`}>
            {beacon.triageStatus === 'ON_SITE' ? 'ON SCENE ARRIVED' : 'PRIORITY SIREN EN ROUTE'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-sky-700 block">DESTINATION GPS</span>
          <span className="text-[11px] text-slate-700 font-semibold truncate block">
            {beacon.coordinates[0].toFixed(4)}, {beacon.coordinates[1].toFixed(4)}
          </span>
        </div>
      </div>

      {/* Assigned Unit Telemetry Banner */}
      {beacon.assignedUnit && (
        <div className="p-3 rounded-xl bg-slate-900 text-white text-xs mb-4 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-sky-400" />
            <span>Unit: <strong className="text-sky-300">{beacon.assignedUnit.callsign}</strong> ({beacon.assignedUnit.unitType})</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Commander: <span className="text-white">{beacon.assignedUnit.commanderName}</span>
          </div>
        </div>
      )}

      {/* Step-by-Step Navigation Guidance */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Turn-by-Turn Navigation Corridors
        </div>
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {route.steps.map((step, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-800"
            >
              <div className="p-1 rounded bg-slate-200 text-slate-700 shrink-0 font-mono font-bold text-[10px] mt-0.5">
                #{idx + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{step.instruction}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Road: {step.road}</span>
                  {step.distance !== '0.0 km' && <span>• Dist: {step.distance}</span>}
                  {step.duration !== '0 min' && <span>• Est: {step.duration}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
