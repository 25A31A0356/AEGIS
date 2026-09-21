import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { HourlyForecastItem } from '../../types/weather';

interface WeatherForecastChartProps {
  hourlyData: HourlyForecastItem[];
}

export const WeatherForecastChart: React.FC<WeatherForecastChartProps> = ({ hourlyData }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 font-sans">
            24-Hour Convective & Hydro-Meteorological Curve
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Temperature Trend (°C), Precipitation Probability (%), and Surface Wind Velocity (km/h)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-red-600 font-semibold">
            <span className="w-2.5 h-0.5 bg-red-600 rounded-full" />
            <span>Temp (°C)</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-600 font-semibold">
            <span className="w-2.5 h-2.5 bg-sky-400/60 rounded-xs" />
            <span>Rain Prob (%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <span className="w-2.5 h-0.5 bg-slate-600 stroke-dasharray rounded-full" />
            <span>Wind (km/h)</span>
          </div>
        </div>
      </div>

      {/* Recharts Curve */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={hourlyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="temp"
              domain={['dataMin - 3', 'dataMax + 3']}
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="rain"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: '#0284C7', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as HourlyForecastItem;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs font-mono space-y-1.5">
                      <div className="text-sky-300 font-bold border-b border-slate-800 pb-1 flex justify-between">
                        <span>Time: {label} ({data.label})</span>
                        <span className="text-slate-400 uppercase text-[10px]">{data.condition}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span className="text-red-400">Temperature:</span>
                        <span className="font-bold text-white">{data.temp}°C</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span className="text-sky-400">Precip Chance:</span>
                        <span className="font-bold text-white">{data.rainProb}%</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span className="text-slate-400">Wind Speed:</span>
                        <span className="font-bold text-white">{data.windSpeed} km/h</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Precipitation Bar */}
            <Bar
              yAxisId="rain"
              dataKey="rainProb"
              fill="#38BDF8"
              opacity={0.4}
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
            {/* Temperature Line */}
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp"
              stroke="#DC2626"
              strokeWidth={3}
              dot={{ r: 4, fill: '#DC2626', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6 }}
            />
            {/* Wind Line */}
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="windSpeed"
              stroke="#475569"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
