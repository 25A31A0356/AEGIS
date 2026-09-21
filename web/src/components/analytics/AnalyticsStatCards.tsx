import React from 'react';
import {
  Activity,
  Layers,
  Users,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { AnalyticsResult } from '../../services/analyticsService';

interface AnalyticsStatCardsProps {
  stats: AnalyticsResult['stats'];
}

export const AnalyticsStatCards: React.FC<AnalyticsStatCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Peak Intensity */}
      <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 shadow-card flex flex-col justify-between hover:shadow-elevated transition-shadow">
        <div className="flex items-center justify-between text-[#708696] mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
            Peak Intensity
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#FEF1F3] border border-[#FDC8D1] text-[#E94B68] flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-[#18364A] font-sans tracking-tight">
            {stats.peakIntensity}
          </div>
          <div className="text-xs font-semibold text-[#E94B68] mt-1 flex items-center gap-1">
            <span>{stats.peakIntensityLabel}</span>
          </div>
        </div>
      </div>

      {/* 2. Total Events */}
      <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 shadow-card flex flex-col justify-between hover:shadow-elevated transition-shadow">
        <div className="flex items-center justify-between text-[#708696] mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
            Total Events
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#EDFAFC] border border-[#AEEBF0] text-[#075B8A] flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-[#18364A] font-sans tracking-tight">
            {stats.totalEvents}
          </div>
          <div className="text-xs font-medium text-[#708696] mt-1">
            <span className="font-bold text-[#075B8A]">{stats.activeEvents} Active</span> • {stats.totalEvents - stats.activeEvents} Monitored
          </div>
        </div>
      </div>

      {/* 3. People Affected */}
      <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 shadow-card flex flex-col justify-between hover:shadow-elevated transition-shadow">
        <div className="flex items-center justify-between text-[#708696] mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
            People Affected
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#FFFBF0] border border-[#FDE8A4] text-[#B78809] flex items-center justify-center shadow-xs">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-[#18364A] font-sans tracking-tight">
            {stats.peopleAffected}
          </div>
          <div className="text-xs font-medium text-[#708696] mt-1">
            Estimated Inundated & Vulnerable
          </div>
        </div>
      </div>

      {/* 4. Trend */}
      <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 shadow-card flex flex-col justify-between hover:shadow-elevated transition-shadow">
        <div className="flex items-center justify-between text-[#708696] mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
            Trend
          </span>
          <div
            className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-xs ${
              stats.trendPositive
                ? 'bg-[#FEF1F3] border-[#FDC8D1] text-[#E94B68]'
                : 'bg-[#EFFCF6] border-[#B7F1DC] text-[#1E8A63]'
            }`}
          >
            {stats.trendPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
          </div>
        </div>
        <div>
          <div
            className={`text-xl sm:text-2xl font-black font-sans tracking-tight ${
              stats.trendPositive ? 'text-[#E94B68]' : 'text-[#1E8A63]'
            }`}
          >
            {stats.trend}
          </div>
          <div className="text-[11px] text-[#708696] mt-1 line-clamp-1">
            {stats.trendSubtext}
          </div>
        </div>
      </div>
    </div>
  );
};
