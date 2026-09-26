import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from '../context/LocationContext';
import { IndiaSafetyMap, MapLayersState } from '../components/map/IndiaSafetyMap';
import { HazardService } from '../services/hazardService';
import { DEMO_STATES } from '../data/demoStates';
import { WindService, SynopticTimeStep, TwoHourWindSnapshot } from '../services/windService';
import { CycloneService, CycloneSnapshot, CycloneSynopticTimeStep } from '../services/cycloneService';
import { RealtimeWeatherService } from '../services/realtimeWeatherService';
import { TemperatureAnomalyService } from '../services/temperatureAnomalyService';
import { SynopticEngine, UniversalSynopticStep } from '../services/synopticEngine';
import {
  Wind,
  Compass,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Clock,
  RefreshCw,
  Play,
  Pause,
} from 'lucide-react';

export const ResearchMapsPage: React.FC = () => {
  const { selectedLocation } = useLocation();
  const hazards = HazardService.getAllHazards();
  const [selectedLayer, setSelectedLayer] = useState<'cyclone' | 'wind' | 'weather' | 'radar' | 'satellite' | 'temperature' | 'normal'>('cyclone');
  const [flowFilter, setFlowFilter] = useState<'all' | 'upstream' | 'downstream' | 'heavy'>('all');

  // 2-Hourly Synoptic Cyclone State
  const [cycloneSteps, setCycloneSteps] = useState<CycloneSynopticTimeStep[]>([]);
  const [selectedCycloneOffset, setSelectedCycloneOffset] = useState<number>(0);
  const [cycloneSnapshot, setCycloneSnapshot] = useState<CycloneSnapshot>(CycloneService.getCycloneSnapshotForOffset(0));
  const [isCycloneAutoStepping, setIsCycloneAutoStepping] = useState<boolean>(false);
  const [selectedUniversalOffset, setSelectedUniversalOffset] = useState<number>(0);

  // 2-Hourly Synoptic Wind State
  const [timeSteps, setTimeSteps] = useState<SynopticTimeStep[]>([]);
  const [selectedOffset, setSelectedOffset] = useState<number>(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(7200);
  const [windSnapshot, setWindSnapshot] = useState<TwoHourWindSnapshot>(WindService.getWindSnapshotForOffset(0));
  const [isAutoStepping, setIsAutoStepping] = useState<boolean>(false);

  // Weather & Temperature State Filters
  const [weatherConditionFilter, setWeatherConditionFilter] = useState<string>('all');
  const [weatherStateFilter, setWeatherStateFilter] = useState<string>('all');
  const [tempAnomalyFilter, setTempAnomalyFilter] = useState<string>('all');
  const [tempStateFilter, setTempStateFilter] = useState<string>('all');

  // Initialize and run 2-hourly countdown ticker
  useEffect(() => {
    setCycloneSteps(CycloneService.getTwoHourTimeSteps());
    setCycloneSnapshot(CycloneService.getCycloneSnapshotForOffset(selectedCycloneOffset));

    setTimeSteps(WindService.getTwoHourTimeSteps());
    setWindSnapshot(WindService.getWindSnapshotForOffset(selectedOffset));

    const interval = setInterval(() => {
      const remaining = CycloneService.getSecondsUntilNextTwoHourCycle();
      setCountdownSeconds(remaining);
      if (remaining === 7199 || remaining === 0) {
        setCycloneSteps(CycloneService.getTwoHourTimeSteps());
        setCycloneSnapshot(CycloneService.getCycloneSnapshotForOffset(selectedCycloneOffset));
        setTimeSteps(WindService.getTwoHourTimeSteps());
        setWindSnapshot(WindService.getWindSnapshotForOffset(selectedOffset));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedCycloneOffset, selectedOffset]);

  // Auto-play through Cyclone 2-hour time steps
  useEffect(() => {
    if (!isCycloneAutoStepping) return;
    const playTimer = setInterval(() => {
      setSelectedCycloneOffset((prev) => {
        const next = prev + 2;
        return next > 6 ? -6 : next;
      });
    }, 3000);
    return () => clearInterval(playTimer);
  }, [isCycloneAutoStepping]);

  // Auto-play through Wind 2-hour time steps
  useEffect(() => {
    if (!isAutoStepping) return;
    const playTimer = setInterval(() => {
      setSelectedOffset((prev) => {
        const next = prev + 2;
        return next > 8 ? -6 : next;
      });
    }, 3000);
    return () => clearInterval(playTimer);
  }, [isAutoStepping]);

  const handleManualSync = () => {
    setCycloneSteps(CycloneService.getTwoHourTimeSteps());
    setCycloneSnapshot(CycloneService.getCycloneSnapshotForOffset(selectedCycloneOffset));
    setTimeSteps(WindService.getTwoHourTimeSteps());
    setWindSnapshot(WindService.getWindSnapshotForOffset(selectedOffset));
  };

  // Simple, Clean Map Layer Names
  const layers = [
    { id: 'cyclone', label: 'cyclone maps' },
    { id: 'wind', label: 'wind maps' },
    { id: 'weather', label: 'weather maps' },
    { id: 'radar', label: 'doppler maps' },
    { id: 'satellite', label: 'satellite maps' },
    { id: 'temperature', label: 'thermal anomaly maps' },
    { id: 'normal', label: 'street maps' },
  ];

  // Strictly Isolated Layer Mapping
  const mapLayers: MapLayersState = {
    weatherRadar: selectedLayer === 'radar',
    isobarWinds: selectedLayer === 'wind',
    weatherMap: selectedLayer === 'weather',
    floodInundation: false,
    cycloneTrack: selectedLayer === 'cyclone',
    wildfireHotspots: selectedLayer === 'temperature',
    earthquakes: false,
    sosBeacons: false,
    safeShelters: false,
    baseLayer: selectedLayer === 'satellite' || selectedLayer === 'cyclone' ? 'satellite' : 'light',
  };

  const coords: [number, number] = selectedLocation?.coordinates && selectedLocation.coordinates.length === 2
    ? [selectedLocation.coordinates[0], selectedLocation.coordinates[1]]
    : [17.6868, 83.2185];

  const filteredStreams = windSnapshot.streamlines.filter(s => {
    if (flowFilter === 'upstream') return s.flowType === 'upstream';
    if (flowFilter === 'downstream') return s.flowType === 'downstream';
    if (flowFilter === 'heavy') return s.avgSpeedKmh >= 60;
    return true;
  });

  const anomalyStats = useMemo(() => {
    return TemperatureAnomalyService.getNationalAnomalyStats();
  }, []);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header with simple names */}
      <div className="border-b border-slate-200 dark:border-[#27272a] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
            {selectedLayer === 'cyclone' && 'cyclone maps'}
            {selectedLayer === 'wind' && 'wind maps'}
            {selectedLayer === 'weather' && 'weather maps'}
            {selectedLayer === 'radar' && 'doppler maps'}
            {selectedLayer === 'satellite' && 'satellite maps'}
            {selectedLayer === 'temperature' && 'thermal anomaly maps'}
            {selectedLayer === 'normal' && 'street maps'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#a1a1aa] mt-0.5">
            Real time data refreshed every 2 hours.
          </p>
        </div>

        {/* 2-Hour Synoptic Countdown Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-slate-600 dark:text-slate-300">2h Refresh:</span>
            <strong className="text-blue-700 dark:text-blue-400">{CycloneService.formatCountdown(countdownSeconds)}</strong>
          </div>
          <button
            onClick={handleManualSync}
            className="p-1.5 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            title="Refresh now"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2-Hour Synoptic Cyclone Time Step Bar */}
      {selectedLayer === 'cyclone' && (
        <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white">
              2-HOUR CADENCE
            </span>
            <span className="text-xs text-slate-300">
              Bulletin: <strong>{cycloneSnapshot.bulletinNumber}</strong> • <strong>{cycloneSnapshot.cycleLabel}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setIsCycloneAutoStepping(prev => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-all cursor-pointer shrink-0 mr-1"
            >
              {isCycloneAutoStepping ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isCycloneAutoStepping ? 'Pause' : 'Loop 2h'}</span>
            </button>

            {cycloneSteps.map((step) => {
              const isSelected = selectedCycloneOffset === step.offsetHours;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setIsCycloneAutoStepping(false);
                    setSelectedCycloneOffset(step.offsetHours);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {step.label.split(' • ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2-Hour Synoptic Wind Time Step Bar */}
      {selectedLayer === 'wind' && (
        <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-600 text-white">
              2-HOUR WIND CADENCE
            </span>
            <span className="text-xs text-slate-300">
              Cycle: <strong>{windSnapshot.cycleTimestamp}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setIsAutoStepping(prev => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all cursor-pointer shrink-0 mr-1"
            >
              {isAutoStepping ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isAutoStepping ? 'Pause' : 'Loop 2h'}</span>
            </button>

            {timeSteps.map((step) => {
              const isSelected = selectedOffset === step.offsetHours;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setIsAutoStepping(false);
                    setSelectedOffset(step.offsetHours);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {step.label.split(' • ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Map Navigation Bar: Simple Names Only */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {layers.map((layer) => {
          const isSelected = selectedLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setSelectedLayer(layer.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer capitalize ${
                isSelected
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {layer.label}
            </button>
          );
        })}
      </div>

      {/* Weather Map State Selector */}
      {selectedLayer === 'weather' && (
        <div className="p-3 rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Select State:</span>
            <select
              value={weatherStateFilter}
              onChange={(e) => setWeatherStateFilter(e.target.value)}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="all">All India</option>
              <option value="andhra pradesh">Andhra Pradesh</option>
              <option value="odisha">Odisha</option>
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
            </select>
          </div>
        </div>
      )}

      {/* Thermal Anomaly Map Control Bar */}
      {selectedLayer === 'temperature' && (
        <div className="p-3 rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Max Heat: <strong className="text-red-600">{anomalyStats.maxPositiveAnomaly}</strong> • Max Cooling: <strong className="text-cyan-600">{anomalyStats.maxNegativeAnomaly}</strong>
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Departures' },
                { id: 'heatwave', label: 'Severe Heatwave (>+5°C)' },
                { id: 'above_normal', label: 'Above Normal (+2 to +4°C)' },
                { id: 'near_normal', label: 'Near Normal (±1°C)' },
                { id: 'cooling', label: 'Cyclone Cooling (<-3°C)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTempAnomalyFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    tempAnomalyFilter === f.id
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="h-[620px] rounded-2xl border border-slate-200 dark:border-[#27272a] overflow-hidden shadow-xs relative">
        <IndiaSafetyMap
          satelliteChannel="HD-SAT"
          hazards={hazards}
          states={DEMO_STATES}
          sosBeacons={[]}
          shelters={[]}
          layers={mapLayers}
          selectedStateName={selectedLayer === 'weather' ? weatherStateFilter : (selectedLayer === 'temperature' ? tempStateFilter : 'all')}
          userLocation={coords}
          customWindData={windSnapshot}
          customCycloneData={cycloneSnapshot}
          heightClass="h-full"
        />
      </div>

      {/* Cyclone Systems Summary: ONLY shown on Cyclone Map */}
      {selectedLayer === 'cyclone' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cycloneSnapshot.systems.map((system) => (
            <div key={system.id} className="p-3.5 rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="font-black text-slate-900 dark:text-white">
                  Cyclone {system.name} ({system.basin})
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                  system.imdAlertLevel === 'RED_WARNING' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-black'
                }`}>
                  {system.category}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                <div>Winds: <strong className="text-red-600">{system.windSpeedKmh} km/h</strong> (Gusts {system.gustSpeedKmh} km/h) • Pressure: <strong>{system.centralPressureHpa} hPa</strong></div>
                <div>Location: <strong>{system.center[0]}°N, {system.center[1]}°E</strong> • Landfall: <strong>{system.landfallTarget}</strong></div>
              </div>
              <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-snug">{system.synopticSummary}</p>
            </div>
          ))}
        </div>
      )}

      {/* Wind Dynamics Dashboard: ONLY shown on Wind Map */}
      {selectedLayer === 'wind' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Active Gale Warning Corridors</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-600 text-white">
                {windSnapshot.warningZones.length} ACTIVE
              </span>
            </div>
            <div className="space-y-1 text-xs text-red-900 dark:text-red-300">
              {windSnapshot.warningZones.map(z => (
                <div key={z.id} className="p-2 rounded-xl bg-white/70 dark:bg-black/40 border border-red-200/60 dark:border-red-900/40">
                  <div className="font-bold text-[11px]">{z.title}</div>
                  <div className="text-[10px] text-red-700 dark:text-red-400 mt-0.5 font-mono">
                    Winds: <strong>{z.currentWindKmh} km/h</strong> • Gusts: <strong>{z.peakGustKmh} km/h</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-400">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Upstream & Downstream Flow</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300">
                {windSnapshot.cycleTimestamp}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-300 max-h-[160px] overflow-y-auto pr-1">
              {filteredStreams.slice(0, 3).map(s => (
                <div key={s.id} className="p-2 rounded-xl bg-white/70 dark:bg-black/40 border border-blue-200/60 dark:border-blue-900/40 space-y-0.5">
                  <div className="font-bold text-[11px] text-blue-900 dark:text-blue-200 flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className="font-mono">{s.avgSpeedKmh} km/h</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">From: {s.originRegion}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">To: {s.destinationRegion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Gauge className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>Station Anemometers</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {windSnapshot.anemometers.length} STATIONS
              </span>
            </div>
            <div className="space-y-1 text-xs max-h-[160px] overflow-y-auto pr-1">
              {windSnapshot.anemometers.slice(0, 4).map(stn => (
                <div key={stn.id} className="p-1.5 px-2 rounded-lg bg-white dark:bg-black/60 border border-slate-200 dark:border-[#27272a] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200">{stn.stationName.split(' ')[0]} ({stn.state})</div>
                    <div className="text-[9.5px] text-slate-500 font-mono">{stn.directionDegrees}° ({stn.cardinalDirection}) • {stn.barometricPressureHpa} hPa</div>
                  </div>
                  <div className="text-right font-mono font-bold text-[11px] text-slate-900 dark:text-white">
                    {stn.windSpeedKmh} <span className="text-[9px] font-normal text-slate-500">km/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchMapsPage;
