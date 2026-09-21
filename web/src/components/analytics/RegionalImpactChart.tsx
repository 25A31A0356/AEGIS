import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { AnalyticsResult } from '../../services/analyticsService';

interface RegionalImpactChartProps {
  data: AnalyticsResult['regionalImpact'];
}

export const RegionalImpactChart: React.FC<RegionalImpactChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#DCEBED] rounded-xl p-3 shadow-float text-xs">
          <div className="font-bold text-[#18364A]">{item.region}</div>
          <div className="text-[#075B8A] font-mono mt-1">
            People Affected: <strong>{item.affected.toLocaleString()}</strong>
          </div>
          <div className="text-[#708696] font-mono">
            Active Bulletins: <strong>{item.events}</strong> | Severity: <strong>{item.severity.toUpperCase()}</strong>
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
          Regional Impact
        </h3>
        <p className="text-xs text-[#708696] mt-0.5">
          Top geographic corridors ranked by cumulative hazard exposure.
        </p>
      </div>

      <div className="h-48 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF5F8" />
            <XAxis
              type="number"
              stroke="#708696"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#DCEBED' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="region"
              stroke="#18364A"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="affected" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.severity === 'critical'
                      ? '#E94B68'
                      : entry.severity === 'warning'
                      ? '#F4C84A'
                      : '#075B8A'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      <div className="pt-2 text-[11px] text-[#708696] font-mono flex items-center justify-between border-t border-[#DCEBED]">
        <span>5 Key State Sectors Monitored</span>
        <span className="text-[#075B8A] font-bold">Total: {data.reduce((a, b) => a + b.affected, 0).toLocaleString()} Affected</span>
      </div>
    </div>
  );
};
