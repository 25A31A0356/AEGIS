import React from 'react';
import {
  Layers,
  Radio,
  Zap,
  Globe,
  Play,
  Pause,
} from 'lucide-react';

export type TechnicalLayerType = 'radar' | 'satellite' | 'lightning';

interface TechnicalLayerSwitcherProps {
  activeLayer: TechnicalLayerType;
  onSelectLayer: (layer: TechnicalLayerType) => void;
  isRadarPlaying?: boolean;
  onToggleRadarPlay?: () => void;
}

export const TechnicalLayerSwitcher: React.FC<TechnicalLayerSwitcherProps> = ({
  activeLayer,
  onSelectLayer,
  isRadarPlaying = true,
  onToggleRadarPlay,
}) => {
  const layerOptions = [
    {
      id: 'radar' as TechnicalLayerType,
      label: 'Radar',
      icon: Radio,
      badge: 'LIVE dBZ',
    },
    {
      id: 'satellite' as TechnicalLayerType,
      label: 'Satellite',
      icon: Globe,
      badge: 'INSAT-3D',
    },
    {
      id: 'lightning' as TechnicalLayerType,
      label: 'Lightning',
      icon: Zap,
      badge: 'REAL-TIME',
    },
  ];

  return (
    <div className="bg-white rounded-[20px] border border-[#DCEBED] p-5 shadow-card space-y-4 font-sans">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DCEBED]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#075B8A]" />
          <h3 className="font-extrabold text-sm text-[#075B8A] uppercase tracking-wider font-sans">
            Technical Map Layers
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#708696] font-semibold uppercase">
          Layer Control
        </span>
      </div>

      {/* Layer Selection Buttons (Selected layer: Cyan highlighted) */}
      <div className="grid grid-cols-3 gap-2">
        {layerOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = activeLayer === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectLayer(opt.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#18C3D0] border-[#18C3D0] text-[#075B8A] shadow-md shadow-[#18C3D0]/20 font-bold scale-[1.02]'
                  : 'bg-[#F4F8FA] border-[#DCEBED] text-[#708696] hover:bg-[#EDFAFC] hover:text-[#075B8A]'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-1.5 ${
                  isSelected ? 'text-[#075B8A]' : 'text-[#708696]'
                }`}
              />
              <span className="text-xs font-bold leading-tight">{opt.label}</span>
              <span
                className={`text-[9px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded-full uppercase ${
                  isSelected
                    ? 'bg-[#075B8A] text-[#18C3D0]'
                    : 'bg-slate-200/70 text-[#708696]'
                }`}
              >
                {opt.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Layer Details Sub-Panel */}
      <div className="bg-[#F4F8FA] rounded-2xl p-4 border border-[#DCEBED] space-y-3">
        {/* RADAR VIEW */}
        {activeLayer === 'radar' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-xs text-[#075B8A] uppercase font-sans tracking-wide">
                  Radar View
                </h4>
                <p className="text-[11px] text-[#708696] mt-0.5">
                  Track precipitation movement and intensity.
                </p>
              </div>

              {onToggleRadarPlay && (
                <button
                  onClick={onToggleRadarPlay}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#DCEBED] text-[#075B8A] text-xs font-semibold hover:bg-[#EDFAFC] transition-colors shadow-xs"
                >
                  {isRadarPlaying ? (
                    <>
                      <Pause className="w-3 h-3 text-[#E94B68]" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-[#45C79A]" />
                      <span>Animate</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Radar Intensity Legend */}
            <div className="space-y-1.5 pt-2 border-t border-[#DCEBED]">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#708696] uppercase">
                <span>Precipitation Legend</span>
                <span>dBZ Scale</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-bold">
                <div className="p-1.5 rounded-lg bg-[#45C79A]/20 border border-[#45C79A]/40 text-[#0B6E4F]">
                  <span className="block">Light</span>
                  <span className="text-[9px] opacity-75">15–30 dBZ</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#F4C84A]/30 border border-[#F4C84A]/50 text-[#946800]">
                  <span className="block">Moderate</span>
                  <span className="text-[9px] opacity-75">35–45 dBZ</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#E94B68]/20 border border-[#E94B68]/40 text-[#E94B68]">
                  <span className="block">Heavy</span>
                  <span className="text-[9px] opacity-75">&gt; 50 dBZ</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SATELLITE VIEW */}
        {activeLayer === 'satellite' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div>
              <h4 className="font-extrabold text-xs text-[#075B8A] uppercase font-sans tracking-wide">
                Satellite Imagery (INSAT-3D/3DR)
              </h4>
              <p className="text-[11px] text-[#708696] mt-0.5">
                High-resolution infrared cloud band & tropical storm tracking.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#DCEBED] text-[11px] text-[#18364A]">
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-[#708696]">Cloud Top Temperature:</span>
                <strong className="font-mono text-[#075B8A]">-68°C (Deep Convection)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-[#708696]">Regional Cloud Cover:</span>
                <strong className="font-mono text-[#E94B68]">88% Overcast</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#708696]">Sensor Refresh Interval:</span>
                <strong className="font-mono text-[#45C79A]">Every 15 Mins</strong>
              </div>
            </div>
          </div>
        )}

        {/* LIGHTNING VIEW */}
        {activeLayer === 'lightning' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div>
              <h4 className="font-extrabold text-xs text-[#075B8A] uppercase font-sans tracking-wide">
                Lightning Activity Network
              </h4>
              <p className="text-[11px] text-[#708696] mt-0.5">
                Cloud-to-ground & intra-cloud electrostatic discharge events.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#DCEBED] text-[11px] text-[#18364A]">
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-[#708696]">Active Strikes (15m window):</span>
                <strong className="font-mono text-[#E94B68]">18 Detected</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-[#708696]">Peak Flash Energy:</span>
                <strong className="font-mono text-[#F4C84A]">-55 kA (Severe)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#708696]">Sensor Grid Status:</span>
                <strong className="font-mono text-[#45C79A]">Optimal (100% Online)</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
