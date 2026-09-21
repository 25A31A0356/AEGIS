import React from 'react';
import {
  Wind,
  CloudRain,
  Flame,
  Activity,
  Mountain,
  Waves,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export interface HazardCategoryOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const HAZARD_CATEGORIES: HazardCategoryOption[] = [
  { id: 'all', label: 'All Hazards', icon: Layers },
  { id: 'cyclone', label: 'Cyclone', icon: Wind },
  { id: 'flood', label: 'Flood', icon: CloudRain },
  { id: 'heatwave', label: 'Heatwave', icon: Flame },
  { id: 'earthquake', label: 'Earthquake', icon: Activity },
  { id: 'landslide', label: 'Landslide', icon: Mountain },
  { id: 'tsunami', label: 'Tsunami / Coastal', icon: Waves },
  { id: 'severe-weather', label: 'Severe Storm', icon: AlertTriangle },
];

interface HazardSelectorProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export const HazardSelector: React.FC<HazardSelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar ${className}`}>
      {HAZARD_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
              isSelected
                ? 'bg-[#075B8A] text-white shadow-sm shadow-[#075B8A]/20 font-bold scale-[1.02]'
                : 'bg-white text-[#18364A] hover:bg-[#F4F8FA] border border-[#DCEBED]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#18C3D0]' : 'text-[#708696]'}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
