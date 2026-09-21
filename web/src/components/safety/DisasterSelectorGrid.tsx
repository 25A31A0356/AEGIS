import React from 'react';
import {
  CloudRain,
  Activity,
  Waves,
  Wind,
  Sun,
  Flame,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DisasterSelectorGridProps {
  selectedHazardId: string;
  onSelectHazard: (id: string) => void;
  onViewAllHazards?: () => void;
}

const DISASTER_LIST = [
  { id: 'floods', name: 'Floods', icon: CloudRain, color: '#075B8A', bg: '#EDFAFC', border: '#AEEBF0' },
  { id: 'earthquakes', name: 'Earthquakes', icon: Activity, color: '#075B8A', bg: '#EDFAFC', border: '#AEEBF0' },
  { id: 'tsunamis', name: 'Tsunamis', icon: Waves, color: '#075B8A', bg: '#EDFAFC', border: '#AEEBF0' },
  { id: 'cyclones', name: 'Cyclones', icon: Wind, color: '#075B8A', bg: '#EDFAFC', border: '#AEEBF0' },
  { id: 'heatwaves', name: 'Heatwaves', icon: Sun, color: '#F4C84A', bg: '#FFFBF0', border: '#FDE8A4' },
  { id: 'firestorms', name: 'Firestorms', icon: Flame, color: '#E94B68', bg: '#FEF1F3', border: '#FDC8D1' },
];

export const DisasterSelectorGrid: React.FC<DisasterSelectorGridProps> = ({
  selectedHazardId,
  onSelectHazard,
  onViewAllHazards,
}) => {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#708696]">
          Choose your disaster
        </h3>
        <span className="text-[11px] text-[#708696] font-mono">
          6 Standard Protocols
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {DISASTER_LIST.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedHazardId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectHazard(item.id)}
              className={`p-4 rounded-[20px] text-center flex flex-col items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white border-2 border-[#18C3D0] shadow-elevated scale-[1.03] ring-2 ring-[#18C3D0]/20'
                  : 'bg-white hover:bg-[#F4F8FA] border border-[#DCEBED] shadow-card hover:border-[#18C3D0]'
              }`}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-110"
                style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}
              >
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span
                className={`text-xs font-bold font-sans ${
                  isSelected ? 'text-[#075B8A]' : 'text-[#18364A]'
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}

        {/* View All Hazards Button */}
        <button
          onClick={onViewAllHazards}
          className="p-4 rounded-[20px] text-center flex flex-col items-center justify-center gap-2.5 bg-[#F4F8FA] hover:bg-[#EEF5F8] border border-dashed border-[#DCEBED] hover:border-[#075B8A] transition-all cursor-pointer text-[#075B8A] group"
        >
          <div className="w-10 h-10 rounded-2xl bg-white border border-[#DCEBED] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5 text-[#075B8A]" />
          </div>
          <span className="text-xs font-bold font-sans flex items-center gap-1 group-hover:underline">
            <span>View all hazards</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>
    </div>
  );
};
