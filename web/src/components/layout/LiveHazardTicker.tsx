import React, { useState, useEffect } from 'react';
import { Radio, ChevronRight } from 'lucide-react';
import { HazardService } from '../../services/hazardService';
import { HazardItem } from '../../types/hazard';

interface LiveHazardTickerProps {
  onSelectHazard?: (hazardId: string) => void;
}

export const LiveHazardTicker: React.FC<LiveHazardTickerProps> = ({ onSelectHazard }) => {
  const [hazards, setHazards] = useState<HazardItem[]>(() => HazardService.getAllHazards());

  useEffect(() => {
    // Initial live fetch
    HazardService.fetchLiveHazards().then(setHazards).catch(console.error);

    // Subscribe to ongoing updates
    const unsubscribe = HazardService.subscribe(() => {
      setHazards(HazardService.getAllHazards());
    });
    return unsubscribe;
  }, []);

  const activeBulletins = hazards.filter((h) => h.severity === 'critical' || h.severity === 'warning');

  return (
    <div className="bg-[#0F172A] border-b border-charcoal-800 text-white text-xs font-mono py-1.5 px-3 flex items-center shadow-inner relative z-20">
      {/* Ticker Lead Tag */}
      <div className="flex items-center gap-1.5 bg-red-600/90 text-white px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase shrink-0 shadow-sm mr-3">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        <Radio className="w-3 h-3" />
        LIVE INTEL
      </div>

      {/* Marquee Content */}
      <div className="ticker-wrap flex-1 overflow-hidden cursor-pointer">
        <div className="ticker-move flex items-center gap-8">
          {activeBulletins.concat(activeBulletins).map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => onSelectHazard && onSelectHazard(item.id)}
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
            >
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                  item.severity === 'critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {item.nature.toUpperCase()}
              </span>
              <span className="font-semibold text-slate-200">[{item.location.state}]</span>
              <span className="text-slate-300 group-hover:underline">{item.title}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{item.source.agency}</span>
              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Status indicator */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 font-sans pl-3 border-l border-slate-700/60 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>IMD & CWC FEED: ACTIVE</span>
      </div>
    </div>
  );
};
