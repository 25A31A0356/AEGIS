import React, { useState, useEffect } from 'react';
import { ChevronRight, BellRing } from 'lucide-react';
import { HazardService } from '../../services/hazardService';
import { HazardItem } from '../../types/hazard';

interface AlertTickerProps {
  onSelectHazard?: (hazardId: string) => void;
}

export const AlertTicker: React.FC<AlertTickerProps> = ({ onSelectHazard }) => {
  const [hazards, setHazards] = useState<HazardItem[]>(() => HazardService.getAllHazards());

  useEffect(() => {
    HazardService.fetchLiveHazards().then(setHazards).catch(console.error);

    const unsubscribe = HazardService.subscribe(() => {
      setHazards(HazardService.getAllHazards());
    });
    return unsubscribe;
  }, []);

  const activeBulletins = hazards.filter(
    (h) => h.severity === 'critical' || h.severity === 'warning' || h.severity === 'moderate'
  );

  const displayList = activeBulletins.length > 0 ? activeBulletins : hazards.slice(0, 5);

  return (
    <div className="bg-[#075B8A] border-b border-[#0B6E9E] text-white text-xs py-2 px-4 flex items-center shadow-inner relative z-10 select-none">
      {/* Lead Tag */}
      <div className="flex items-center gap-1.5 bg-[#E94B68] text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase shrink-0 shadow-sm mr-3">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        <BellRing className="w-3 h-3" />
        <span>LIVE ALERTS</span>
      </div>

      {/* Marquee Content */}
      <div className="ticker-wrap flex-1 overflow-hidden">
        <div className="ticker-move flex items-center gap-8">
          {displayList.concat(displayList).map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => onSelectHazard && onSelectHazard(item.id)}
              className="inline-flex items-center gap-2 cursor-pointer text-[#D3E8F4] hover:text-white transition-colors group"
            >
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  item.severity === 'critical'
                    ? 'bg-[#E94B68] text-white'
                    : item.severity === 'warning'
                    ? 'bg-[#F4C84A] text-[#18364A]'
                    : 'bg-[#18C3D0] text-[#075B8A]'
                }`}
              >
                {item.nature.toUpperCase()}
              </span>
              <span className="font-bold text-white">[{item.location.state}]</span>
              <span className="text-[#D3E8F4] group-hover:underline">{item.title}</span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-[#A7D7E8]">{item.source.agency}</span>
              <ChevronRight className="w-3 h-3 text-[#18C3D0] group-hover:translate-x-0.5 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      {/* Real-time telemetry feed indicator */}
      <div className="hidden lg:flex items-center gap-2 text-[10px] text-[#A7D7E8] font-mono pl-3 border-l border-white/20 shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#45C79A] animate-pulse" />
        <span>TELEMETRY: ACTIVE</span>
      </div>
    </div>
  );
};
