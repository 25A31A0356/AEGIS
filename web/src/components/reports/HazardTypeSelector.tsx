import React from 'react';
import {
  CloudRain,
  Flame,
  Activity,
  Wind,
  Mountain,
  AlertOctagon,
  CloudLightning,
  Zap,
  HelpCircle,
  Check,
} from 'lucide-react';
import { ReportHazardType } from '../../types/report';

interface HazardTypeSelectorProps {
  selectedHazard: ReportHazardType | '';
  onSelectHazard: (hazard: ReportHazardType, label: string) => void;
}

const HAZARDS: Array<{
  id: ReportHazardType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
  border: string;
}> = [
  {
    id: 'flood',
    label: 'Flood',
    description: 'Urban waterlogging, river overflow, flash inundation',
    icon: CloudRain,
    color: '#075B8A',
    bg: '#EDFAFC',
    border: '#AEEBF0',
  },
  {
    id: 'fire',
    label: 'Fire',
    description: 'Building blaze, forest wildfire, commercial fire',
    icon: Flame,
    color: '#E94B68',
    bg: '#FEF1F3',
    border: '#FDC8D1',
  },
  {
    id: 'earthquake',
    label: 'Earthquake',
    description: 'Ground tremor, building cracks, structural shaking',
    icon: Activity,
    color: '#075B8A',
    bg: '#EDFAFC',
    border: '#AEEBF0',
  },
  {
    id: 'cyclone',
    label: 'Cyclone',
    description: 'Extreme gale winds, storm surge, flying debris',
    icon: Wind,
    color: '#075B8A',
    bg: '#EDFAFC',
    border: '#AEEBF0',
  },
  {
    id: 'landslide',
    label: 'Landslide',
    description: 'Hillside rockfall, mudslide, slope collapse',
    icon: Mountain,
    color: '#075B8A',
    bg: '#EDFAFC',
    border: '#AEEBF0',
  },
  {
    id: 'road_blockage',
    label: 'Road Blockage',
    description: 'Uprooted trees, fallen powerlines, collapsed bridge',
    icon: AlertOctagon,
    color: '#F4C84A',
    bg: '#FFFBF0',
    border: '#FDE8A4',
  },
  {
    id: 'heavy_rainfall',
    label: 'Heavy Rainfall',
    description: 'Continuous torrential downpour, drain overflowing',
    icon: CloudLightning,
    color: '#075B8A',
    bg: '#EDFAFC',
    border: '#AEEBF0',
  },
  {
    id: 'lightning',
    label: 'Lightning',
    description: 'Cloud-to-ground strike, transformer burst',
    icon: Zap,
    color: '#F4C84A',
    bg: '#FFFBF0',
    border: '#FDE8A4',
  },
  {
    id: 'other',
    label: 'Other Hazard',
    description: 'Chemical leak, industrial spill, gas emission, subsidence',
    icon: HelpCircle,
    color: '#708696',
    bg: '#F4F8FA',
    border: '#DCEBED',
  },
];

export const HazardTypeSelector: React.FC<HazardTypeSelectorProps> = ({
  selectedHazard,
  onSelectHazard,
}) => {
  return (
    <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card mb-6">
      <div className="pb-3 mb-4 border-b border-[#DCEBED]">
        <h3 className="text-base sm:text-lg font-bold text-[#18364A] font-sans">
          Step 1: What type of incident are you reporting?
        </h3>
        <p className="text-xs text-[#708696] mt-0.5">
          Select the hazard category that best describes the emergency in your vicinity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {HAZARDS.map((h) => {
          const Icon = h.icon;
          const isSelected = selectedHazard === h.id;

          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelectHazard(h.id, h.label)}
              className={`p-4 rounded-[20px] text-left flex items-start gap-3.5 transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-white border-2 border-[#18C3D0] ring-2 ring-[#18C3D0]/20 shadow-elevated scale-[1.02]'
                  : 'bg-[#F4F8FA] hover:bg-[#EEF5F8] border border-[#DCEBED] hover:border-[#18C3D0]'
              }`}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: h.bg, border: `1px solid ${h.border}` }}
              >
                <Icon className="w-5 h-5" style={{ color: h.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-[#18364A] font-sans">
                    {h.label}
                  </h4>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#18C3D0] text-[#075B8A] flex items-center justify-center text-[10px] font-bold">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#708696] leading-snug mt-0.5">
                  {h.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
