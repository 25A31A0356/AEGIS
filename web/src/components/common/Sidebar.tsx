import { AegisLogo } from './AegisLogo';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSOS } from '../../context/SOSContext';
import { useTranslation } from '../../i18n/useTranslation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onClose,
}) => {
  const { user } = useAuth();
  const { beacons } = useSOS();
  const { dict } = useTranslation();

  const activeSOSCount = beacons.filter(
    (b) => b.triageStatus !== 'RESOLVED' && b.triageStatus !== 'CANCELLED'
  ).length;

  const navItems: Array<{ id: string; label: string; icon: string; desc: string; badge?: string }> = [
    { id: 'home', label: dict.home || 'Home', icon: 'home', desc: dict.conditions || 'Weather & Risk Telemetry' },
    { id: 'analysis', label: dict.forecast || 'Analysis', icon: 'monitoring', desc: dict.outlook || 'Trends & Outlook' },
    { id: 'maps', label: dict.liveLocation || 'Maps', icon: 'map', desc: dict.usedWeatherRoutes || 'Weather & SOS Map' },
    { id: 'reports', label: dict.reports || 'Community Reports', icon: 'campaign', desc: dict.reportHazardShort || 'Incident Reporting' },
    { id: 'research-maps', label: dict.readiness || 'Research Maps', icon: 'science', desc: dict.climate || 'Environmental Layers' },
    { id: 'safety', label: dict.safetyHub || 'Safety Hub', icon: 'medical_services', desc: dict.offlineGuidance || '72h Go-Bag & Help' },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-full h-full flex flex-col justify-between p-5 font-sans bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-white border-r border-slate-200 dark:border-[#27272a]">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#27272a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-800 dark:text-slate-200 text-xl">explore</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#a1a1aa]">{dict.menu || 'Navigation'}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#18181b] transition-colors cursor-pointer"
              title={dict.close || 'Close'}
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === 'home' && activeTab === 'dashboard');
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                    : 'text-slate-700 dark:text-[#a1a1aa] hover:bg-slate-100 dark:hover:bg-[#18181b] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <div>
                    <div className="text-xs font-bold leading-tight">{item.label}</div>
                    <div className={`text-[10px] leading-none mt-0.5 ${isActive ? 'opacity-80' : 'text-slate-400 dark:text-[#71717a]'}`}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-600 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200 dark:border-[#27272a] text-xs text-slate-500 dark:text-[#71717a] space-y-1">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span>AEGIS ALERT</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dict.live || 'LIVE'}</span>
        </div>
        <p className="text-[10px]">{dict.appExperience || 'Citizen Intelligence & Multi-Hazard Sentinel'}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
