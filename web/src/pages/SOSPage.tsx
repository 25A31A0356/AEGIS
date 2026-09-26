import React, { useState, useMemo } from 'react';
import { useSOS } from '../context/SOSContext';
import { useLocation } from '../context/LocationContext';
import { useTranslation } from '../i18n/useTranslation';
import { IndiaSafetyMap, MapLayersState } from '../components/map/IndiaSafetyMap';
import { STATE_VICTIM_BEACONS, StateVictimProfile } from '../data/stateVictimBeacons';
import { VictimProfileModal } from '../components/sos/VictimProfileModal';
import { normalizeBeaconState } from '../services/sosService';
import { ExternalLink, Users, Maximize2, Minimize2, RefreshCw, Trash2, Clock } from 'lucide-react';

interface SOSPageProps {
  preSelectedSOSId?: string;
}

export const SOSPage: React.FC<SOSPageProps> = ({ preSelectedSOSId }) => {
  const {
    beacons,
    createNewSOSBeacon,
    updateBeaconTriage,
    refreshBeacons,
    clearStaleBeacons,
    isLiveLoading,
    secondsUntilNextRefresh,
  } = useSOS();
  const { selectedLocation } = useLocation();
  const { dict } = useTranslation();

  const [emergencyType, setEmergencyType] = useState('flash_flood_stranding');
  const [persons, setPersons] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVictim, setSelectedVictim] = useState<StateVictimProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [mapLayers, setMapLayers] = useState<MapLayersState>({
    weatherRadar: false,
    isobarWinds: false,
    floodInundation: false,
    cycloneTrack: false,
    wildfireHotspots: false,
    earthquakes: false,
    sosBeacons: true,
    safeShelters: false,
    baseLayer: 'light', // Google Maps Streets default
  });

  const coords: [number, number] =
    selectedLocation?.coordinates && selectedLocation.coordinates.length === 2
      ? [selectedLocation.coordinates[0], selectedLocation.coordinates[1]]
      : [17.6868, 83.2185];

  // Merge state victim beacons with real-time user-triggered beacons, normalizing all state names
  const allVictimBeacons: StateVictimProfile[] = useMemo(() => {
    const list = [...STATE_VICTIM_BEACONS];
    beacons.forEach((b) => {
      const exists = list.some((item) => item.id === b.id);
      const normalizedState = normalizeBeaconState(b.state, b.district, b.coordinates);

      if (!exists) {
        list.unshift({
          ...b,
          state: normalizedState,
          victimName: b.anonymousAlias?.replace(/Beacon\s*#?[A-Z0-9-]+\s*\(/i, '').replace(/\)/g, '') || 'Citizen in Distress',
          familyContactName: 'Family Guardian',
          familyContactPhone: '+91 94401 87654',
          familyRelationship: 'Family',
          nearbyPoliceStationName: `${b.district || 'Local'} Police Station (Sector Control)`,
          nearbyPoliceStationPhone: '+91 891 256 3322',
          hometownPoliceStationName: `${b.district || 'Local'} Emergency Desk`,
          hometownPoliceStationPhone: '+91 891 256 1100',
          signalStatus: '4G LTE (Good)',
          elevationMeters: 18,
        });
      }
    });
    return list;
  }, [beacons]);

  // Clean, sorted list of individual states (excluding generic "all" or "india")
  const statesList = useMemo(() => {
    const unique = Array.from(
      new Set(
        allVictimBeacons
          .map((v) => v.state)
          .filter((s) => s && s.toLowerCase() !== 'india' && s.toLowerCase() !== 'all')
      )
    ).sort();
    return ['all', ...unique];
  }, [allVictimBeacons]);

  const filteredVictims = useMemo(() => {
    if (selectedStateFilter === 'all') return allVictimBeacons;
    return allVictimBeacons.filter(
      (v) => v.state.toLowerCase().trim() === selectedStateFilter.toLowerCase().trim()
    );
  }, [allVictimBeacons, selectedStateFilter]);

  // Handle pre-selected ID if passed
  React.useEffect(() => {
    if (preSelectedSOSId) {
      const found = allVictimBeacons.find((b) => b.id === preSelectedSOSId);
      if (found) {
        setSelectedVictim(found);
        setIsModalOpen(true);
      }
    }
  }, [preSelectedSOSId, allVictimBeacons]);

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

  const handleOpenVictimModal = (beaconId: string) => {
    const found = allVictimBeacons.find((b) => b.id === beaconId);
    if (found) {
      setSelectedVictim(found);
      setIsModalOpen(true);
    }
  };

  const handleOfferHelp = (victim: StateVictimProfile) => {
    updateBeaconTriage(victim.id, 'ACCEPTED', 'Responder dispatched from AEGIS Web SOS Console');
  };

  const activeBeacons = filteredVictims.filter(b => b.triageStatus !== 'RESOLVED' && b.triageStatus !== 'CANCELLED');

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {dict.distressBeacon || 'SOS Emergency Map & Tactical Grid'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#a1a1aa] mt-0.5">
            Google Maps live tactical view • Select any state to filter and zoom into active distress beacons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Min Auto-Sync Timer Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] text-xs font-mono text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Sync: {secondsUntilNextRefresh}s</span>
            <button
              onClick={() => refreshBeacons()}
              disabled={isLiveLoading}
              className="ml-1 p-1 hover:bg-slate-200 dark:hover:bg-[#27272a] rounded-lg transition-colors cursor-pointer"
              title="Refresh now"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLiveLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Clean Old SOS */}
          <button
            onClick={clearStaleBeacons}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200 dark:hover:bg-[#27272a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#27272a]"
            title="Clean out old/resolved SOS messages"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Clean Old SOS</span>
          </button>

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}</span>
          </button>

          <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-red-500/10 text-red-600 border border-red-500/20">
            {activeBeacons.length} Active Beacons
          </span>
        </div>
      </div>

      {/* State Filter Chips: Clicking a state smoothly zooms to that state */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          States:
        </span>
        {statesList.map((state) => {
          const isActive = selectedStateFilter === state;
          const count = state === 'all' ? allVictimBeacons.length : allVictimBeacons.filter((v) => v.state === state).length;
          return (
            <button
              key={state}
              onClick={() => setSelectedStateFilter(state)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white dark:bg-[#111111] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#27272a] hover:border-slate-400'
              }`}
            >
              <span>{state === 'all' ? 'All India' : state}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${isActive ? 'bg-red-800 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* PURE GOOGLE MAPS STYLE SOS MAP (Clean without overlapping header badges) */}
      <div
        className={`relative w-full ${
          isFullscreen
            ? 'fixed inset-0 z-[9990] w-screen h-screen rounded-none border-0'
            : 'h-[560px] rounded-3xl border border-slate-200 dark:border-[#27272a]'
        } overflow-hidden shadow-lg transition-all`}
      >
        <IndiaSafetyMap
          hazards={[]}
          states={[]}
          sosBeacons={filteredVictims}
          shelters={[]}
          layers={mapLayers}
          selectedStateName={selectedStateFilter} // Zooms to selected state smoothly
          noRouteToVictims={true} // NO ROUTE POLYLINES TO VICTIMS
          onSelectSOS={handleOpenVictimModal}
          onToggleBaseLayer={() => {
            setMapLayers(prev => ({
              ...prev,
              baseLayer: prev.baseLayer === 'satellite' ? 'light' : 'satellite'
            }));
          }}
          heightClass="h-full"
        />

        {/* Floating Controls in Top-Right Corner */}
        <div className="absolute top-3 right-3 z-[400] flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => refreshBeacons()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 shadow-md border border-slate-200 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
            title="Refresh SOS beacons"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLiveLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 shadow-md border border-slate-200 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-red-600" /> : <Maximize2 className="w-3.5 h-3.5 text-blue-600" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: SOS Broadcast Trigger & Active Triage Dispatch Queue (Hidden when in fullscreen mode) */}
      {!isFullscreen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Trigger Emergency Beacon (1 Col) */}
          <div className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-[#27272a] p-5 shadow-sm space-y-4">
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
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer active:scale-95"
              >
                {isSubmitting ? 'Broadcasting Signal...' : (dict.broadcastSignal || 'BROADCAST SOS SIGNAL')}
              </button>
            </form>
          </div>

          {/* Triage Queue (2 Cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-[#27272a] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#27272a]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dict.activeTriageQueue || 'Active Triage & Victim Dispatch Queue'}
              </h2>
              <span className="text-xs text-slate-400 font-mono">Pan-India Live</span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {activeBeacons.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] hover:border-red-400 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30">
                        {b.triageStatus}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {b.victimName} ({b.id})
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-[#a1a1aa] font-mono font-bold">
                      {b.state} &bull; {b.district}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-[#a1a1aa] leading-relaxed">
                    {b.emergencyTitle}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-[#27272a]">
                    <button
                      onClick={() => {
                        setSelectedVictim(b);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>View Victim Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateBeaconTriage(b.id, 'ACCEPTED')}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-black text-xs font-semibold cursor-pointer"
                      >
                        {dict.acknowledge || 'Acknowledge'}
                      </button>
                      <button
                        onClick={() => updateBeaconTriage(b.id, 'RESPONDER_EN_ROUTE')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        {dict.dispatchNdrf || 'Dispatch Aid'}
                      </button>
                      <button
                        onClick={() => updateBeaconTriage(b.id, 'RESOLVED')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        {dict.resolve || 'Resolve'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VICTIM PROFILE INFO CARD MODAL (Always on top via Portal & z-[99999]) */}
      <VictimProfileModal
        victim={selectedVictim}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVictim(null);
        }}
        userLocation={coords}
        onOfferHelp={handleOfferHelp}
      />
    </div>
  );
};

export default SOSPage;
