import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const SafetyPageHeader: React.FC = () => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#18364A] tracking-tight font-sans">
          Know what to do, before it happens.
        </h1>
        <p className="text-xs sm:text-sm text-[#708696] mt-1 max-w-2xl font-medium">
          Choose a hazard to get clear, practical guidance for you and your family.
        </p>
      </div>

      {/* Offline Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFFCF6] border border-[#B7F1DC] text-[#1E8A63] text-xs font-semibold shadow-xs shrink-0 self-start md:self-auto">
        <ShieldCheck className="w-4 h-4 text-[#45C79A]" />
        <span>Safety guides are always available offline</span>
      </div>
    </div>
  );
};
