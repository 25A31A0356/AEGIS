import React, { useState, useEffect } from 'react';
import { SOSTriageCard } from '../components/sos/SOSTriageCard';
import { SOSDetailDrawer } from '../components/sos/SOSDetailDrawer';
import { DispatchControlModal } from '../components/dispatch/DispatchControlModal';
import { SOSRouteSimulator } from '../components/sos/SOSRouteSimulator';
import { GoogleSOSMap } from '../components/map/GoogleSOSMap';
import { useSOS } from '../context/SOSContext';
import { useLocation } from '../context/LocationContext';
import { HazardService } from '../services/hazardService';
import { RealtimeService, RealtimeConnectionStatus } from '../services/realtimeService';
import { DEMO_STATES } from '../data/demoStates';
import { DEMO_SHELTERS } from '../data/demoShelters';
import { HazardItem } from '../types/hazard';
import {
  ShieldCheck,
  PlusCircle,
  Search,
  Radio,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { SOSService } from '../services/sosService';

interface SOSPageProps {
  preSelectedSOSId?: string | null;
}

export const SOSPage: React.FC<SOSPageProps> = ({ preSelectedSOSId }) => {
  const {
    beacons,
    selectedBeacon,
    activeRoute,
    isLiveLoading,
    setSelectedBeacon,
    updateBeaconTriage,
    triggerEmergencyRouteSimulation,
    clearActiveRoute,
    createNewSOSBeacon,
    refreshBeacons,
  } = useSOS();

  const { weather, userCoordinates } = useLocation();
  const [hazards, setHazards] = useState<HazardItem[]>(() => HazardService.getAllHazards());
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionStatus>(() => RealtimeService.getStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [triageFilter, setTriageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [beaconForDispatch, setBeaconForDispatch] = useState<any>(null);

  useEffect(() => {
    HazardService.fetchLiveHazards().then(setHazards).catch(console.error);
    const unsubHazards = HazardService.subscribe(() => {
      setHazards(HazardService.getAllHazards());
    });

    const unsubRealtime = RealtimeService.onStatusChange((newStatus) => {
      setRealtimeStatus(newStatus);
    });

    return () => {
      unsubHazards();
      unsubRealtime();
    };
  }, []);

  useEffect(() => {
    if (preSelectedSOSId) {
      const match = beacons.find((b) => b.id === preSelectedSOSId);
      if (match) {
        setSelectedBeacon(match);
        setIsDetailDrawerOpen(true);
      }
    }
  }, [preSelectedSOSId, beacons, setSelectedBeacon]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBeacons();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const filteredBeacons = beacons.filter((b) => {
    if (triageFilter === 'pending') {
      const match = b.triageStatus === 'PENDING' || b.triageStatus === 'MATCHING' || b.triageStatus === 'OFFERED' || b.triageStatus === 'incoming';
      if (!match) return false;
    } else if (triageFilter === 'dispatched') {
      const match = b.triageStatus === 'ACCEPTED' || b.triageStatus === 'RESPONDER_EN_ROUTE' || b.triageStatus === 'acknowledged' || b.triageStatus === 'dispatching';
      if (!match) return false;
    } else if (triageFilter === 'on_site') {
      const match = b.triageStatus === 'ON_SITE' || b.triageStatus === 'on_scene';
      if (!match) return false;
    } else if (triageFilter === 'resolved') {
      const match = b.triageStatus === 'RESOLVED' || b.triageStatus === 'resolved';
      if (!match) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.emergencyTitle.toLowerCase().includes(q) ||
        b.locationName.toLowerCase().includes(q) ||
        b.district.toLowerCase().includes(q) ||
        b.state.toLowerCase().includes(q) ||
        (b.assignedUnit?.callsign && b.assignedUnit.callsign.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Summary Counts
  const pendingCount = beacons.filter(
    (b) => b.triageStatus === 'PENDING' || b.triageStatus === 'MATCHING' || b.triageStatus === 'OFFERED' || b.triageStatus === 'incoming'
  ).length;

  const enRouteCount = beacons.filter(
    (b) => b.triageStatus === 'ACCEPTED' || b.triageStatus === 'RESPONDER_EN_ROUTE' || b.triageStatus === 'acknowledged' || b.triageStatus === 'dispatching'
  ).length;

  const onSiteCount = beacons.filter(
    (b) => b.triageStatus === 'ON_SITE' || b.triageStatus === 'on_scene'
  ).length;

  const resolvedCount = beacons.filter(
    (b) => b.triageStatus === 'RESOLVED' || b.triageStatus === 'resolved'
  ).length;

  const activeBeaconsCount = beacons.filter(
    (b) => b.triageStatus !== 'RESOLVED' && b.triageStatus !== 'resolved' && b.triageStatus !== 'CANCELLED' && b.triageStatus !== 'cancelled'
  ).length;

  const totalSoulsAtRisk = beacons
    .filter((b) => b.triageStatus !== 'RESOLVED' && b.triageStatus !== 'resolved' && b.triageStatus !== 'CANCELLED' && b.triageStatus !== 'cancelled')
    .reduce((sum, b) => sum + (b.personsCount || 1), 0);

  const handleTriggerRealGPSBeacon = async () => {
    const coords: [number, number] = userCoordinates || [weather.coordinates[0], weather.coordinates[1]];
    const created = await createNewSOSBeacon({
      emergencyType: 'flash_flood_stranding',
      emergencyTitle: `Emergency Distress Beacon (${weather.cityName})`,
      locationName: `Near ${weather.cityName} Sector`,
      district: weather.cityName,
      state: weather.stateName,
      coordinates: coords,
      personsCount: 1,
    });
    setSelectedBeacon(created);
    setIsDetailDrawerOpen(true);
  };

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Real-time Offline Warning Banner */}
      {realtimeStatus === 'OFFLINE' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold font-mono uppercase">Offline Cache Active: </span>
              Distress stream is disconnected from Aegis Software backend. Displaying cached triage beacons.
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold shrink-0 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Top Header & Command Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#071828] p-5 rounded-2xl border border-slate-200 dark:border-[#1E3347] shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${activeBeaconsCount > 0 ? 'bg-red-600 animate-ping' : 'bg-emerald-500'}`} />
            <h1 className="font-extrabold text-base text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
              Emergency SOS Command Center & Responder GIS Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Centralized AEGIS ALERT Dispatch Core • Live Event Pipeline (SSE)
          </p>
        </div>

        {/* Realtime Status Indicator & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Connection Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
            realtimeStatus === 'LIVE'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : realtimeStatus === 'RECONNECTING'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              realtimeStatus === 'LIVE'
                ? 'bg-emerald-500 animate-pulse'
                : realtimeStatus === 'RECONNECTING'
                ? 'bg-amber-500 animate-ping'
                : 'bg-slate-400'
            }`} />
            <span>{realtimeStatus === 'LIVE' ? 'LIVE STREAM ACTIVE' : realtimeStatus === 'RECONNECTING' ? 'RECONNECTING...' : 'OFFLINE CACHE'}</span>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLiveLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Fetch latest distress registry from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLiveLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {beacons.length > 0 && (
            <button
              onClick={() => {
                SOSService.clearAllBeacons();
                clearActiveRoute();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Clear all local beacons"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={handleTriggerRealGPSBeacon}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all font-mono cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Trigger Distress Signal (My GPS)</span>
          </button>
        </div>
      </div>

      {/* Metrics Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#071828] border border-slate-200 dark:border-[#1E3347] shadow-card font-sans">
          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase mb-1 flex items-center justify-between">
            <span>ACTIVE DISTRESSES</span>
            <span className={`w-2 h-2 rounded-full ${activeBeaconsCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            {activeBeaconsCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {totalSoulsAtRisk} Souls Reported
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#071828] border border-slate-200 dark:border-[#1E3347] shadow-card font-sans">
          <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase mb-1 flex items-center justify-between">
            <span>PENDING / INCOMING</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {pendingCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Awaiting Dispatch
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#071828] border border-slate-200 dark:border-[#1E3347] shadow-card font-sans">
          <div className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold uppercase mb-1 flex items-center justify-between">
            <span>UNITS EN ROUTE</span>
            <Car className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
            {enRouteCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Tracking Active
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#071828] border border-slate-200 dark:border-[#1E3347] shadow-card font-sans">
          <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold uppercase mb-1 flex items-center justify-between">
            <span>ON SCENE</span>
            <Radio className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            {onSiteCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Relief In Progress
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#071828] border border-slate-200 dark:border-[#1E3347] shadow-card font-sans col-span-2 sm:col-span-1">
          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1 flex items-center justify-between">
            <span>RESOLVED</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {resolvedCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Safely Closed
          </div>
        </div>
      </div>

      {/* Main Grid: SOS Beacon Triage Cards on Left + Map & Routing on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Triage List & Filters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#071828] p-3 rounded-2xl border border-slate-200 dark:border-[#1E3347] shadow-card flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SOS ID, district, unit, or emergency..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1E30] border border-slate-200 dark:border-[#1E3347] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Status Filter Tabs */}
            <select
              value={triageFilter}
              onChange={(e) => setTriageFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#0B1E30] border border-slate-200 dark:border-[#1E3347] text-xs rounded-lg px-2.5 py-1.5 font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Distresses</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="dispatched">En Route ({enRouteCount})</option>
              <option value="on_site">On Scene ({onSiteCount})</option>
              <option value="resolved">Resolved ({resolvedCount})</option>
            </select>
          </div>

          {/* Cards List or Clear State */}
          {filteredBeacons.length === 0 ? (
            <div className="bg-white dark:bg-[#071828] p-8 rounded-2xl border border-slate-200 dark:border-[#1E3347] shadow-card text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 font-sans">
                No active SOS alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed max-w-sm mx-auto">
                No active distress beacons match your criteria. When an emergency event occurs or is broadcast from Aegis Software, it will appear here in real time.
              </p>
              <button
                onClick={handleTriggerRealGPSBeacon}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Trigger Test Distress from My GPS</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
              {filteredBeacons.map((beacon) => (
                <SOSTriageCard
                  key={beacon.id}
                  beacon={beacon}
                  isSelected={selectedBeacon?.id === beacon.id}
                  onSelect={(b) => {
                    setSelectedBeacon(b);
                    setIsDetailDrawerOpen(true);
                  }}
                  onUpdateStatus={(id, st) => updateBeaconTriage(id, st)}
                  onSimulateRoute={(b) => triggerEmergencyRouteSimulation(b)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Map & Emergency Navigation Route Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Navigation Route Simulator Banner */}
          {activeRoute && selectedBeacon && (
            <SOSRouteSimulator
              route={activeRoute}
              beacon={selectedBeacon}
              onClose={clearActiveRoute}
            />
          )}

          {/* Dispatch Live Map */}
          <div className="bg-white dark:bg-[#071828] rounded-2xl border border-slate-200 dark:border-[#1E3347] p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1E3347] font-mono text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                Live Distress Dispatch GIS Tracking (SOS Map)
              </span>
              <span className={activeBeaconsCount > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                {activeBeaconsCount > 0 ? `${activeBeaconsCount} Active Distress(es)` : 'Sector Clear (0 Distresses)'}
              </span>
            </div>

            <GoogleSOSMap
              beacons={beacons}
              selectedBeacon={selectedBeacon}
              activeRoute={activeRoute}
              userLocation={userCoordinates}
              onSelectSOS={(id) => {
                const match = beacons.find((b) => b.id === id);
                if (match) {
                  setSelectedBeacon(match);
                  setIsDetailDrawerOpen(true);
                }
              }}
              heightClass="h-[520px]"
            />
          </div>
        </div>
      </div>

      {/* SOS Detail Briefing Drawer */}
      <SOSDetailDrawer
        beacon={isDetailDrawerOpen ? selectedBeacon : null}
        onClose={() => setIsDetailDrawerOpen(false)}
        onUpdateStatus={(id, st, notes) => updateBeaconTriage(id, st, notes)}
        onSimulateRoute={(b) => triggerEmergencyRouteSimulation(b)}
        onOpenDispatchControl={(b) => {
          setBeaconForDispatch(b);
          setIsDispatchModalOpen(true);
        }}
      />
      {/* Central Dispatch Operations Modal */}
      {isDispatchModalOpen && beaconForDispatch && (
        <DispatchControlModal
          beacon={beaconForDispatch}
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          onDispatchSuccess={() => {
            refreshBeacons();
          }}
        />
      )}
    </div>
  );
};
