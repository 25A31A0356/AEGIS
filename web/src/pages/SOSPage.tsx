import React, { useState } from 'react';
import { useSOS } from '../context/SOSContext';
import { useLocation } from '../context/LocationContext';
import { useTranslation } from '../i18n/useTranslation';

interface SOSPageProps {
  preSelectedSOSId?: string;
}

export const SOSPage: React.FC<SOSPageProps> = () => {
  const { beacons, createNewSOSBeacon, updateBeaconTriage, triggerEmergencyRouteSimulation } = useSOS();
  const { selectedLocation } = useLocation();
  const { dict } = useTranslation();

  const [emergencyType, setEmergencyType] = useState('flash_flood_stranding');
  const [persons, setPersons] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createNewSOSBeacon({
        emergencyType: emergencyType,
        emergencyTitle: emergencyType.replace(/_/g, ' ').toUpperCase(),
        personsCount: persons,
        locationName: selectedLocation?.name || 'Visakhapatnam',
        district: selectedLocation?.name || 'Visakhapatnam',
        state: selectedLocation?.stateName || 'Andhra Pradesh',
        coordinates: selectedLocation?.coordinates || [17.6868, 83.2185],
        medicalConditions: notes || undefined,
      });
      setNotes('');
    } catch (err) {
      console.warn('SOS Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBeacons = beacons.filter(b => b.triageStatus !== 'RESOLVED' && b.triageStatus !== 'CANCELLED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#27272a] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {dict.distressBeacon || 'SOS Emergency Command & Triage'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#a1a1aa] mt-0.5">
            Operational triage queue for immediate search & rescue dispatch.
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30">
          {activeBeacons.length} Active Incident Signals
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trigger Emergency Beacon (1 Col) */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-5 shadow-xs dark:shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#27272a]">
            <span className="material-symbols-outlined text-red-500 text-xl">emergency_share</span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {dict.criticalDistress || 'Trigger SOS Distress Signal'}
            </h2>
          </div>

          <form onSubmit={handleTrigger} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                {dict.distressCategory || 'Distress Category'}
              </label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="flash_flood_stranding">Flash Flood Stranding</option>
                <option value="medical_critical">Severe Medical Critical</option>
                <option value="building_collapse">Building Collapse / Trap</option>
                <option value="industrial_fire">Fire / Industrial Threat</option>
                <option value="cyclone_shelter_needed">Cyclone Shelter Inundation</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                {dict.personsAtLocation || 'Persons at Location'}
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={persons}
                onChange={(e) => setPersons(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                {dict.distressNote || 'Distress Note (Optional)'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention landmark, rooftop, water level..."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
            >
              {isSubmitting ? 'Broadcasting Signal...' : (dict.broadcastSignal || 'BROADCAST SOS SIGNAL')}
            </button>
          </form>
        </div>

        {/* Triage Queue (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-5 shadow-xs dark:shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#27272a]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {dict.activeTriageQueue || 'Active Triage & Dispatch Queue'}
            </h2>
            <span className="text-xs text-slate-400 font-mono">Real-Time Sync</span>
          </div>

          <div className="space-y-3">
            {activeBeacons.length > 0 ? (
              activeBeacons.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30">
                        {b.triageStatus}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono">{b.id}</h3>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-[#a1a1aa] font-mono">
                      {b.district || selectedLocation?.name}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-[#a1a1aa]">
                    Emergency: <strong className="text-slate-900 dark:text-white">{b.emergencyType}</strong> &bull; Persons: <strong>{b.personsCount}</strong>
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-[#27272a]">
                    <button
                      onClick={() => updateBeaconTriage(b.id, 'ACCEPTED')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-black text-xs font-semibold cursor-pointer"
                    >{dict.acknowledge || 'Acknowledge'}</button>
                    <button
                      onClick={() => {
                        updateBeaconTriage(b.id, 'RESPONDER_EN_ROUTE');
                        triggerEmergencyRouteSimulation(b);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                    >{dict.dispatchNdrf || 'Dispatch NDRF & Route'}</button>
                    <button
                      onClick={() => updateBeaconTriage(b.id, 'RESOLVED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                    >{dict.resolve || 'Resolve'}</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-[#a1a1aa] bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#27272a]">
                No active SOS signals requiring triage in current operational grid.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSPage;
