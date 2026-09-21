import React from 'react';
import { Wind, Droplets, Mountain, PhoneCall, Building, ShieldCheck, ChevronRight } from 'lucide-react';

interface QuickActionGridProps {
  onNavigate: (tab: string) => void;
  onFilterHazards?: (category: string) => void;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onNavigate,
  onFilterHazards,
}) => {
  const actions = [
    {
      title: 'Cyclone Tracking Hub',
      desc: 'Bay of Bengal & Arabian Sea tracks, storm surge models, gale wind alerts.',
      icon: Wind,
      color: 'bg-red-50 text-red-600 border-red-200',
      action: () => {
        if (onFilterHazards) onFilterHazards('cyclone');
        onNavigate('hazards');
      },
    },
    {
      title: 'River Basin Floods',
      desc: 'CWC river stage gauges, embankment breach warnings, inundation alerts.',
      icon: Droplets,
      color: 'bg-sky-50 text-sky-600 border-sky-200',
      action: () => {
        if (onFilterHazards) onFilterHazards('flood');
        onNavigate('hazards');
      },
    },
    {
      title: 'Western Ghats & Himalayas',
      desc: 'GSI slope stability indices, debris flow watches, mountain road closures.',
      icon: Mountain,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      action: () => {
        if (onFilterHazards) onFilterHazards('landslide');
        onNavigate('hazards');
      },
    },
    {
      title: 'Citizen SOS Dispatch',
      desc: 'Live emergency beacons received from AEGIS mobile app users.',
      icon: PhoneCall,
      color: 'bg-red-100 text-red-700 border-red-300',
      action: () => onNavigate('sos'),
    },
    {
      title: 'Evacuation Shelters',
      desc: 'Interactive database of pucca cyclone shelters and flood relief depots.',
      icon: Building,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      action: () => onNavigate('live-map'),
    },
    {
      title: 'NDRF Safety Protocols',
      desc: 'Official actionable guidelines for cyclones, flash floods, and gas leaks.',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: () => onNavigate('hazards'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-sans">
      {actions.map((act, idx) => {
        const Icon = act.icon;
        return (
          <div
            key={idx}
            onClick={act.action}
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card hover:border-slate-300 hover:shadow-elevated transition-all cursor-pointer group flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl border ${act.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-red-600 transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {act.desc}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-1 shrink-0 mt-1" />
          </div>
        );
      })}
    </div>
  );
};
