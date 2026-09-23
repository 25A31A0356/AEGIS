import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataProviderContext';
import { LocationProvider } from './context/LocationContext';
import { NotificationProvider } from './context/NotificationContext';
import { SOSProvider } from './context/SOSContext';
import { ProfileProvider } from './context/ProfileContext';

import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { UserDrawer } from './components/profile/UserDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { SearchModal } from './components/layout/SearchModal';
import { NotificationDrawer } from './components/layout/NotificationDrawer';

// Main Pages
import { DashboardPage } from './pages/DashboardPage';
import { ForecastsPage } from './pages/ForecastsPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { ReportsPage } from './pages/ReportsPage';
import { ResearchMapsPage } from './pages/ResearchMapsPage';
import { SafetyPage } from './pages/SafetyPage';
import { SOSPage } from './pages/SOSPage';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedHazardId, setSelectedHazardId] = useState<string | undefined>(undefined);
  const [selectedSOSId, setSelectedSOSId] = useState<string | undefined>(undefined);

  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();

  const isHomeTab = activeTab === 'home' || activeTab === 'dashboard';

  const navigateToTab = (tab: string, opt?: { sosId?: string; hazardId?: string }) => {
    setActiveTab(tab);
    if (opt?.sosId) setSelectedSOSId(opt.sosId);
    if (opt?.hazardId) setSelectedHazardId(opt.hazardId);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200 bg-white dark:bg-black text-slate-900 dark:text-white selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onNavigate={navigateToTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenUserDrawer={() => setIsUserDrawerOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 min-w-0">
        {isHomeTab && (
          <DashboardPage
            onNavigate={navigateToTab}
            onSelectHazardById={(id: string) => {
              setSelectedHazardId(id);
              setActiveTab('maps');
            }}
          />
        )}

        {activeTab === 'analysis' && (
          <ForecastsPage />
        )}

        {activeTab === 'maps' && (
          <LiveMapPage />
        )}

        {activeTab === 'reports' && (
          <ReportsPage />
        )}

        {activeTab === 'research-maps' && (
          <ResearchMapsPage />
        )}

        {activeTab === 'safety' && (
          <SafetyPage onNavigateToSOS={() => navigateToTab('sos')} />
        )}

        {activeTab === 'sos' && (
          <SOSPage preSelectedSOSId={selectedSOSId} />
        )}
      </main>

      {/* Three-Lines Slide-Out Navigation Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-80 max-w-[85vw] h-full shadow-2xl border-r border-slate-200 dark:border-[#27272a] animate-in slide-in-from-left duration-300">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={navigateToTab}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
          <div className="flex-1" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}


      {/* Sliding User & Session Logs Drawer (Right Side) */}
      <UserDrawer
        isOpen={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Authentication & Role Clearance Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Global Search Dialog */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigateToTab}
        onSelectHazard={(id: string) => {
          setSelectedHazardId(id);
          setActiveTab('maps');
        }}
        onSelectSOS={(id: string) => {
          setSelectedSOSId(id);
          setActiveTab('sos');
        }}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        onNavigate={navigateToTab}
        onSelectHazard={(id: string) => {
          setSelectedHazardId(id);
          setActiveTab('maps');
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <LocationProvider>
          <NotificationProvider>
            <SOSProvider>
              <ProfileProvider>
                <AppContent />
              </ProfileProvider>
            </SOSProvider>
          </NotificationProvider>
        </LocationProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
