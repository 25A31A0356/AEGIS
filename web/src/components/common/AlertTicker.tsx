import React, { useState } from 'react';
import { useLocation } from '../../context/LocationContext';
import { HazardService } from '../../services/hazardService';
import { HazardItem } from '../../types/hazard';

interface AlertTickerProps {
  onSelectHazard?: (hazardId: string) => void;
}

export const AlertTicker: React.FC<AlertTickerProps> = ({ onSelectHazard }) => {
  const { selectedLocation, weather } = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hazards, setHazards] = useState<HazardItem[]>(() => HazardService.getAllHazards());

  React.useEffect(() => {
    HazardService.fetchLiveHazards().then(setHazards).catch(console.error);
    return HazardService.subscribe(() => setHazards(HazardService.getAllHazards()));
  }, []);

  if (isDismissed) return null;

  const criticalAlert = hazards.find((a: HazardItem) => a.severity === 'critical' || a.severity === 'warning') || hazards[0];
  const alertTitle = criticalAlert?.title || 'Severe Flood Inundation & Gale Wind Advisory in Effect';
  const alertDistrict = criticalAlert?.location?.district || selectedLocation?.name || weather?.cityName || 'Regional Sector';
  const alertSeverity = (criticalAlert?.severity || 'critical').toUpperCase();
  const alertId = criticalAlert?.id || 'hazard-active-banner';

  const handleAudioTTS = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      if (isAudioPlaying) {
        window.speechSynthesis.cancel();
        setIsAudioPlaying(false);
        return;
      }
      const textToRead = `Emergency Advisory for ${alertDistrict}. ${alertTitle}. Please take immediate precautions.`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsAudioPlaying(true);
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-950 via-rose-950 to-slate-950 border-b border-red-500/30 text-white px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div 
          onClick={() => onSelectHazard && onSelectHazard(alertId)}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
        >
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          
          <div className="inline-flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded bg-red-600/80 text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              {alertSeverity} CAP ADVISORY
            </span>
          </div>

          <p className="truncate font-medium text-slate-100 group-hover:text-red-200 transition-colors">
            <span className="font-bold text-red-300">[{alertDistrict}]: </span>
            {alertTitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAudioTTS}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              isAudioPlaying 
                ? 'bg-red-600 text-white border-red-400 animate-pulse' 
                : 'bg-red-950/60 hover:bg-red-900/60 text-red-200 border-red-500/40'
            }`}
            title="Listen to official audio broadcast (TTS)"
            aria-label="Text-to-speech audio readout"
          >
            <span className="material-symbols-outlined text-sm">
              {isAudioPlaying ? 'volume_up' : 'volume_mute'}
            </span>
            <span className="hidden md:inline text-[11px] font-mono">
              {isAudioPlaying ? 'Broadcasting...' : 'Audio TTS'}
            </span>
          </button>

          <button
            onClick={() => onSelectHazard && onSelectHazard(alertId)}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-red-300 hover:text-white transition-colors underline decoration-red-400 underline-offset-4"
          >
            <span>View Advisory Details</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-red-300/70 hover:text-white hover:bg-red-900/40 transition-colors"
            title="Dismiss banner"
            aria-label="Dismiss banner"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
