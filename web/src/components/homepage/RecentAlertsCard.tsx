import React from 'react';
import {
  CloudRain,
  Wind,
  Flame,
  Activity,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { HazardItem } from '../../types/hazard';
import { useTranslation } from '../../i18n/useTranslation';

interface RecentAlertsCardProps {
  hazards: HazardItem[];
  onSelectHazard?: (id: string) => void;
  onViewAll?: () => void;
}

export const RecentAlertsCard: React.FC<RecentAlertsCardProps> = ({
  hazards,
  onSelectHazard,
  onViewAll,
}) => {
  const { t } = useTranslation();

  const getHazardIcon = (category: string) => {
    switch (category) {
      case 'cyclone':
        return <Wind className="w-4 h-4 text-[#075B8A] dark:text-[#38BDF8]" />;
      case 'flood':
      case 'flash_flood':
        return <CloudRain className="w-4 h-4 text-[#075B8A] dark:text-[#38BDF8]" />;
      case 'heatwave':
        return <Flame className="w-4 h-4 text-[#E94B68] dark:text-red-400" />;
      case 'earthquake':
        return <Activity className="w-4 h-4 text-[#075B8A] dark:text-[#38BDF8]" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-[#F4C84A]" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-[#FEF1F3] text-[#E94B68] border-[#FDC8D1] dark:bg-red-950/40 dark:border-red-900 dark:text-red-400';
      case 'warning':
        return 'bg-[#FFFBF0] text-[#B78809] border-[#FDE8A4] dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400';
      default:
        return 'bg-[#EDFAFC] text-[#075B8A] border-[#AEEBF0] dark:bg-[#06243A] dark:border-[#0E4A70] dark:text-[#38BDF8]';
    }
  };

  const displayList = hazards.slice(0, 3);

  return (
    <div className="bg-white dark:bg-[#071828] rounded-[24px] border border-[#DCEBED] dark:border-[#1E3347] p-5 sm:p-6 shadow-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DCEBED] dark:border-[#1E3347]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#075B8A] dark:text-[#38BDF8]">
            {t('home.recent_alerts', 'RECENT ALERTS')}
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EDFAFC] dark:bg-[#06243A] text-[#075B8A] dark:text-[#38BDF8]">
            {hazards.length} {t('alerts.active', 'ACTIVE')}
          </span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-[#075B8A] dark:text-[#38BDF8] hover:text-[#0B6E9E] dark:hover:text-sky-300 flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <span>{t('common.view_all', 'View All')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Alerts Stack */}
      {displayList.length === 0 ? (
        <div className="py-6 px-4 text-center rounded-2xl bg-[#F4F8FA] dark:bg-[#0B1E30] border border-[#DCEBED] dark:border-[#1E3347] space-y-2">
          <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto" />
          <p className="text-xs font-semibold text-[#18364A] dark:text-slate-200">
            {t('alerts.no_active_alerts', 'No active emergency alerts in this area.')}
          </p>
          <p className="text-[11px] text-[#708696] dark:text-slate-400 font-mono">
            {t('alerts.nominal_telemetry', 'All regional parameters within normal thresholds.')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayList.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onSelectHazard && onSelectHazard(alert.id)}
              className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-[#F4F8FA] dark:bg-[#0B1E30] hover:bg-[#EEF5F8] dark:hover:bg-[#132C45] border border-[#DCEBED] dark:border-[#1E3347] hover:border-[#18C3D0] dark:hover:border-[#18C3D0] transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#071828] border border-[#DCEBED] dark:border-[#1E3347] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  {getHazardIcon(alert.category)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#18364A] dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#38BDF8] transition-colors line-clamp-1">
                    {alert.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#708696] dark:text-slate-400 font-medium mt-0.5">
                    <span className="font-semibold text-[#18364A] dark:text-slate-200">
                      {alert.location.city || alert.location.district}, {alert.location.state}
                    </span>
                    <span>•</span>
                    <span>{alert.source.publishedAt || 'Active'}</span>
                  </div>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border shrink-0 ${getSeverityBadge(
                  alert.severity
                )}`}
              >
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
