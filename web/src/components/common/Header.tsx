import React from 'react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useTranslation } from '../../i18n/useTranslation';
import { AegisLogo } from './AegisLogo';

interface HeaderProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
  onToggleSidebar: () => void;
  onOpenUserDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  onOpenAuth,
  onOpenSearch,
  onToggleSidebar,
  onOpenUserDrawer,
}) => {
  const { selectedLocation, isGpsActive } = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { dict } = useTranslation();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-[#27272a] px-4 sm:px-6 py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Three Lines Hamburger Menu & Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Three Lines Navigation Trigger Button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200 dark:hover:bg-[#27272a] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <div onClick={() => onNavigate('home')} className="cursor-pointer">
            <AegisLogo size="md" showSubtitle={true} />
          </div>
        </div>

        {/* Right: Live GPS Location Badge, Search, & Profile Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Auto-detected Live GPS Location Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] text-slate-800 dark:text-slate-200 text-xs font-medium shadow-xs select-none"
            title="Auto-detected live GPS location and telemetry"
          >
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm animate-pulse">my_location</span>
            <span className="font-bold text-slate-900 dark:text-white max-w-[140px] truncate">
              {selectedLocation?.name || 'Live Location'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-[#a1a1aa] hidden lg:inline">
              ({selectedLocation?.stateName || (isGpsActive ? 'Live GPS' : 'Auto-Detected')})
            </span>
          </div>

          {/* Search Trigger */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200 dark:hover:bg-[#27272a] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Search districts or hazards"
            >
              <span className="material-symbols-outlined text-lg">search</span>
            </button>
          )}

          {/* Profile Option Button */}
          <button
            onClick={onOpenUserDrawer}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200 dark:hover:bg-[#27272a] text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95 group"
            title="Open Citizen Profile & Preferences"
            aria-label="Citizen Profile"
          >
            <div className="w-6 h-6 rounded-full bg-[#0d5c75] dark:bg-teal-600 text-white flex items-center justify-center text-[11px] font-black shadow-xs overflow-hidden shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile.fullName?.trim() ? profile.fullName.trim()[0].toUpperCase() : (user?.name ? user.name[0].toUpperCase() : 'A')
              )}
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white hidden md:inline max-w-[110px] truncate">
              {profile.fullName || user?.name || 'Aarav Sharma'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
