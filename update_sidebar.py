import os

sidebar_content = "import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSOS } from '../../context/SOSContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  isAutoHidden?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  isAutoHidden = false,
}) => {
  const { user } = useAuth();
  const { beacons } = useSOS();

  const activeSOSCount = beacons.filter(
    (b) => b.triageStatus !== 'RESOLVED' && b.triageStatus !== 'CANCELLED'
  ).length;

  const navItems = [
    { id: 'home', label: 'Home', icon: 'home', desc: 'Weather & Telemetry' },
    { id: 'analysis', label: 'Analysis', icon: 'monitoring', desc: 'Trends & Outlook' },
    { id: 'maps', label: 'Maps', icon: 'map', desc: 'Weather & SOS Map' },
    { id: 'reports', label: 'Community Reports', icon: 'campaign', desc: 'Incident Reporting' },
    { id: 'research-maps', label: 'Research Maps', icon: 'science', desc: 'Environmental Layers' },
    { id: 'safety', label: 'Safety Hub', icon: 'medical_services', desc: '72h Go-Bag & Help' },
    { id: 'sos', label: 'SOS Command', icon: 'emergency', desc: 'Emergency Triage', badge: activeSOSCount > 0 ? ${activeSOSCount} : undefined },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  return (
    <aside
      className={w-full h-full glass-card border-r border-white/10 flex flex-col justify-between p-4 font-sans transition-all duration-300 }
      style={{
        background: 'rgba(10, 16, 32, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className=space-y-4>
        {/* Brand in drawer */}
        <div className=flex items-center justify-between pb-3 border-b border-white/10>
          <div className=flex items-center gap-2.5>
            <div className=w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-sky-500/20>
              <span className=material-symbols-outlined text-xl>shield</span>
            </div>
            <div>
              <span className=text-sm font-black tracking-wide text-white>AEGIS ALERT</span>
              <p className=text-[10px] text-sky-400/80 font-mono>Disaster Intelligence</p>
            </div>
          </div>
          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className=p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer
            >
              <span className=material-symbols-outlined text-xl>close</span>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className=space-y-1.5>
          {navItems.map((item) => {
            const isActive = activeTab === item.id || (activeTab === 'dashboard' && item.id === 'home');
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer }
              >
                <div className=flex items-center gap-3>
                  <span
                    className={material-symbols-outlined text-xl transition-transform duration-200 group-hover:scale-110 }
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className={leading-tight }>{item.label}</p>
                    <p className=text-[10px] text-slate-500 font-normal leading-tight>{item.desc}</p>
                  </div>
                </div>
                {item.badge && (
                  <span className=px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className=pt-3 border-t border-white/10 space-y-1 text-[11px] text-slate-400>
        <div className=flex items-center gap-2>
          <span className=w-2 h-2 rounded-full bg-emerald-400 animate-ping />
          <p className=font-semibold text-slate-300>AEGIS Live Mesh</p>
        </div>
        <p className=text-[10px] text-slate-500>IMD &bull; NDRF &bull; CWC Satellite Feeds</p>
      </div>
    </aside>
  );
};

export default Sidebar;
"

with open('web/src/components/common/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(sidebar_content)
print(Sidebar.tsx written)
