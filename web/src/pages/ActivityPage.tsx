import React, { useState, useEffect } from 'react';
import { ActivityFeed } from '../components/activity/ActivityFeed';
import { ActivityFeedItem } from '../types/activity';
import { ActivityService } from '../services/activityService';
import { RealtimeService, RealtimeConnectionStatus } from '../services/realtimeService';
import { Radio, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface ActivityPageProps {
  onNavigate: (tab: string) => void;
  onSelectHazardById?: (id: string) => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({
  onNavigate,
  onSelectHazardById,
}) => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>(RealtimeService.getStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to activities stream
    const unsubActivities = ActivityService.subscribe((list) => {
      setActivities(list);
    });

    // Subscribe to realtime status
    const unsubStatus = RealtimeService.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubActivities();
      unsubStatus();
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await ActivityService.getActivities(50, true);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleSelectActivity = (item: ActivityFeedItem) => {
    if (item.category === 'sos_dispatch') {
      onNavigate('sos');
    } else if (item.category === 'radar_alert') {
      onNavigate('forecasts');
    } else if (item.category === 'shelter_update' || item.category === 'incident_detected') {
      onNavigate('live-map');
    } else {
      if (item.id && onSelectHazardById) {
        onSelectHazardById(item.id);
      }
      onNavigate('hazards');
    }
  };

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0E1C2A] p-5 rounded-2xl border border-slate-200 dark:border-[#1E3347] shadow-card transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'LIVE'
                  ? 'bg-emerald-500 animate-pulse'
                  : connectionStatus === 'RECONNECTING'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <h1 className="font-extrabold text-base text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
              {t('activity.title', 'Real-Time Emergency Intelligence & Telemetry Feed')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {t('activity.subtitle', 'Continuous Multi-Source Audit Stream: IMD • CWC • INCOIS • NDMA • Citizen Intelligence Network')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Realtime Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold uppercase transition-colors ${
              connectionStatus === 'LIVE'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                : connectionStatus === 'RECONNECTING'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
            }`}
          >
            {connectionStatus === 'LIVE' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span>LIVE STREAM ACTIVE</span>
              </>
            ) : connectionStatus === 'RECONNECTING' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                <span>RECONNECTING...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>OFFLINE CACHE</span>
              </>
            )}
          </div>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#07131D] hover:bg-slate-200 dark:hover:bg-[#132335] text-slate-700 dark:text-slate-300 border border-transparent dark:border-[#1E3347] text-xs font-mono font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh feed immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Activity Feed Container */}
      <ActivityFeed
        activities={activities}
        onSelectActivity={handleSelectActivity}
      />
    </div>
  );
};
