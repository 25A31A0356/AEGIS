import React, { useState } from 'react';
import { ActivityFeedItem, ActivityScope } from '../../types/activity';
import { ActivityItem } from './ActivityItem';
import { Search, Radio } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  onSelectActivity?: (item: ActivityFeedItem) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onSelectActivity }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<ActivityScope | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filtered = activities.filter((item) => {
    if (scopeFilter !== 'all' && item.scope !== scopeFilter) return false;
    if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.locationTag.toLowerCase().includes(q) ||
        item.sourceAgency.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Feed Controls Header */}
      <div className="bg-white dark:bg-[#0E1C2A] rounded-2xl border border-slate-200 dark:border-[#1E3347] p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('header.search', 'Search activity stream by agency, location, or keyword...')}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#07131D] border border-slate-200 dark:border-[#1E3347] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope */}
          <div className="flex items-center bg-slate-100 dark:bg-[#07131D] p-1 rounded-lg text-xs">
            {(['all', 'india', 'global'] as const).map((sc) => (
              <button
                key={sc}
                onClick={() => setScopeFilter(sc)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors ${
                  scopeFilter === sc ? 'bg-white dark:bg-[#0E1C2A] text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>

          {/* Severity */}
          <div className="flex items-center gap-1 font-mono text-[10px]">
            {(['all', 'critical', 'warning'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-1 rounded font-bold capitalize transition-colors ${
                  severityFilter === sev
                    ? 'bg-slate-900 dark:bg-[#18C3D0] text-white dark:text-[#075B8A]'
                    : 'bg-slate-100 dark:bg-[#07131D] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#132335]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#0E1C2A] rounded-2xl border border-slate-200 dark:border-[#1E3347] p-12 text-center shadow-card transition-colors">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#07131D] text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Radio className="w-6 h-6 text-[#075B8A] dark:text-[#18C3D0]" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-sans">
              {t('activity.noActivity', 'No recent activities recorded for this location yet.')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {t('activity.subtitle', 'Live telemetry from NDRF dispatch, Doppler radar, citizen reports, and IMD bulletins.')}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <ActivityItem
              key={item.id}
              item={item}
              onClick={onSelectActivity}
            />
          ))
        )}
      </div>
    </div>
  );
};
