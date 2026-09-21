import React from 'react';
import { Search } from 'lucide-react';
import { HazardFilterOptions } from '../../services/hazardService';

interface HazardFilterBarProps {
  filters: HazardFilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<HazardFilterOptions>>;
  totalCount?: number;
}

export const HazardFilterBar: React.FC<HazardFilterBarProps> = ({
  filters,
  setFilters,
  totalCount: _totalCount,
}) => {
  const categories = [
    { id: 'all', label: 'All Hazards' },
    { id: 'cyclone', label: 'Cyclones' },
    { id: 'flood', label: 'Floods' },
    { id: 'thunderstorm', label: 'Thunderstorms' },
    { id: 'landslide', label: 'Landslides' },
    { id: 'chemical_spill', label: 'Industrial / Chemical' },
    { id: 'building_collapse', label: 'Structural' },
  ];

  const natures = [
    { id: 'all', label: 'All Signals' },
    { id: 'forecast', label: 'Forecasts (Modeled)' },
    { id: 'warning', label: 'Warnings (Advisory)' },
    { id: 'incident', label: 'Incidents (Active Ground)' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card font-sans space-y-3">
      {/* Top Search and Signal Nature Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Filter hazards by keyword, district, state, or issuing agency..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Signal Nature Selector */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {natures.map((n) => (
            <button
              key={n.id}
              onClick={() => setFilters((prev) => ({ ...prev, nature: n.id as any }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                (filters.nature || 'all') === n.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters((prev) => ({ ...prev, category: cat.id as any }))}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                (filters.category || 'all') === cat.id
                  ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span className="text-slate-400 font-semibold mr-1">Severity:</span>
          {(['all', 'critical', 'warning'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilters((prev) => ({ ...prev, severity: sev }))}
              className={`px-2 py-0.5 rounded capitalize font-bold ${
                (filters.severity || 'all') === sev
                  ? sev === 'critical'
                    ? 'bg-red-600 text-white'
                    : sev === 'warning'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
