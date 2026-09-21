import React, { useState, useEffect } from 'react';
import { HomepageHeader } from '../components/homepage/HomepageHeader';
import { MainWeatherHeroCard } from '../components/homepage/MainWeatherHeroCard';
import { CurrentRiskScoreCard } from '../components/homepage/CurrentRiskScoreCard';
import { RecentAlertsCard } from '../components/homepage/RecentAlertsCard';
import { RecentDisasterEvents } from '../components/homepage/RecentDisasterEvents';
import { HazardDetailModal } from '../components/hazards/HazardDetailModal';
import { HazardService } from '../services/hazardService';
import { HazardItem } from '../types/hazard';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onSelectHazardById?: (id: string) => void;
  onFilterHazardsCategory?: (category: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onSelectHazardById,
}) => {
  const [hazards, setHazards] = useState<HazardItem[]>(() => HazardService.getAllHazards());
  const [activeModalHazard, setActiveModalHazard] = useState<HazardItem | null>(null);

  useEffect(() => {
    HazardService.fetchLiveHazards().then(setHazards).catch(console.error);
    const unsubscribe = HazardService.subscribe(() => {
      setHazards(HazardService.getAllHazards());
    });
    return unsubscribe;
  }, []);

  const handleSelectHazard = (hazardId: string) => {
    const hz = HazardService.getHazardById(hazardId);
    if (hz) {
      setActiveModalHazard(hz);
    } else if (onSelectHazardById) {
      onSelectHazardById(hazardId);
    }
  };

  return (
    <div className="max-w-[1720px] mx-auto space-y-6 font-sans select-none pb-8">
      {/* 1. Homepage Greeting, Subtitle, LIVE Status & Location Switcher */}
      <HomepageHeader />

      {/* 2. Top Grid: Main Weather Card (Left) + Risk Score & Recent Alerts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Weather Card (Large Dark Blue Card with 6 metrics) */}
        <div className="lg:col-span-7 flex flex-col">
          <MainWeatherHeroCard />
        </div>

        {/* Right Column: Current Risk Score & Recent Alerts */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          <CurrentRiskScoreCard />
          <RecentAlertsCard
            hazards={hazards}
            onSelectHazard={handleSelectHazard}
            onViewAll={() => onNavigate('hazards')}
          />
        </div>
      </div>

      {/* 3. Bottom Section: Recent Disaster Events Horizontal Cards */}
      <div className="pt-2">
        <RecentDisasterEvents
          hazards={hazards}
          onSelectHazard={handleSelectHazard}
          onNavigateToAnalytics={() => onNavigate('analytics')}
        />
      </div>

      {/* Deep Dive Modal */}
      <HazardDetailModal
        hazard={activeModalHazard}
        onClose={() => setActiveModalHazard(null)}
        onViewOnMap={() => onNavigate('live-map')}
      />
    </div>
  );
};
