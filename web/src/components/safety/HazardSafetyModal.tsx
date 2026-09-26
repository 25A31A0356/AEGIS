import React, { useEffect } from 'react';
import { HazardSafetyGuide } from '../../data/ndmaSafetyData';
import {
  X,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Video,
  Printer,
  AlertTriangle,
  PhoneCall,
} from 'lucide-react';

interface HazardSafetyModalProps {
  guide: HazardSafetyGuide | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSOS?: () => void;
}

export const HazardSafetyModal: React.FC<HazardSafetyModalProps> = ({
  guide,
  isOpen,
  onClose,
  onNavigateToSOS,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !guide) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 font-sans animate-scaleUp">
        {/* Real Image Header Banner */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden shrink-0">
          <img
            src={guide.imageUrl}
            alt={guide.name}
            className="w-full h-full object-cover brightness-90"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-black/50 to-black/30" />

          {/* Top Floating Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-[11px] font-mono font-black text-white shadow-md backdrop-blur-md"
                style={{ backgroundColor: guide.badgeColor }}
              >
                {guide.shortName.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified by {guide.authority}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-white bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title on bottom of banner */}
          <div className="absolute bottom-4 left-4 right-4 space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
              {guide.name}
            </h2>
            <p className="text-xs text-slate-200 font-medium drop-shadow-sm max-w-2xl line-clamp-1">
              {guide.tagline}
            </p>
          </div>
        </div>

        {/* Modal Body: Two Columns (DO's & DON'Ts) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* DO's Column */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>DO's — ESSENTIAL ACTIONS</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  {guide.dos.length} RULES
                </span>
              </div>

              <ul className="space-y-3">
                {guide.dos.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    <span className="mt-0.5 text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-sm leading-none">
                      ✅
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'Ts Column */}
            <div className="p-4 sm:p-5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-red-200 dark:border-red-800/40">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-black text-sm tracking-wide">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span>DON'Ts — CRITICAL PROHIBITIONS</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                  {guide.donts.length} WARNINGS
                </span>
              </div>

              <ul className="space-y-3">
                {guide.donts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    <span className="mt-0.5 text-red-600 dark:text-red-400 font-bold shrink-0 text-sm leading-none">
                      ❌
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Disaster Advice Note */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Standard Operating Procedures formulated in accordance with the National Disaster Management Authority ({guide.authority}).
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
              NDMA-SOP-2026
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Official Safety Video Button */}
          <a
            href={guide.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <Video className="w-4 h-4" />
            <span>▶ {guide.videoButtonLabel}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#27272a] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-[#323238] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print SOP</span>
            </button>

            {onNavigateToSOS && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToSOS();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Distress SOS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HazardSafetyModal;
