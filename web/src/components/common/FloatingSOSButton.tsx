import React from 'react';
import { useSOS } from '../../context/SOSContext';
import { useTranslation } from '../../i18n/useTranslation';

interface FloatingSOSButtonProps {
  onTriggerSOS: () => void;
}

export const FloatingSOSButton: React.FC<FloatingSOSButtonProps> = ({ onTriggerSOS }) => {
  const { beacons } = useSOS();
  const { dict } = useTranslation();
  const activeSOSCount = beacons.filter(
    (b) => b.triageStatus !== 'RESOLVED' && b.triageStatus !== 'CANCELLED'
  ).length;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      <button
        onClick={onTriggerSOS}
        className="group relative flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-sans font-black text-sm tracking-wider shadow-2xl shadow-red-950/80 border border-red-400/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Broadcast Emergency SOS Signal"
      >
        {/* Pulsing Alert Ring */}
        <span className="absolute -inset-1 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
        
        <span className="material-symbols-outlined text-2xl font-black">emergency</span>
        <span className="tracking-widest">{dict.emergencySos?.toUpperCase() || "EMERGENCY SOS"}</span>

        {activeSOSCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/30 text-xs font-mono font-bold">
            {activeSOSCount} ACTIVE
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingSOSButton;
