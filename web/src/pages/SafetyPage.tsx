import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { useTranslation } from '../i18n/useTranslation';

interface SafetyPageProps {
  onNavigateToSOS?: () => void;
}

export const SafetyPage: React.FC<SafetyPageProps> = ({ onNavigateToSOS }) => {
  const { selectedLocation } = useLocation();
  const { dict } = useTranslation();

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#27272a] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {dict.safetyHub || 'Citizen Safety Hub'} & {dict.readiness || '72h Readiness'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#a1a1aa] mt-0.5">
            Preparedness checklists, evacuation protocols, and verified national emergency hotlines.
          </p>
        </div>

        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 72h Go-Bag Checklist (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-5 shadow-xs dark:shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-800 dark:text-slate-200 text-xl">backpack</span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dict.grabBagTitle || '72-Hour Emergency Go-Bag'}
              </h2>
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#18181b] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-[#27272a]">
              {completedItems}/{totalItems} Ready ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-[#27272a] rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-2 pt-2">
            {checklistItems.map((item) => (
              <label
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  activeChecklist[item.id]
                    ? 'bg-slate-50 dark:bg-[#18181b] border-slate-300 dark:border-[#3f3f46] text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-[#111111] border-slate-200 dark:border-[#27272a] text-slate-600 dark:text-[#a1a1aa] hover:bg-slate-50 dark:hover:bg-[#18181b]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!activeChecklist[item.id]}
                  onChange={() => {}}
                  className="rounded accent-slate-900 dark:accent-white"
                />
                <span className={`text-xs ${activeChecklist[item.id] ? 'font-semibold' : ''}`}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Emergency Helplines & Contacts (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-5 shadow-xs dark:shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-xl">call</span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dict.emergencyContactsDirect || 'Direct Emergency Contacts'}
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-slate-900 dark:text-white">
                <p className="font-bold text-red-600 dark:text-red-400">National Emergency: 112</p>
                <p className="text-[11px] text-slate-600 dark:text-[#a1a1aa]">Unified ambulance, police, and fire rescue.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] text-slate-900 dark:text-white">
                <p className="font-bold text-slate-800 dark:text-slate-200">NDMA Helpline: 1078</p>
                <p className="text-[11px] text-slate-600 dark:text-[#a1a1aa]">National disaster management authority.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] text-slate-900 dark:text-white">
                <p className="font-bold text-slate-800 dark:text-slate-200">Disaster Helpline: 1070</p>
                <p className="text-[11px] text-slate-600 dark:text-[#a1a1aa]">State-level relief commissioner desk.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyPage;
