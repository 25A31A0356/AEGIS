import React, { useState, useEffect } from 'react';
import { DataProvider } from './context/DataProviderContext';
import { LocationProvider } from './context/LocationContext';
import { NotificationProvider } from './context/NotificationContext';
import { SOSProvider } from './context/SOSContext';
import { ProfileProvider } from './context/ProfileContext';

// Global Layout Shell & Common Components
import {
  Sidebar,
  Header,
  AlertTicker,
  FloatingAskAGIES,
  DataModeModal,
} from './components/common';

// Existing Overlays & Modals
import { SearchModal } from './components/layout/SearchModal';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { UserProfileModal } from './components/profile/UserProfileModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { ForecastsPage } from './pages/ForecastsPage';
import { SafetyPage } from './pages/SafetyPage';
import { ReportsPage } from './pages/ReportsPage';
import { HazardsPage } from './pages/HazardsPage';
import { SOSPage } from './pages/SOSPage';
import { ActivityPage } from './pages/ActivityPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('homepage');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const [selectedSOSId, setSelectedSOSId] = useState<string | null>(null);
  const [initialHazardCategory, setInitialHazardCategory] = useState<string | undefined>(undefined);

  // Sync initial URL path and query parameters for deep-linking
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);

      const querySosId = searchParams.get('sosId') || searchParams.get('sos');
      const queryHazardId = searchParams.get('hazardId') || searchParams.get('alertId');
      const queryCategory = searchParams.get('category');

      if (queryHazardId) {
        setSelectedHazardId(queryHazardId);
      }
      if (queryCategory) {
        setInitialHazardCategory(queryCategory);
      }

      // Check /sos/<id> pattern
      const sosMatch = window.location.pathname.match(/^\/sos\/([^/]+)/i);
      if (sosMatch && sosMatch[1]) {
        setSelectedSOSId(decodeURIComponent(sosMatch[1]));
        setActiveTab('sos');
        return;
      }

      if (querySosId) {
        setSelectedSOSId(querySosId);
        setActiveTab('sos');
        return;
      }

      if (path === '/sos' || path === '/sos/') {
        setActiveTab('sos');
      } else if (path === '/live-map' || path === '/map') {
        setActiveTab('live-map');
      } else if (path === '/safety' || path === '/safe-plan') {
        setActiveTab('safety');
      } else if (path === '/reports' || path === '/community') {
        setActiveTab('reports');
      } else if (path === '/activity' || path === '/feed') {
        setActiveTab('activity');
      } else if (path === '/hazards' || path === '/alerts') {
        setActiveTab('hazards');
      } else if (path === '/forecasts' || path === '/analytics') {
        setActiveTab('forecasts');
      } else if (path === '/dashboard' || path === '/homepage' || path === '/') {
        setActiveTab('homepage');
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  // Update browser URL state on tab navigation without triggering full page reload
  const navigateToTab = (tab: string, opt?: { sosId?: string; hazardId?: string }) => {
    setActiveTab(tab);
    let targetPath = '/';
    if (tab === 'sos') {
      targetPath = opt?.sosId ? `/sos/${opt.sosId}` : '/sos';
      if (opt?.sosId) setSelectedSOSId(opt.sosId);
    } else if (tab === 'live-map') {
      targetPath = '/live-map';
    } else if (tab === 'safety') {
      targetPath = '/safety';
    } else if (tab === 'reports') {
      targetPath = '/reports';
    } else if (tab === 'activity') {
      targetPath = '/activity';
    } else if (tab === 'hazards') {
      targetPath = opt?.hazardId ? `/hazards?hazardId=${opt.hazardId}` : '/hazards';
      if (opt?.hazardId) setSelectedHazardId(opt.hazardId);
    } else if (tab === 'forecasts' || tab === 'analytics') {
      targetPath = '/forecasts';
    } else if (tab === 'dashboard' || tab === 'homepage') {
      targetPath = '/';
    }

    if (window.location.pathname !== targetPath && typeof window.history.pushState === 'function') {
      window.history.pushState({ tab, ...opt }, '', targetPath);
    }
  };

  // Keyboard shortcut for Search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectHazardFromTickerOrSearch = (hazardId: string) => {
    setSelectedHazardId(hazardId);
    navigateToTab('hazards', { hazardId });
  };

  const handleSelectSOSFromSearch = (sosId: string) => {
    setSelectedSOSId(sosId);
    navigateToTab('sos', { sosId });
  };

  const handleFilterHazardsCategory = (category: string) => {
    setInitialHazardCategory(category);
    navigateToTab('hazards');
  };

  return (
    <DataProvider>
      <LocationProvider>
        <NotificationProvider>
          <SOSProvider>
            <ProfileProvider>
              <div className="min-h-screen flex bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-100 antialiased font-sans selection:bg-[#18C3D0]/30 selection:text-[#075B8A] transition-colors">
                {/* DESKTOP / TABLET FIXED SIDEBAR */}
                <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
                  <Sidebar
                    activeTab={activeTab}
                    setActiveTab={navigateToTab}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  />
                </div>

                {/* MOBILE SLIDE-OUT DRAWER SIDEBAR */}
                {isMobileSidebarOpen && (
                  <div className="fixed inset-0 z-50 lg:hidden flex">
                    {/* Backdrop */}
                    <div
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="fixed inset-0 bg-[#075B8A]/50 backdrop-blur-xs transition-opacity"
                    />
                    {/* Sidebar Drawer */}
                    <div className="relative z-10 w-[240px] h-full shadow-2xl animate-in slide-in-from-left duration-200">
                      <Sidebar
                        activeTab={activeTab}
                        setActiveTab={navigateToTab}
                        isMobileDrawer={true}
                        onCloseMobileDrawer={() => setIsMobileSidebarOpen(false)}
                      />
                    </div>
                  </div>
                )}

                {/* MAIN CONTENT COLUMN */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Top Header */}
                  <Header
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onOpenProfile={() => setIsProfileOpen(true)}
                    onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
                  />

                  {/* Below Header: Live Alerts Marquee Ticker */}
                  <AlertTicker onSelectHazard={handleSelectHazardFromTickerOrSearch} />

                  {/* Main Content Viewport */}
                  <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {(activeTab === 'homepage' || activeTab === 'dashboard') && (
                      <DashboardPage
                        onNavigate={navigateToTab}
                        onSelectHazardById={handleSelectHazardFromTickerOrSearch}
                        onFilterHazardsCategory={handleFilterHazardsCategory}
                      />
                    )}

                    {(activeTab === 'analytics' || activeTab === 'forecasts') && (
                      <ForecastsPage />
                    )}

                    {activeTab === 'safety' && (
                      <SafetyPage onNavigateToSOS={() => navigateToTab('sos')} />
                    )}

                    {activeTab === 'reports' && (
                      <ReportsPage />
                    )}

                    {activeTab === 'sos' && (
                      <SOSPage preSelectedSOSId={selectedSOSId} />
                    )}

                    {activeTab === 'hazards' && (
                      <HazardsPage
                        onNavigate={navigateToTab}
                        preSelectedHazardId={selectedHazardId}
                        initialCategory={initialHazardCategory}
                      />
                    )}

                    {activeTab === 'activity' && (
                      <ActivityPage
                        onNavigate={navigateToTab}
                        onSelectHazardById={handleSelectHazardFromTickerOrSearch}
                      />
                    )}

                    {activeTab === 'live-map' && (
                      <LiveMapPage
                        onNavigate={navigateToTab}
                        onSelectHazardById={handleSelectHazardFromTickerOrSearch}
                      />
                    )}
                  </main>
                </div>

                {/* GLOBALLY PERSISTENT FLOATING ASK AGIES CHATBOT (Bottom Right Corner) */}
                <FloatingAskAGIES
                  activeTab={activeTab}
                  selectedHazard={selectedHazardId}
                  onNavigate={navigateToTab}
                />

                {/* Global Search Dialog (Ctrl+K) */}
                <SearchModal
                  isOpen={isSearchOpen}
                  onClose={() => setIsSearchOpen(false)}
                  onNavigate={navigateToTab}
                  onSelectHazard={handleSelectHazardFromTickerOrSearch}
                  onSelectSOS={handleSelectSOSFromSearch}
                />

                {/* Emergency Notification Drawer */}
                <NotificationDrawer
                  onNavigate={navigateToTab}
                  onSelectHazard={handleSelectHazardFromTickerOrSearch}
                />

                {/* Citizen Safety Profile Modal */}
                <UserProfileModal
                  isOpen={isProfileOpen}
                  onClose={() => setIsProfileOpen(false)}
                />

                {/* Data Provider Inspector & Mode Switcher Modal */}
                <DataModeModal />
              </div>
            </ProfileProvider>
          </SOSProvider>
        </NotificationProvider>
      </LocationProvider>
    </DataProvider>
  );
};
