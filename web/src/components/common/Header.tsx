import React, { useState, useEffect } from 'react';
import {
  Bell,
  Globe,
  Menu,
  Search,
  Check,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useProfile } from '../../context/ProfileContext';
import { useTranslation } from '../../i18n/useTranslation';
import { AGIES_TOKENS } from '../../theme/tokens';
import { DataStatusIndicator } from './DataStatusIndicator';

interface HeaderProps {
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenSearch?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  onOpenSearch,
  onToggleMobileSidebar,
}) => {
  const { unreadCount, setIsDrawerOpen } = useNotifications();
  const { profile, colorScheme, setColorScheme } = useProfile();
  const { t, language, setLanguage, availableLanguages } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [greetingKey, setGreetingKey] = useState<'header.greetingMorning' | 'header.greetingAfternoon' | 'header.greetingEvening'>('header.greetingAfternoon');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreetingKey('header.greetingMorning');
    else if (hour < 17) setGreetingKey('header.greetingAfternoon');
    else setGreetingKey('header.greetingEvening');
  }, []);

  const handleNotificationClick = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      setIsDrawerOpen(true);
    }
  };

  const userName = profile?.fullName?.trim() || 'Citizen';
  const greeting = t(greetingKey);

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#07131D]/95 backdrop-blur-sm border-b border-[#DCEBED] dark:border-[#1E3347] px-4 sm:px-6 py-3 shadow-subtle transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Command Center Tag & Time Greeting */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle Button */}
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-[#F4F8FA] dark:bg-[#0E1C2A] border border-[#DCEBED] dark:border-[#1E3347] text-[#075B8A] dark:text-[#18C3D0] hover:bg-[#EEF5F8] dark:hover:bg-[#132335] transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDFAFC] dark:bg-[#0E2235] border border-[#AEEBF0] dark:border-[#1E3A52] text-[#075B8A] dark:text-[#18C3D0] text-[10px] font-mono font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18C3D0] animate-pulse" />
              <span>{t('header.commandCenter', AGIES_TOKENS.commandCenter)}</span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#18364A] dark:text-slate-100 tracking-tight font-sans mt-0.5">
              {greeting}, <span className="text-[#075B8A] dark:text-[#18C3D0]">{userName}</span>
            </h2>
          </div>
        </div>

        {/* Right: Search, Language, Theme Toggle, Data Mode Indicator, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Data Mode Status Indicator (LIVE vs DEMO) */}
          <DataStatusIndicator />

          {/* Quick Search Shortcut */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F8FA] dark:bg-[#0E1C2A] hover:bg-[#EEF5F8] dark:hover:bg-[#132335] border border-[#DCEBED] dark:border-[#1E3347] text-xs text-[#708696] dark:text-slate-400 hover:text-[#18364A] dark:hover:text-slate-100 transition-all"
              title="Search bulletins, states, alerts (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#708696] dark:text-slate-400" />
              <span className="text-[11px] font-medium">{t('header.search', 'Search...')}</span>
              <kbd className="font-mono text-[9px] bg-white dark:bg-[#07131D] text-[#708696] dark:text-slate-400 px-1.5 py-0.5 rounded border border-[#DCEBED] dark:border-[#1E3347]">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Theme Quick Toggle (Sun/Moon) */}
          <button
            onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center p-2 rounded-full bg-[#F4F8FA] dark:bg-[#0E1C2A] hover:bg-[#EEF5F8] dark:hover:bg-[#132335] border border-[#DCEBED] dark:border-[#1E3347] text-[#075B8A] dark:text-[#F4C84A] transition-colors"
            title={colorScheme === 'dark' ? t('header.lightTheme', 'Switch to Light Theme') : t('header.darkTheme', 'Switch to Dark Theme')}
            aria-label="Toggle Theme"
          >
            {colorScheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#075B8A]" />
            )}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#F4F8FA] dark:bg-[#0E1C2A] hover:bg-[#EEF5F8] dark:hover:bg-[#132335] border border-[#DCEBED] dark:border-[#1E3347] text-xs font-semibold text-[#18364A] dark:text-slate-100 transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#075B8A] dark:text-[#18C3D0]" />
              <span className="uppercase text-[11px] font-mono">
                {language}
              </span>
              <ChevronDown className="w-3 h-3 text-[#708696] dark:text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0E1C2A] rounded-2xl shadow-elevated border border-[#DCEBED] dark:border-[#1E3347] py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1 text-[10px] font-mono font-bold text-[#708696] dark:text-slate-400 uppercase border-b border-[#DCEBED] dark:border-[#1E3347] mb-1">
                  Language / भाषा
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-[#F4F8FA] dark:hover:bg-[#132335] transition-colors ${
                        language === lang.code
                          ? 'font-bold text-[#075B8A] dark:text-[#18C3D0] bg-[#EDFAFC] dark:bg-[#0E2235]'
                          : 'text-[#18364A] dark:text-slate-200'
                      }`}
                    >
                      <span>{lang.label} ({lang.native})</span>
                      {language === lang.code && (
                        <Check className="w-3.5 h-3.5 text-[#18C3D0]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={handleNotificationClick}
            className="relative p-2 rounded-full bg-[#F4F8FA] dark:bg-[#0E1C2A] hover:bg-[#EEF5F8] dark:hover:bg-[#132335] border border-[#DCEBED] dark:border-[#1E3347] text-[#18364A] dark:text-slate-100 transition-colors group"
            title="Emergency Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-[#075B8A] dark:text-[#18C3D0] group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E94B68] text-white text-[10px] font-bold font-mono flex items-center justify-center animate-pulse shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Trigger */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full bg-[#F4F8FA] dark:bg-[#0E1C2A] hover:bg-[#EEF5F8] dark:hover:bg-[#132335] border border-[#DCEBED] dark:border-[#1E3347] text-xs font-semibold text-[#18364A] dark:text-slate-100 transition-all group"
            title={t('header.settingsAndSafety', 'User Profile & Preferences')}
          >
            <div className="w-7 h-7 rounded-full bg-[#075B8A] dark:bg-[#18C3D0] text-white dark:text-[#075B8A] flex items-center justify-center text-xs font-bold shadow-xs">
              {userName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-extrabold text-[#18364A] dark:text-slate-100 leading-tight flex items-center gap-1">
                <span>{userName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#45C79A]" />
              </div>
              <div className="text-[9px] text-[#708696] dark:text-slate-400 font-medium leading-none mt-0.5">
                {t('header.settingsAndSafety', 'Settings & Safety')}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
