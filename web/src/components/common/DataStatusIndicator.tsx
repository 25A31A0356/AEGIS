/**
 * AGIES ALERT - Data Status Indicator Component
 * Provides a clear, non-intrusive indicator displaying whether data is LIVE or DEMO.
 * Click opens the Data Streams Inspector & Mode Switcher.
 */

import React from 'react';
import { useDataProvider } from '../../context/DataProviderContext';
import { Cpu } from 'lucide-react';

interface DataStatusIndicatorProps {
  compact?: boolean;
  showSource?: boolean;
  className?: string;
  sourceHint?: string;
}

export const DataStatusIndicator: React.FC<DataStatusIndicatorProps> = ({
  compact = false,
  showSource = true,
  className = '',
  sourceHint,
}) => {
  const { isLiveMode, dataMode, openInspector } = useDataProvider();

  if (compact) {
    return (
      <button
        onClick={openInspector}
        title={
          isLiveMode
            ? 'Live Data Active: Real-time telemetry from IMD, MOSDAC & CAP feeds (Click to inspect)'
            : 'Demo Mode Active: Simulation training dataset (Click to inspect or switch)'
        }
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
          isLiveMode
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
        } ${className}`}
      >
        <span className="relative flex h-2 w-2">
          {isLiveMode ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          )}
        </span>
        <span>{dataMode}</span>
      </button>
    );
  }

  return (
    <button
      onClick={openInspector}
      type="button"
      className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs transition-all shadow-sm ${
        isLiveMode
          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-900/40'
          : 'bg-amber-950/40 text-amber-200 border border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-900/40'
      } ${className}`}
      title="Click to view all 7 data provider streams & toggle LIVE / DEMO mode"
    >
      <div className="relative flex items-center justify-center">
        {isLiveMode ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        ) : (
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
        )}
      </div>

      <div className="flex items-center gap-1.5 font-medium">
        <span className="font-bold tracking-wider">{isLiveMode ? 'LIVE STREAM' : 'LIVE REAL-TIME MODE'}</span>
        {showSource && (
          <>
            <span className="text-white/30">•</span>
            <span className="text-[11px] opacity-80 truncate max-w-[130px]">
              {sourceHint || (isLiveMode ? 'IMD • MOSDAC • CAP' : 'NDMA Drill Dataset')}
            </span>
          </>
        )}
      </div>

      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 group-hover:bg-white/20 transition-colors font-mono">
        Inspect
      </span>
    </button>
  );
};
