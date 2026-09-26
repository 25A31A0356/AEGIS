import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { useTranslation } from '../i18n/useTranslation';
import { NDMA_HAZARD_SAFETY_GUIDES, HazardSafetyGuide } from '../data/ndmaSafetyData';
import { HazardSafetyModal } from '../components/safety/HazardSafetyModal';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Video,
  ChevronRight,
  Backpack,
  PhoneCall,
  CloudRain,
  Wind,
  Activity,
  Mountain,
  Car,
  Zap,
  Waves,
  AlertTriangle,
} from 'lucide-react';

interface SafetyPageProps {
  onNavigateToSOS?: () => void;
}

export const SafetyPage: React.FC<SafetyPageProps> = ({ onNavigateToSOS }) => {
  const { selectedLocation } = useLocation();
  const { dict } = useTranslation();

  const [selectedGuide, setSelectedGuide] = useState<HazardSafetyGuide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [activeChecklist, setActiveChecklist] = useState<Record<string, boolean>>({
    water: true,
    food: true,
    firstaid: false,
    flashlight: false,
    radio: false,
    powerbank: true,
    docs: false,
    whistle: false,
  });

  const toggleItem = (id: string) => {
    setActiveChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checklistItems = [
    { id: 'water', label: 'Drinking Water (3 Liters / Person / Day)' },
    { id: 'food', label: 'Non-perishable energy bars & ready-to-eat food' },
    { id: 'firstaid', label: 'First Aid Kit (Antiseptic, bandages, oral rehydration)' },
    { id: 'flashlight', label: 'LED Flashlight & Spare Batteries' },
    { id: 'radio', label: 'Battery or crank emergency weather radio' },
    { id: 'powerbank', label: 'Charged Power Bank & Mobile Cables' },
    { id: 'docs', label: 'Waterproof pouch with ID, Aadhar & insurance copies' },
    { id: 'whistle', label: 'Emergency Whistle for acoustic location signaling' },
  ];

  const totalItems = checklistItems.length;
  const completedItems = Object.values(activeChecklist).filter(Boolean).length;
  const progressPercent = Math.round((completedItems / totalItems) * 100);

  const handleOpenGuide = (guide: HazardSafetyGuide) => {
    setSelectedGuide(guide);
    setIsModalOpen(true);
  };

  const filteredGuides = NDMA_HAZARD_SAFETY_GUIDES.filter((g) => {
    if (categoryFilter === 'all') return true;
    return g.category === categoryFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#27272a] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-blue-600 text-white">
              NDMA SACHET ALIGNED
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              National Disaster Protocols
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Your Safety Hub & Disaster Action SOPs
          </h1>
          <p className="text-xs text-slate-600 dark:text-[#a1a1aa] mt-0.5">
            Verified emergency protocols, authoritative Do's & Don'ts, video resources, and 72-hour readiness checklists.
          </p>
        </div>

        {onNavigateToSOS && (
          <button
            onClick={onNavigateToSOS}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Emergency Distress SOS</span>
          </button>
        )}
      </div>

      {/* SECTION 1: Hazard Protocols Grid with Real Imagery */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Multi-Hazard Safety Guidelines (Click for Full SOP & Videos)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any hazard card to view detailed NDMA SACHET Do's, Don'ts, and official safety videos.
            </p>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Hazards' },
              { id: 'flood', label: 'Flood' },
              { id: 'cyclone', label: 'Cyclone' },
              { id: 'earthquake', label: 'Earthquake' },
              { id: 'landslide', label: 'Landslide' },
              { id: 'road', label: 'Road Safety' },
              { id: 'lightning', label: 'Lightning' },
              { id: 'ocean', label: 'Coastal' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                  categoryFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#18181b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#27272a]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 7 Hazard Cards with Real Background Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGuides.map((guide) => (
            <div
              key={guide.id}
              onClick={() => handleOpenGuide(guide)}
              className="group relative bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-2xl hover:border-blue-500/60 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              {/* Real Disaster Photo Banner */}
              <div className="relative h-36 w-full overflow-hidden shrink-0">
                <img
                  src={guide.imageUrl}
                  alt={guide.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                />
                {/* Gradient Shadow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Badges on Top of Photo */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-white shadow-md backdrop-blur-md"
                    style={{ backgroundColor: guide.badgeColor }}
                  >
                    {guide.shortName.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white border border-white/20">
                    {guide.authority}
                  </span>
                </div>

                {/* Title on lower edge of image */}
                <div className="absolute bottom-2.5 left-3 right-3">
                  <h3 className="text-sm font-black text-white drop-shadow-md group-hover:text-blue-200 transition-colors">
                    {guide.name}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                  {guide.tagline}
                </p>

                {/* DO's & DON'Ts Count Badges */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{guide.dos.length} DO's</span>
                  </div>
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10.5px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{guide.donts.length} DON'Ts</span>
                  </div>
                </div>

                {/* Bottom Action CTA */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span className="flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" />
                    <span>Video & Full SOP</span>
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: 72-Hour Readiness & Emergency Hotlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* 72h Go-Bag Checklist (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Backpack className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dict.grabBagTitle || '72-Hour Emergency Go-Bag Checklist'}
              </h2>
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#18181b] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/10">
              {completedItems}/{totalItems} Ready ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-[#27272a] rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {checklistItems.map((item) => (
              <label
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  activeChecklist[item.id]
                    ? 'bg-slate-50 dark:bg-[#18181b] border-slate-300 dark:border-[#3f3f46] text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-[#111113] border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#a1a1aa] hover:bg-slate-50 dark:hover:bg-[#18181b]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!activeChecklist[item.id]}
                  onChange={() => {}}
                  className="rounded accent-blue-600 w-4 h-4"
                />
                <span className={`text-xs ${activeChecklist[item.id] ? 'font-semibold' : ''}`}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Emergency Helplines & Contacts (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dict.emergencyContactsDirect || 'National Emergency Helplines'}
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-slate-900 dark:text-white">
                <p className="font-bold text-red-600 dark:text-red-400 text-sm">Emergency Response: 112</p>
                <p className="text-[11px] text-slate-600 dark:text-[#a1a1aa]">Unified national ambulance, police, and fire rescue.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                <p className="font-bold text-slate-800 dark:text-slate-200">NDMA Disaster Helpline: 1078</p>
                <p className="text-[11px] text-slate-600 dark:text-[#a1a1aa]">National Disaster Management Authority desk.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                <p className="font-bold text-slate-800 dark:text-slate-200">State Relief Commissioner: 1070</p>
                <p className="text-[11px] text-slate-600 dark:text-[#a1a1aa]">State-level emergency operations center.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                <p className="font-bold text-slate-800 dark:text-slate-200">Indian Coast Guard SAR: 1554</p>
                <p className="text-[11px] text-slate-600 dark:text-[#a1a1aa]">Maritime and coastal distress rescue operations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-out Modal for Selected Hazard Protocol */}
      <HazardSafetyModal
        guide={selectedGuide}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNavigateToSOS={onNavigateToSOS}
      />
    </div>
  );
};

export default SafetyPage;
