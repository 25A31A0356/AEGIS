import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Radio, PhoneCall, MapPin, Building2 } from 'lucide-react';
import { HazardService } from '../../services/hazardService';
import { DEMO_STATES } from '../../data/demoStates';
import { useSOS } from '../../context/SOSContext';
import { useTranslation } from '../../i18n/useTranslation';

interface MetricsBarProps {
  onNavigate?: (tab: string) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ onNavigate }) => {
  const { beacons } = useSOS();
  const { t } = useTranslation();
  const [metricsSummary, setMetricsSummary] = useState(() => HazardService.getMetricsSummary());

  useEffect(() => {
    HazardService.fetchLiveHazards().then(() => {
      setMetricsSummary(HazardService.getMetricsSummary());
    }).catch(console.error);

    const unsubscribe = HazardService.subscribe(() => {
      setMetricsSummary(HazardService.getMetricsSummary());
    });
    return unsubscribe;
  }, []);

  const criticalHazards = metricsSummary.criticalHazards;
  const warningHazards = metricsSummary.warningHazards;
  const totalHazards = metricsSummary.totalHazards;
  const criticalStates = DEMO_STATES.filter((s) => s.riskLevel === 'critical' || s.riskLevel === 'warning').length;
  const activeSOS = beacons.filter((b) => b.triageStatus !== 'RESOLVED' && b.triageStatus !== 'resolved' && b.triageStatus !== 'CANCELLED' && b.triageStatus !== 'cancelled').length;

  const metrics = [
    {
      label: t('nav.hazards', 'Active Multi-Hazards'),
      value: `${String(totalHazards).padStart(2, '0')}`,
      subtext: `${criticalHazards} Critical • ${warningHazards} Warnings`,
      icon: AlertTriangle,
      color: 'text-slate-900 dark:text-slate-100',
      badge: 'MONITORED',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      tab: 'hazards',
    },
    {
      label: 'Critical Red Alerts',
      value: `${String(criticalHazards).padStart(2, '0')}`,
      subtext: criticalHazards > 0 ? `${criticalHazards} Red Alert Zones Active` : 'No Critical Red Alerts',
      icon: ShieldAlert,
      color: 'text-red-600 dark:text-red-400',
      badge: 'IMMEDIATE ACTION',
      badgeColor: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold',
      tab: 'hazards',
    },
    {
      label: t('nav.sos', 'Active Citizen SOS Beacons'),
      value: `${String(activeSOS).padStart(2, '0')}`,
      subtext: activeSOS > 0 ? `${activeSOS} Live Distress Beacons` : '0 Active Distresses (All Safe)',
      icon: PhoneCall,
      color: activeSOS > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
      badge: activeSOS > 0 ? 'DISPATCH LIVE' : 'SECTOR CLEAR',
      badgeColor: activeSOS > 0 ? 'bg-red-600 text-white font-bold' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold',
      tab: 'sos',
    },
    {
      label: 'National Forecast Index',
      value: 'MODERATE',
      subtext: 'Atmospheric Telemetry Active',
      icon: Radio,
      color: 'text-amber-600 dark:text-amber-400',
      badge: 'IMD MODEL',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
      tab: 'forecasts',
    },
    {
      label: 'Elevated Risk States',
      value: `${String(criticalStates).padStart(2, '0')}`,
      subtext: `${criticalStates} Monitored States`,
      icon: MapPin,
      color: 'text-slate-900 dark:text-slate-100',
      badge: '28 STATES / 8 UT',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      tab: 'live-map',
    },
    {
      label: 'Designated Safe Shelters',
      value: '100%',
      subtext: 'Relief Camps & Bases Active',
      icon: Building2,
      color: 'text-emerald-600 dark:text-emerald-400',
      badge: 'OPERATIONAL',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
      tab: 'live-map',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-sans">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div
            key={idx}
            onClick={() => onNavigate && onNavigate(m.tab)}
            className="bg-white dark:bg-[#071828] rounded-xl border border-slate-200 dark:border-[#1E3347] p-3.5 shadow-card hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-elevated transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${m.badgeColor}`}>
                {m.badge}
              </span>
              <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
            </div>
            <div className={`text-2xl font-extrabold font-mono tracking-tight ${m.color}`}>
              {m.value}
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-1">
              {m.label}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 line-clamp-1">
              {m.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
