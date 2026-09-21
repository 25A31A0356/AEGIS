import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { SafetyGuideItem } from '../../data/safetyGuidesData';

interface DosAndDontsSectionProps {
  guide: SafetyGuideItem;
}

export const DosAndDontsSection: React.FC<DosAndDontsSectionProps> = ({ guide }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 1. DO'S COLUMN */}
      <div className="space-y-3">
        {/* Column Header */}
        <div className="flex items-center gap-2 pb-1">
          <div className="w-7 h-7 rounded-full bg-[#EFFCF6] border border-[#B7F1DC] flex items-center justify-center text-[#1E8A63]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#18364A] tracking-tight font-sans">
            DO'S
          </h3>
          <span className="text-[10px] font-mono font-bold text-[#1E8A63] bg-[#EFFCF6] px-2 py-0.5 rounded-full border border-[#B7F1DC]">
            4 Recommended Actions
          </span>
        </div>

        {/* 4 Clean Numbered Cards */}
        <div className="space-y-3">
          {guide.dos.map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-[20px] border border-[#DCEBED] p-4 sm:p-5 shadow-card hover:shadow-elevated transition-all flex items-start gap-3.5 group"
            >
              {/* Number Badge */}
              <div className="w-7 h-7 rounded-full bg-[#EFFCF6] border border-[#B7F1DC] text-[#1E8A63] font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                {item.step}
              </div>

              {/* Text content */}
              <div className="flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-[#18364A] group-hover:text-[#075B8A] transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-[#708696] leading-relaxed mt-0.5">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. DON'TS COLUMN */}
      <div className="space-y-3">
        {/* Column Header */}
        <div className="flex items-center gap-2 pb-1">
          <div className="w-7 h-7 rounded-full bg-[#FEF1F3] border border-[#FDC8D1] flex items-center justify-center text-[#E94B68]">
            <XCircle className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#18364A] tracking-tight font-sans">
            DON'TS
          </h3>
          <span className="text-[10px] font-mono font-bold text-[#E94B68] bg-[#FEF1F3] px-2 py-0.5 rounded-full border border-[#FDC8D1]">
            4 Critical Prohibitions
          </span>
        </div>

        {/* 4 Clean Numbered Cards */}
        <div className="space-y-3">
          {guide.donts.map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-[20px] border border-[#DCEBED] p-4 sm:p-5 shadow-card hover:shadow-elevated transition-all flex items-start gap-3.5 group"
            >
              {/* Number Badge */}
              <div className="w-7 h-7 rounded-full bg-[#FEF1F3] border border-[#FDC8D1] text-[#E94B68] font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                {item.step}
              </div>

              {/* Text content */}
              <div className="flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-[#18364A] group-hover:text-[#E94B68] transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-[#708696] leading-relaxed mt-0.5">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
