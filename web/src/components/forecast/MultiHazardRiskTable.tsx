import React from 'react';
import { MultiHazardRiskEntry } from '../../types/weather';
import { Zap, Droplets, Wind, Mountain, Sun, AlertCircle } from 'lucide-react';

interface MultiHazardRiskTableProps {
  risks: MultiHazardRiskEntry[];
}

export const MultiHazardRiskTable: React.FC<MultiHazardRiskTableProps> = ({ risks }) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hydrological':
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case 'meteorological':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'atmospheric':
        return <Wind className="w-4 h-4 text-slate-600" />;
      case 'geological':
        return <Mountain className="w-4 h-4 text-amber-700" />;
      default:
        return <Sun className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 font-sans">
            Multi-Hazard Predictive Confidence Matrix
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Probabilistic ML Risk Modeling (Next 12 - 72 Hours)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-slate-700">Ensemble Confidence Verified</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-mono text-[11px]">
              <th className="py-2.5 px-3 font-semibold">HAZARD THREAT</th>
              <th className="py-2.5 px-3 font-semibold">RISK LEVEL</th>
              <th className="py-2.5 px-3 font-semibold">CONFIDENCE</th>
              <th className="py-2.5 px-3 font-semibold">TIMEFRAME</th>
              <th className="py-2.5 px-3 font-semibold hidden md:table-cell">IMPACTED DISTRICTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {risks.map((entry, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                {/* Hazard Type */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                      {getCategoryIcon(entry.category)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{entry.hazardType}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{entry.category} Category</div>
                    </div>
                  </div>
                </td>

                {/* Risk Level */}
                <td className="py-3 px-3">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      entry.riskLevel === 'critical'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : entry.riskLevel === 'warning' || entry.riskLevel === 'high'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : entry.riskLevel === 'moderate'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {entry.riskLevel}
                  </span>
                </td>

                {/* Confidence Bar */}
                <td className="py-3 px-3 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          entry.confidencePercent >= 85
                            ? 'bg-red-600'
                            : entry.confidencePercent >= 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${entry.confidencePercent}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-800">{entry.confidencePercent}%</span>
                  </div>
                </td>

                {/* Timeframe */}
                <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                  {entry.timeframe}
                </td>

                {/* Impacted Districts */}
                <td className="py-3 px-3 hidden md:table-cell text-slate-600 text-[11px]">
                  {entry.affectedDistricts.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
