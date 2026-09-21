import React, { useState } from 'react';
import { StateRiskData } from '../../types/location';
import { Search, ArrowUpDown, ChevronRight, Phone } from 'lucide-react';

interface StateRiskMatrixProps {
  states: StateRiskData[];
  onSelectState: (state: StateRiskData) => void;
}

export const StateRiskMatrix: React.FC<StateRiskMatrixProps> = ({ states, onSelectState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'warning' | 'moderate' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'riskScore' | 'name' | 'activeHazardsCount'>('riskScore');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredStates = states
    .filter((st) => {
      if (riskFilter !== 'all' && st.riskLevel !== riskFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          st.name.toLowerCase().includes(q) ||
          st.id.toLowerCase().includes(q) ||
          st.capital.toLowerCase().includes(q) ||
          st.primaryThreat.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'riskScore') {
        return sortAsc ? a.riskScore - b.riskScore : b.riskScore - a.riskScore;
      }
      if (sortBy === 'activeHazardsCount') {
        return sortAsc ? a.activeHazardsCount - b.activeHazardsCount : b.activeHazardsCount - a.activeHazardsCount;
      }
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

  const toggleSort = (field: 'riskScore' | 'name' | 'activeHazardsCount') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 font-sans">
            National Vulnerability & Risk Matrix
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            All 28 Indian States & 8 Union Territories Ranked by Hazard Exposure
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search state..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 w-36 sm:w-44"
            />
          </div>

          {/* Risk Level Chips */}
          <div className="flex items-center gap-1">
            {(['all', 'critical', 'warning', 'moderate', 'low'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold capitalize transition-colors ${
                  riskFilter === lvl
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-mono text-[11px]">
              <th
                onClick={() => toggleSort('name')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>STATE / REGION</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('riskScore')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>RISK SCORE</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold">RISK LEVEL</th>
              <th className="py-2.5 px-3 font-semibold hidden md:table-cell">PRIMARY THREAT</th>
              <th
                onClick={() => toggleSort('activeHazardsCount')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>ACTIVE HAZARDS</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold hidden lg:table-cell">SDMA HELPLINE</th>
              <th className="py-2.5 px-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStates.map((st) => (
              <tr
                key={st.id}
                onClick={() => onSelectState(st)}
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                {/* State Name */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {st.id}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        {st.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block sm:hidden">
                        Cap: {st.capital}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Risk Score */}
                <td className="py-3 px-3 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          st.riskScore >= 80
                            ? 'bg-red-600'
                            : st.riskScore >= 60
                            ? 'bg-amber-500'
                            : st.riskScore >= 40
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${st.riskScore}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {st.riskScore}
                    </span>
                  </div>
                </td>

                {/* Risk Level Badge */}
                <td className="py-3 px-3">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      st.riskLevel === 'critical'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : st.riskLevel === 'warning'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : st.riskLevel === 'moderate'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {st.riskLevel}
                  </span>
                </td>

                {/* Primary Threat */}
                <td className="py-3 px-3 hidden md:table-cell text-slate-700 font-medium">
                  {st.primaryThreat}
                </td>

                {/* Active Hazards Count */}
                <td className="py-3 px-3 text-center font-mono">
                  {st.activeHazardsCount > 0 ? (
                    <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                      {st.activeHazardsCount}
                    </span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>

                {/* SDMA Helpline */}
                <td className="py-3 px-3 hidden lg:table-cell font-mono text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{st.sdmaHelpline}</span>
                  </div>
                </td>

                {/* Action */}
                <td className="py-3 px-3 text-right">
                  <button className="text-slate-400 group-hover:text-red-600 transition-transform group-hover:translate-x-1">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
