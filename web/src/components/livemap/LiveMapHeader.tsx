import React from 'react';
import { Radio, RefreshCw } from 'lucide-react';
import { DataStatusIndicator } from '../common/DataStatusIndicator';

interface LiveMapHeaderProps {
  lastUpdated?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const LiveMapHeader: React.FC<LiveMapHeaderProps> = ({
  lastUpdated = 'Updated 2 min ago',
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[20px] border border-[#DCEBED] shadow-card">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#18C3D0] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#075B8A]"></span>
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#075B8A] tracking-tight uppercase font-sans">
            LIVE MAP
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#708696] font-medium mt-1">
          Explore conditions around your saved locations and switch technical layers to understand what is developing.
        </p>
      </div>

      {/* Status Pill, Data-Mode Badge & Live Indicator */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <DataStatusIndicator sourceHint="IMD DWR • MOSDAC • IITM" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDFAFC] border border-[#AEEBF0] text-[#075B8A] text-xs font-semibold shadow-xs">
          <Radio className="w-3.5 h-3.5 text-[#18C3D0] animate-pulse" />
          <span>Live map data • {lastUpdated}</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-[#F4F8FA] hover:bg-[#EDFAFC] text-[#075B8A] border border-[#DCEBED] transition-colors disabled:opacity-50"
            title="Refresh map layers"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#18C3D0]' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
