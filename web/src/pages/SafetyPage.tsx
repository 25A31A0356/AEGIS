import React, { useState } from 'react';
import { SafetyPageHeader } from '../components/safety/SafetyPageHeader';
import { SafeStatusCard } from '../components/safety/SafeStatusCard';
import { DisasterSelectorGrid } from '../components/safety/DisasterSelectorGrid';
import { SelectedGuideHeroBanner } from '../components/safety/SelectedGuideHeroBanner';
import { DosAndDontsSection } from '../components/safety/DosAndDontsSection';
import { SafetyVideoTutorialCard } from '../components/safety/SafetyVideoTutorialCard';
import { SAFETY_GUIDES } from '../data/safetyGuidesData';
import { PhoneCall } from 'lucide-react';

interface SafetyPageProps {
  onNavigateToSOS?: () => void;
}

export const SafetyPage: React.FC<SafetyPageProps> = ({ onNavigateToSOS }) => {
  const [selectedHazardId, setSelectedHazardId] = useState<string>('floods');

  const currentGuide = SAFETY_GUIDES[selectedHazardId] || SAFETY_GUIDES['floods'];

  return (
    <div className="max-w-[1720px] mx-auto space-y-6 font-sans select-none pb-8">
      {/* 1. Page Header & Offline Status Pill */}
      <SafetyPageHeader />

      {/* 2. Integrated Safe Status & Check-in Desk */}
      <SafeStatusCard onOpenSOSMap={onNavigateToSOS} />

      {/* 2. Section: Choose your disaster */}
      <DisasterSelectorGrid
        selectedHazardId={selectedHazardId}
        onSelectHazard={setSelectedHazardId}
        onViewAllHazards={() => setSelectedHazardId('floods')}
      />

      {/* 3. Selected Guide Hero Banner */}
      <SelectedGuideHeroBanner guide={currentGuide} />

      {/* 4. DO'S and DON'TS Section (4 numbered cards each) */}
      <DosAndDontsSection guide={currentGuide} />

      {/* 5. Video Tutorial Section */}
      <SafetyVideoTutorialCard video={currentGuide.video} />

      {/* 6. Instant Emergency SOS & Helpline Quick Bar */}
      <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FEF1F3] border border-[#FDC8D1] text-[#E94B68] flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#18364A] font-sans">
              Immediate Danger? Call National Emergency Services
            </h4>
            <p className="text-xs text-[#708696] mt-0.5 font-mono">
              All-in-One: <strong>112</strong> | Disaster (NDMA): <strong>1078</strong> | Ambulance: <strong>108</strong>
            </p>
          </div>
        </div>

        {onNavigateToSOS && (
          <button
            onClick={onNavigateToSOS}
            className="px-5 py-2.5 rounded-full bg-[#E94B68] hover:bg-[#D43D59] text-white text-xs font-bold font-mono shadow-md shadow-[#E94B68]/20 transition-all shrink-0"
          >
            Open SOS Triage Desk →
          </button>
        )}
      </div>
    </div>
  );
};
