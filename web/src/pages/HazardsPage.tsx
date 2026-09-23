import React, { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { HazardDetailModal } from '../components/hazards/HazardDetailModal';
import { AlertManagementModal } from '../components/hazards/AlertManagementModal';
import { HazardService, HazardFilterOptions } from '../services/hazardService';
import { HazardItem } from '../types/hazard';

interface HazardsPageProps {
  onNavigate: (tab: string) => void;
  preSelectedHazardId?: string | null;
  initialCategory?: string;
}

export const HazardsPage: React.FC<HazardsPageProps> = ({
  onNavigate,
  preSelectedHazardId,
  initialCategory,
}) => {
  const { selectedLocation, weather } = useLocation();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'MODERATE' | 'SAFE'>('ALL');
  const [activeModalHazard, setActiveModalHazard] = useState<HazardItem | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<string | null>(null);

  const cityName = selectedLocation?.name || weather?.cityName || 'Visakhapatnam';

  const [filters, setFilters] = useState<HazardFilterOptions>({
    category: (initialCategory as any) || 'all',
    severity: 'all',
    nature: 'all',
    status: 'all',
    searchQuery: '',
  });

  const [hazardsList, setHazardsList] = useState<HazardItem[]>(() => HazardService.filterHazards(filters));

  useEffect(() => {
    if (preSelectedHazardId) {
      const hz = HazardService.getHazardById(preSelectedHazardId);
      if (hz) setActiveModalHazard(hz);
    }
  }, [preSelectedHazardId]);

  useEffect(() => {
    HazardService.fetchLiveHazards().then(() => {
      setHazardsList(HazardService.filterHazards(filters));
    }).catch(console.error);

    const unsubscribe = HazardService.subscribe(() => {
      setHazardsList(HazardService.filterHazards(filters));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setHazardsList(HazardService.filterHazards(filters));
  }, [filters]);

  const filteredAlerts = hazardsList.filter((h: HazardItem) => {
    if (severityFilter === 'ALL') return true;
    return h.severity.toUpperCase() === severityFilter;
  });

  const handleAudioTTS = (alert: HazardItem) => {
    if ('speechSynthesis' in window) {
      if (isAudioPlaying === alert.id) {
        window.speechSynthesis.cancel();
        setIsAudioPlaying(null);
        return;
      }
      const textToRead = `Emergency warning for ${alert.location?.district || cityName}. ${alert.title}. ${alert.description}. Urgency: ${alert.severity}. Recommended actions: Evacuate low-lying areas and follow civil defense advisories.`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.onend = () => setIsAudioPlaying(null);
      utterance.onerror = () => setIsAudioPlaying(null);
      window.speechSynthesis.speak(utterance);
      setIsAudioPlaying(alert.id);
    }
  };

  const criticalCount = hazardsList.filter(h => h.severity === 'critical').length;
  const warningCount = hazardsList.filter(h => h.severity === 'warning').length;
  const advisoryCount = hazardsList.filter(h => h.severity === 'moderate' || h.severity === 'minor').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="stitch-card p-6 bg-[#131f3d]/90 border-[#334155]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs uppercase">
              OFFICIAL CAP WARNING CENTER
            </span>
            <span className="text-xs text-slate-400 font-mono">|</span>
            <span className="text-xs font-mono text-slate-300">{cityName} Sector</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Active Warning Center & Bulletins
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Official early warning bulletins issued by IMD, CWC, NDMA, and State Disaster Management Authorities.
          </p>
        </div>

        <button
          onClick={() => setIsAlertModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs font-mono shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-lg">campaign</span>
          <span>Publish Official Advisory</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSeverityFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-mono transition-all border ${
            severityFilter === 'ALL'
              ? 'bg-sky-600 text-white border-sky-400'
              : 'bg-[#131f3d] text-slate-300 border-[#334155] hover:bg-[#1e293b]'
          }`}
        >
          All Alerts ({hazardsList.length})
        </button>

        <button
          onClick={() => setSeverityFilter('CRITICAL')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono transition-all border ${
            severityFilter === 'CRITICAL'
              ? 'bg-red-600 text-white border-red-400'
              : 'bg-[#131f3d] text-red-400 border-red-500/40 hover:bg-red-950/40'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Critical ({criticalCount})</span>
        </button>

        <button
          onClick={() => setSeverityFilter('WARNING')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono transition-all border ${
            severityFilter === 'WARNING'
              ? 'bg-amber-600 text-white border-amber-400'
              : 'bg-[#131f3d] text-amber-400 border-amber-500/40 hover:bg-amber-950/40'
          }`}
        >
          <span>Warning ({warningCount})</span>
        </button>

        <button
          onClick={() => setSeverityFilter('MODERATE')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-mono transition-all border ${
            severityFilter === 'MODERATE'
              ? 'bg-cyan-600 text-white border-cyan-400'
              : 'bg-[#131f3d] text-cyan-400 border-cyan-500/40 hover:bg-cyan-950/40'
          }`}
        >
          Advisory ({advisoryCount})
        </button>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="stitch-card p-12 bg-[#131f3d]/80 border-[#334155]/60 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
            <h3 className="font-bold text-white text-base">No Active Alerts for this Filter</h3>
            <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto">
              All monitored atmospheric and geological thresholds are currently within safe baseline parameters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert: HazardItem) => (
            <div
              key={alert.id}
              className={`stitch-card p-6 bg-[#131f3d]/90 border transition-all ${
                alert.severity === 'critical' ? 'border-red-500/50 hover:border-red-400' :
                alert.severity === 'warning' ? 'border-amber-500/50 hover:border-amber-400' :
                'border-sky-500/50 hover:border-sky-400'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#334155]/50 gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    alert.severity === 'critical' ? 'bg-red-500 text-white' :
                    alert.severity === 'warning' ? 'bg-amber-500 text-black' :
                    'bg-sky-500 text-white'
                  }`}>
                    {alert.severity} ADVISORY
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    Sector: <strong>{alert.location?.district || cityName}, {alert.location?.state || 'India'}</strong>
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  Valid Until: 24 Hours from Issuance
                </span>
              </div>

              <div className="my-4">
                <h2 className="text-lg font-bold text-white font-sans">{alert.title}</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">{alert.description}</p>
              </div>

              <div className="pt-3 border-t border-[#334155]/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAudioTTS(alert)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-colors ${
                      isAudioPlaying === alert.id
                        ? 'bg-red-600 text-white border-red-400 animate-pulse'
                        : 'bg-[#0b1329] hover:bg-[#1e293b] text-slate-300 border-[#334155]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isAudioPlaying === alert.id ? 'volume_up' : 'volume_mute'}
                    </span>
                    <span>{isAudioPlaying === alert.id ? 'Broadcasting...' : 'Audio TTS Readout'}</span>
                  </button>

                  <button
                    onClick={() => setActiveModalHazard(alert)}
                    className="px-3 py-1.5 rounded-lg bg-[#0b1329] hover:bg-[#1e293b] border border-[#334155] text-slate-300 text-xs font-semibold font-mono transition-colors"
                  >
                    View Details
                  </button>
                </div>

                <button
                  onClick={() => onNavigate('live-map')}
                  className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 font-mono"
                >
                  <span>Locate On Tactical Map</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <HazardDetailModal
        hazard={activeModalHazard}
        onClose={() => setActiveModalHazard(null)}
        onViewOnMap={() => onNavigate('live-map')}
      />

      <AlertManagementModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onAlertCreated={() => {
          HazardService.fetchLiveHazards().then(() => {
            setHazardsList(HazardService.filterHazards(filters));
          });
        }}
      />
    </div>
  );
};
