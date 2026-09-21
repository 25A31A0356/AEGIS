import React from 'react';
import { ActivityFeedItem } from '../../types/activity';
import {
  Radio,
  PhoneCall,
  AlertTriangle,
  Building,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface ActivityItemProps {
  item: ActivityFeedItem;
  onClick?: (item: ActivityFeedItem) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ item, onClick }) => {
  const getCategoryIcon = () => {
    switch (item.category) {
      case 'radar_alert':
        return <Radio className="w-4 h-4 text-sky-600" />;
      case 'sos_dispatch':
        return <PhoneCall className="w-4 h-4 text-red-600" />;
      case 'official_bulletin':
      case 'advisory_escalation':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'shelter_update':
        return <Building className="w-4 h-4 text-indigo-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-700" />;
    }
  };

  const getSeverityBadge = () => {
    switch (item.severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'safe':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'info':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      onClick={() => onClick && onClick(item)}
      className="p-4 rounded-2xl bg-white dark:bg-[#0E1C2A] border border-slate-200 dark:border-[#1E3347] shadow-card hover:border-slate-300 dark:hover:border-[#18C3D0] hover:shadow-elevated transition-all cursor-pointer group flex items-start justify-between gap-3 font-sans"
    >
      <div className="flex items-start gap-3 flex-1">
        {/* Category Icon */}
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#07131D] border border-slate-100 dark:border-[#1E3347] shrink-0 mt-0.5">
          {getCategoryIcon()}
        </div>

        {/* Text Details */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadge()}`}>
              {item.severity}
            </span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              {item.relativeTime}
            </span>
            {item.metricsBadge && (
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-[#07131D] text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-semibold border border-transparent dark:border-[#1E3347]">
                {item.metricsBadge}
              </span>
            )}
          </div>

          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-[#18C3D0] transition-colors leading-snug">
            {item.title}
          </h4>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {item.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <MapPin className="w-3 h-3 text-slate-400" />
              {item.locationTag}
            </span>
            <span>•</span>
            <span>Agency: <strong className="text-slate-700 dark:text-slate-200">{item.sourceAgency}</strong></span>
            {item.isVerified && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                VERIFIED SOURCE
              </span>
            )}
          </div>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-1 shrink-0 mt-2" />
    </div>
  );
};
