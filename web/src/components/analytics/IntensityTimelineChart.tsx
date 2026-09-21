import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { AnalyticsResult } from '../../services/analyticsService';

interface IntensityTimelineChartProps {
  data: AnalyticsResult['timeline'];
}

export const IntensityTimelineChart: React.FC<IntensityTimelineChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#DCEBED] rounded-2xl p-3.5 shadow-float text-xs">
          <div className="font-mono font-bold text-[#075B8A] mb-1.5 pb-1 border-b border-[#DCEBED]">
            TIMELINE: {label}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#18364A]">
                <span className="w-2 h-2 rounded-full bg-[#18C3D0]" />
                Intensity Index:
              </span>
              <span className="font-mono font-bold text-[#075B8A]">
                {payload[0]?.value} / 100
              </span>
            </div>
            {payload[1] && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#18364A]">
                  <span className="w-2 h-2 rounded-full bg-[#E94B68]" />
                  Active Bulletins:
                </span>
                <span className="font-mono font-bold text-[#E94B68]">
                  {payload[1]?.value} alerts
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#DCEBED] gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#18364A] font-sans">
            Intensity & Impact Timeline
          </h3>
          <p className="text-xs text-[#708696] mt-0.5">
            Temporal evolution of hazard intensity scale and concurrent emergency bulletins.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#18C3D0]" />
            <span className="text-[#18364A] font-semibold">Intensity Index</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E94B68]" />
            <span className="text-[#18364A] font-semibold">Incident Volume</span>
          </div>
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#18C3D0" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#18C3D0" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E94B68" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#E94B68" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF5F8" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#708696"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#DCEBED' }}
            />
            <YAxis
              stroke="#708696"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="intensityIndex"
              name="Intensity Index"
              stroke="#075B8A"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#intensityGrad)"
            />
            <Area
              type="monotone"
              dataKey="alertCount"
              name="Incident Volume"
              stroke="#E94B68"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#alertGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
