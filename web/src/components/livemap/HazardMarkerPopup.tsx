import React from 'react';
import {
  MapPin,
  ChevronRight,
  Droplets,
  Wind,
  Flame,
  Zap,
  Activity,
  AlertOctagon,
} from 'lucide-react';
import { NearbyActivityItem } from '../../services/locationService';

interface HazardMarkerPopupProps {
  hazard: NearbyActivityItem;
  onViewSafetyGuide?: (slug: string) => void;
}

export const HazardMarkerPopup: React.FC<HazardMarkerPopupProps> = ({
  hazard,
  onViewSafetyGuide,
}) => {
  const getHazardIcon = () => {
    switch (hazard.hazardType) {
      case 'Flood':
      case 'Heavy Rain':
        return <Droplets className="w-4 h-4 text-[#18C3D0]" />;
      case 'Cyclone':
        return <Wind className="w-4 h-4 text-[#F4C84A]" />;
      case 'Lightning':
        return <Zap className="w-4 h-4 text-[#F4C84A]" />;
      case 'Fire':
        return <Flame className="w-4 h-4 text-[#E94B68]" />;
      case 'Earthquake':
        return <Activity className="w-4 h-4 text-[#E94B68]" />;
      case 'Road Blockage':
      case 'Landslide':
      default:
        return <AlertOctagon className="w-4 h-4 text-[#E94B68]" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-[#E94B68]/15 text-[#E94B68] border border-[#E94B68]/30';
      case 'warning':
        return 'bg-[#F4C84A]/25 text-[#946800] border border-[#F4C84A]/40';
      case 'watch':
        return 'bg-[#18C3D0]/20 text-[#075B8A] border border-[#18C3D0]/30';
      default:
        return 'bg-[#45C79A]/20 text-[#0B6E4F] border border-[#45C79A]/30';
    }
  };

  return (
    <div className="w-[280px] sm:w-[310px] p-3 text-[#18364A] font-sans">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-[#DCEBED]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F4F8FA] border border-[#DCEBED] flex items-center justify-center shrink-0">
            {getHazardIcon()}
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#075B8A] leading-tight">
              {hazard.hazardType}
            </h4>
            <span className="text-[10px] text-[#708696] font-medium">
              {hazard.status}
            </span>
          </div>
        </div>

        <span
          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${getSeverityBadgeClass(
            hazard.severity
          )}`}
        >
          {hazard.severity}
        </span>
      </div>

      {/* Main Title & Location */}
      <div className="space-y-1.5 mb-2.5">
        <p className="font-semibold text-xs text-[#18364A] leading-snug">
          {hazard.title}
        </p>

        <div className="flex items-center gap-1 text-[11px] text-[#708696]">
          <MapPin className="w-3 h-3 text-[#18C3D0] shrink-0" />
          <span className="truncate">{hazard.locationName}</span>
        </div>
      </div>

      {/* Telemetry Details */}
      <div className="bg-[#F4F8FA] rounded-xl p-2 border border-[#DCEBED] space-y-1 text-[10.5px] font-mono text-[#708696] mb-3">
        <div className="flex justify-between">
          <span>Source:</span>
          <strong className="text-[#075B8A] truncate max-w-[170px] text-right font-sans">
            {hazard.source}
          </strong>
        </div>
        <div className="flex justify-between">
          <span>Timestamp:</span>
          <strong className="text-[#18364A]">{hazard.timestamp}</strong>
        </div>
      </div>

      {/* Recommended Action */}
      <div className="mb-3 p-2 bg-[#EDFAFC] rounded-xl border border-[#AEEBF0] text-[11px]">
        <span className="font-bold text-[#075B8A] block mb-0.5 uppercase tracking-wide text-[9.5px]">
          Recommended Action:
        </span>
        <p className="text-[#18364A] leading-tight">
          {hazard.recommendedAction}
        </p>
      </div>

      {/* View Safety Guide Action */}
      {onViewSafetyGuide && (
        <button
          onClick={() => onViewSafetyGuide(hazard.safetyGuideSlug || 'floods')}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#075B8A] hover:bg-[#0B6E9E] text-white font-semibold text-xs transition-colors shadow-xs"
        >
          <span>View Safety Guide</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#18C3D0]" />
        </button>
      )}
    </div>
  );
};
