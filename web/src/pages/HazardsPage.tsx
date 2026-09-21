import React, { useState, useEffect } from 'react';
import { HazardFilterBar } from '../components/hazards/HazardFilterBar';
import { HazardCard } from '../components/hazards/HazardCard';
import { HazardDetailModal } from '../components/hazards/HazardDetailModal';
import { HazardService, HazardFilterOptions } from '../services/hazardService';
import { HazardItem } from '../types/hazard';
import { AlertTriangle } from 'lucide-react';

interface HazardsPageProps {
  onNavigate: (tab: string) => void;
  preSelectedHazardId?: string | null;
  initialCategory?: string;
}

export const HazardsPage: React.FC<HazardsPageProps> = ({
  onNavigate,
  preSelectedHazardId,
  initialCategory,
}) => {
  const [filters, setFilters] = useState<HazardFilterOptions>({
    category: (initialCategory as any) || 'all',
    severity: 'all',
    nature: 'all',
    status: 'all',
    searchQuery: '',
  });

  const [activeModalHazard, setActiveModalHazard] = useState<HazardItem | null>(null);

  useEffect(() => {
    if (preSelectedHazardId) {
      const hz = HazardService.getHazardById(preSelectedHazardId);
      if (hz) setActiveModalHazard(hz);
    }
  }, [preSelectedHazardId]);

  useEffect(() => {
    if (initialCategory) {
      setFilters((prev) => ({ ...prev, category: initialCategory as any }));
    }
  }, [initialCategory]);

  const [hazardsList, setHazardsList] = useState<HazardItem[]>(() => HazardService.filterHazards(filters));
  const [metrics, setMetrics] = useState(() => HazardService.getMetricsSummary());

  useEffect(() => {
    HazardService.fetchLiveHazards().then(() => {
      setHazardsList(HazardService.filterHazards(filters));
      setMetrics(HazardService.getMetricsSummary());
    }).catch(console.error);

    const unsubscribe = HazardService.subscribe(() => {
      setHazardsList(HazardService.filterHazards(filters));
      setMetrics(HazardService.getMetricsSummary());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setHazardsList(HazardService.filterHazards(filters));
  }, [filters]);

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <h1 className="font-extrabold text-base text-slate-900 font-mono uppercase tracking-wider">
              Multi-Hazard Intelligence & Incident Command Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Verified Natural Hazards & Human/Structural Disaster Advisories Across India
          </p>
        </div>

        {/* Quick Tally Chips */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg font-bold">
            {metrics.criticalHazards} Critical
          </span>
          <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold">
            {metrics.warningHazards} Warnings
          </span>
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
            {metrics.totalHazards} Monitored
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <HazardFilterBar
        filters={filters}
        setFilters={setFilters}
        totalCount={hazardsList.length}
      />

      {/* Hazards Cards Grid */}
      {hazardsList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-card">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No hazards matching your selected filters. Try clearing search filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hazardsList.map((hazard) => (
            <HazardCard
              key={hazard.id}
              hazard={hazard}
              onClick={(h) => setActiveModalHazard(h)}
            />
          ))}
        </div>
      )}

      {/* Hazard Deep Dive Modal */}
      <HazardDetailModal
        hazard={activeModalHazard}
        onClose={() => setActiveModalHazard(null)}
        onViewOnMap={() => onNavigate('live-map')}
      />
    </div>
  );
};
