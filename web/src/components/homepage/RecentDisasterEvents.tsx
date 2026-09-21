import React from 'react';
import {
  CloudRain,
  Wind,
  Activity,
  Flame,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { HazardItem } from '../../types/hazard';
import { useTranslation } from '../../i18n/useTranslation';

interface RecentDisasterEventsProps {
  hazards: HazardItem[];
  onSelectHazard?: (hazardId: string) => void;
  onNavigateToAnalytics?: () => void;
}

export const RecentDisasterEvents: React.FC<RecentDisasterEventsProps> = ({
  hazards,
  onSelectHazard,
  onNavigateToAnalytics,
}) => {
  const { t } = useTranslation();

  const getEventIcon = (category: string) => {
    switch (category) {
      case 'flood':
      case 'flash_flood':
        return <CloudRain className="w-5 h-5 text-[#075B8A] dark:text-[#38BDF8]" />;
      case 'cyclone':
        return <Wind className="w-5 h-5 text-[#075B8A] dark:text-[#38BDF8]" />;
      case 'earthquake':
        return <Activity className="w-5 h-5 text-[#075B8A] dark:text-[#38BDF8]" />;
      case 'heatwave':
        return <Flame className="w-5 h-5 text-[#E94B68] dark:text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-[#F4C84A]" />;
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

  // Only display real live hazards from the central database
  const displayEvents = hazards.slice(0, 4).map((h) => ({
    id: h.id,
    title: h.title,
    category: h.category,
    description: h.description || h.headline,
    location: `${h.location.city || h.location.district || 'Regional'}, ${h.location.state}`,
    timestamp: h.source.publishedAt || 'Active',
    severity: h.severity,
    agency: h.source.agency,
  }));

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E94B68] animate-pulse" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#18364A] dark:text-slate-100">
              {t('home.recent_disaster_events', 'RECENT DISASTER EVENTS')}
            </h3>
          </div>
          <p className="text-xs text-[#708696] dark:text-slate-400 mt-0.5">
            {t('home.recent_disaster_events_sub', 'Real-time verified multi-hazard incidents and active civil defense advisories across India.')}
          </p>
        </div>

        {onNavigateToAnalytics && (
          <button
            onClick={onNavigateToAnalytics}
            className="text-xs font-bold text-[#075B8A] dark:text-[#38BDF8] hover:text-[#0B6E9E] dark:hover:text-sky-300 flex items-center gap-1 transition-colors font-mono cursor-pointer"
          >
            <span>{t('nav.analytics', 'Analytics')} Intelligence</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Real Cards Grid or Empty State */}
      {displayEvents.length === 0 ? (
        <div className="bg-white dark:bg-[#071828] rounded-[24px] border border-[#DCEBED] dark:border-[#1E3347] p-8 text-center space-y-2 shadow-card">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-bold text-[#18364A] dark:text-slate-200">
            {t('alerts.no_active_alerts', 'No active disaster events in this area.')}
          </h4>
          <p className="text-xs text-[#708696] dark:text-slate-400 font-mono max-w-md mx-auto">
            {t('alerts.nominal_telemetry', 'All regional parameters within normal thresholds.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onSelectHazard && onSelectHazard(event.id)}
              className="group bg-white dark:bg-[#071828] rounded-[24px] border border-[#DCEBED] dark:border-[#1E3347] hover:border-[#18C3D0] dark:hover:border-[#18C3D0] p-5 shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Category Icon + Title + Severity Pill */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#EDFAFC] dark:bg-[#06243A] border border-[#AEEBF0] dark:border-[#0E4A70] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      {getEventIcon(event.category)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#18364A] dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#38BDF8] transition-colors line-clamp-1 font-sans">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#708696] dark:text-slate-400 font-medium mt-0.5">
                        <MapPin className="w-3 h-3 text-[#E94B68]" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border shrink-0 ${getSeverityBadge(
                      event.severity
                    )}`}
                  >
                    {event.severity}
                  </span>
                </div>

                {/* Card Description */}
                <p className="text-xs text-[#708696] dark:text-slate-400 leading-relaxed my-2 line-clamp-2">
                  {event.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-2 border-t border-[#DCEBED] dark:border-[#1E3347] flex items-center justify-between text-[11px] text-[#708696] dark:text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#708696] dark:text-slate-400" />
                  <span>{event.timestamp}</span>
                </div>
                <div className="flex items-center gap-1 text-[#075B8A] dark:text-[#38BDF8] font-bold group-hover:underline">
                  <span>{event.agency}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
