import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { AnalyticsResult } from '../../services/analyticsService';

interface SeverityDistributionChartProps {
  data: AnalyticsResult['severityDistribution'];
}

export const SeverityDistributionChart: React.FC<SeverityDistributionChartProps> = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#DCEBED] rounded-xl p-2.5 shadow-float text-xs">
          <div className="font-bold text-[#18364A]">{item.name}</div>
          <div className="text-[#075B8A] font-mono mt-0.5">
            {item.count} events ({item.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card flex flex-col justify-between">
      <div className="pb-3 mb-3 border-b border-[#DCEBED]">
        <h3 className="text-sm sm:text-base font-bold text-[#18364A] font-sans">
          Severity Distribution
        </h3>
        <p className="text-xs text-[#708696] mt-0.5">
          Proportion of incidents categorized by tactical risk triage level.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-2">
        {/* Donut Chart */}
        <div className="sm:col-span-6 h-48 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-[#18364A] font-mono">{total}</span>
            <span className="text-[9px] font-mono text-[#708696] uppercase">Events</span>
          </div>
        </div>

        {/* Legend breakdown list */}
        <div className="sm:col-span-6 space-y-2">
          {data.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-[#F4F8FA] border border-[#DCEBED] text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-[#18364A]">{item.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[#708696]">{item.count}</span>
                <span className="font-bold text-[#075B8A]">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
