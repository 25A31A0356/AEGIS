import { AegisLogo } from '../common/AegisLogo';
import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Bell,
  Radio,
  Activity,
  AlertTriangle,
  CloudRain,
  Compass,
  PhoneCall,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSOS } from '../../context/SOSContext';
import { useProfile } from '../../context/ProfileContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onSelectHazard?: (hazardId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenProfile,
}) => {
  const { weather } = useLocation();
  const { unreadCount, setIsDrawerOpen } = useNotifications();
  const { beacons } = useSOS();
  const { profile } = useProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeSOSCount = beacons.filter((b) => b.triageStatus !== 'resolved' && b.triageStatus !== 'cancelled').length;

  const navItems: Array<{ id: string; label: string; icon: any; badge?: string; badgeColor?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'live-map', label: 'Live Map', icon: Radio, badge: 'GIS' },
    { id: 'forecasts', label: 'Analysis', icon: CloudRain },
    { id: 'hazards', label: 'Hazards & Intel', icon: AlertTriangle, badge: '08' },
    { id: 'activity', label: 'Activity Stream', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-subtle">
      {/* Primary Brand & Actions Bar */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Tagline */}
          <div className="flex items-center gap-3 shrink-0">
            <div onClick={() => setActiveTab('dashboard')} className="cursor-pointer">
              <AegisLogo size="md" showSubtitle={true} />
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        item.badgeColor
                          ? item.badgeColor
                          : isActive
                          ? 'bg-slate-800 text-sky-300'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Location Pill, Search, Notifications, Profile Button */}
          <div className="flex items-center gap-2.5">
            {/* Auto-detected Live GPS / Chosen Location Pill (Clickable) */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#18181b] dark:hover:bg-[#27272a] border border-slate-200 dark:border-[#27272a] text-xs font-medium text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Click to change or search your exact village or city"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
              <div className="text-left hidden md:block">
                <div className="font-bold text-[11px] leading-tight text-slate-900 dark:text-white flex items-center gap-1">
                  <span>{weather.cityName || 'Live Sector'}</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">✏️</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#a1a1aa] font-mono leading-none mt-0.5">
                  {weather.temp}°C • Live Telemetry
                </div>
              </div>
            </button>

            {/* Global Search Shortcut Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              title="Search Hazards, Cities, SOS (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline text-[11px]">Search...</span>
              <kbd className="hidden lg:inline font-mono text-[10px] bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shadow-xs">
                ⌘K
              </kbd>
            </button>

            {/* Notification Drawer Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
              title="Emergency Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold font-mono flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Citizen Profile Button (Circled Profile / Image) */}
            <button
              onClick={onOpenProfile}
              className="relative p-0.5 rounded-full hover:ring-2 hover:ring-[#075B8A]/30 dark:hover:ring-teal-400/40 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
              title="Open Profile & Settings"
              aria-label="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#075B8A] dark:bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-xs overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.fullName?.trim() ? profile.fullName.trim()[0].toUpperCase() : 'A'
                )}
              </div>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenProfile();
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 text-sky-400" />
              <span>My Citizen Safety Account</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
