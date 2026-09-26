import React, { useState, useMemo } from 'react';
import { useLocation } from '../context/LocationContext';
import { useSOS } from '../context/SOSContext';
import { HazardService } from '../services/hazardService';
import { IndiaSafetyMap, MapLayersState } from '../components/map/IndiaSafetyMap';
import { STATE_VICTIM_BEACONS, StateVictimProfile } from '../data/stateVictimBeacons';
import { VictimProfileModal } from '../components/sos/VictimProfileModal';
import { normalizeBeaconState } from '../services/sosService';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  PhoneCall,
  Radio,
  AlertTriangle,
  Users,
} from 'lucide-react';

export const LiveMapPage: React.FC = () => {
  const { selectedLocation } = useLocation();
  const {
    beacons,
    refreshBeacons,
    isLiveLoading,
  } = useSOS();
  const hazards = HazardService.getAllHazards();

  const [selectedVictim, setSelectedVictim] = useState<StateVictimProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'moderate'>('all');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Dedicated SOS Map Layer Configuration (100% Isolated)
  const mapLayers: MapLayersState = {
    cycloneTrack: false,
    isobarWinds: false,
    weatherMap: false,
    weatherRadar: false,
    floodInundation: false,
    wildfireHotspots: false,
    earthquakes: false,
    safeShelters: false,
    sosBeacons: true,
    baseLayer: 'light',
  };

  const coords: [number, number] =
    selectedLocation?.coordinates && selectedLocation.coordinates.length === 2
      ? [selectedLocation.coordinates[0], selectedLocation.coordinates[1]]
      : [17.6868, 83.2185];

  // Merge context beacons with state victim beacons
  const allVictimBeacons: StateVictimProfile[] = useMemo(() => {
    const list = [...STATE_VICTIM_BEACONS];
    beacons.forEach((b) => {
      const exists = list.some((item) => item.id === b.id);
      const normalizedState = normalizeBeaconState(b.state, b.district, b.coordinates);

      if (!exists) {
        list.unshift({
          ...b,
          victimName: (b as any).victimName || b.anonymousAlias || 'Citizen in Distress',
          familyContactName: (b as any).familyContactName || 'Family Member',
          familyContactPhone: (b as any).familyContactPhone || b.phoneMasked || '+91 91100 00000',
          familyRelationship: (b as any).familyRelationship || 'Relative',
          nearbyPoliceStationName: (b as any).nearbyPoliceStationName || `${b.district || 'Local'} Police Station Control Desk`,
          nearbyPoliceStationPhone: (b as any).nearbyPoliceStationPhone || '112',
          hometownPoliceStationName: (b as any).hometownPoliceStationName || 'District Police Headquarters',
          hometownPoliceStationPhone: (b as any).hometownPoliceStationPhone || '100',
          signalStatus: (b as any).signalStatus || '4G Active (Good)',
          elevationMeters: (b as any).elevationMeters || 22,
          state: normalizedState,
        });
      }
    });
    return list;
  }, [beacons]);

  // Filter beacons by state and severity level
  const filteredBeacons = useMemo(() => {
    return allVictimBeacons.filter((b) => {
      const stateMatch =
        selectedStateFilter === 'all' ||
        b.state.toLowerCase() === selectedStateFilter.toLowerCase() ||
        (selectedStateFilter === 'andhra pradesh' && b.state.toLowerCase().includes('andhra')) ||
        (selectedStateFilter === 'odisha' && b.state.toLowerCase().includes('odisha')) ||
        (selectedStateFilter === 'maharashtra' && b.state.toLowerCase().includes('maharashtra')) ||
        (selectedStateFilter === 'kerala' && b.state.toLowerCase().includes('kerala')) ||
        (selectedStateFilter === 'tamil nadu' && b.state.toLowerCase().includes('tamil')) ||
        (selectedStateFilter === 'west bengal' && b.state.toLowerCase().includes('bengal'));

      const severityMatch =
        severityFilter === 'all' || b.severity === severityFilter;

      return stateMatch && severityMatch;
    });
  }, [allVictimBeacons, selectedStateFilter, severityFilter]);

  // Counts
  const criticalCount = allVictimBeacons.filter(b => b.severity === 'critical').length;
  const warningCount = allVictimBeacons.filter(b => b.severity === 'warning').length;
  const moderateCount = allVictimBeacons.filter(b => b.severity === 'moderate').length;

  const handleSelectSOS = (sosId: string) => {
    const found = allVictimBeacons.find((b) => b.id === sosId);
    if (found) {
      setSelectedVictim(found);
      setIsModalOpen(true);
    }
  };

  return (
    <div className={`space-y-4 max-w-7xl mx-auto pb-12 font-sans ${isFullscreen ? 'fixed inset-0 z-[1000] bg-white dark:bg-black p-4 m-0 max-w-none overflow-y-auto' : ''}`}>
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              SOS Maps
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800">
              {filteredBeacons.length} ACTIVE BEACONS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time citizen distress beacon tracking, triage assessment & emergency rescue coordination across Indian states.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live GPS Stream</span>
          </div>

          <button
            onClick={() => refreshBeacons()}
            disabled={isLiveLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] hover:bg-slate-50 dark:hover:bg-[#27272a] text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Live SOS Stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-300 ${isLiveLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] hover:bg-slate-50 dark:hover:bg-[#27272a] text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Triage Overview & State Selector Controls */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* State Dropdown Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Filter State:
            </span>
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="w-full md:w-64 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer shadow-xs focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All India ({allVictimBeacons.length} Distress Beacons)</option>
              <option value="andhra pradesh">Andhra Pradesh (Coastal Zone)</option>
              <option value="odisha">Odisha (Coastal Zone)</option>
              <option value="maharashtra">Maharashtra</option>
              <option value="tamil nadu">Tamil Nadu</option>
              <option value="kerala">Kerala</option>
              <option value="karnataka">Karnataka</option>
              <option value="west bengal">West Bengal</option>
              <option value="gujarat">Gujarat</option>
              <option value="rajasthan">Rajasthan</option>
              <option value="telangana">Telangana</option>
              <option value="delhi ncr">Delhi NCR</option>
              <option value="uttar pradesh">Uttar Pradesh</option>
              <option value="bihar">Bihar</option>
              <option value="assam">Assam</option>
              <option value="punjab">Punjab</option>
              <option value="haryana">Haryana</option>
              <option value="madhya pradesh">Madhya Pradesh</option>
              <option value="himachal pradesh">Himachal Pradesh</option>
              <option value="uttarakhand">Uttarakhand</option>
              <option value="jammu & kashmir">Jammu & Kashmir</option>
              <option value="goa">Goa</option>
            </select>
          </div>

          {/* Severity Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs w-full md:w-auto">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-[11px] ${
                severityFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'bg-slate-100 dark:bg-[#18181b] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All ({allVictimBeacons.length})
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-[11px] ${
                severityFilter === 'critical'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setSeverityFilter('warning')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-[11px] ${
                severityFilter === 'warning'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50 hover:bg-orange-100'
              }`}
            >
              Warning ({warningCount})
            </button>
            <button
              onClick={() => setSeverityFilter('moderate')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-[11px] ${
                severityFilter === 'moderate'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
              }`}
            >
              Moderate ({moderateCount})
            </button>
          </div>
        </div>

        {/* Quick State Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All India' },
            { id: 'andhra pradesh', label: 'Andhra Pradesh' },
            { id: 'odisha', label: 'Odisha' },
            { id: 'maharashtra', label: 'Maharashtra' },
            { id: 'tamil nadu', label: 'Tamil Nadu' },
            { id: 'kerala', label: 'Kerala' },
            { id: 'karnataka', label: 'Karnataka' },
            { id: 'west bengal', label: 'West Bengal' },
            { id: 'gujarat', label: 'Gujarat' },
            { id: 'rajasthan', label: 'Rajasthan' },
            { id: 'telangana', label: 'Telangana' },
            { id: 'delhi ncr', label: 'Delhi NCR' },
            { id: 'uttar pradesh', label: 'Uttar Pradesh' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStateFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-[11px] ${
                selectedStateFilter === st.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dedicated SOS Map Canvas */}
      <div className={`${isFullscreen ? 'h-[85vh]' : 'h-[640px]'} rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-md relative bg-white`}>
        <IndiaSafetyMap
          satelliteChannel="HD-SAT"
          hazards={hazards}
          states={[]}
          sosBeacons={filteredBeacons}
          shelters={[]}
          layers={mapLayers}
          selectedStateName={selectedStateFilter}
          userLocation={coords}
          onSelectSOS={handleSelectSOS}
          heightClass="h-full"
        />
      </div>

      {/* Emergency Helpline Speed-Dial & Rescue Coordination Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          { title: 'National Emergency', number: '112', desc: 'Police / Fire / Rescue' },
          { title: 'NDRF Control Room', number: '1078', desc: 'Disaster Response Force' },
          { title: 'State Disaster EOC', number: '1070', desc: 'Emergency Operations' },
          { title: 'Ambulance & Medical', number: '108', desc: 'Paramedic Dispatch' },
          { title: 'Coast Guard SAR', number: '1554', desc: 'Maritime Search & Rescue' },
        ].map((h, i) => (
          <a
            key={i}
            href={`tel:${h.number}`}
            className="p-3 rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 hover:border-red-500 dark:hover:border-red-500 transition-all flex items-center justify-between gap-2 shadow-xs group cursor-pointer"
          >
            <div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{h.title}</div>
              <div className="text-base font-black font-mono text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                {h.number}
              </div>
              <div className="text-[9.5px] text-slate-400 dark:text-slate-500">{h.desc}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-all">
              <PhoneCall className="w-4 h-4" />
            </div>
          </a>
        ))}
      </div>

      {/* Victim Profile Modal */}
      {selectedVictim && (
        <VictimProfileModal
          isOpen={isModalOpen}
          victim={selectedVictim}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVictim(null);
          }}
        />
      )}
    </div>
  );
};

export default LiveMapPage;
