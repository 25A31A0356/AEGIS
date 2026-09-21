import React from 'react';
import {
  Activity,
  ChevronRight,
  Droplets,
  Wind,
  Zap,
  Flame,
  AlertOctagon,
} from 'lucide-react';
import { NearbyActivityItem } from '../../services/locationService';

interface NearbyActivityFeedProps {
  activities: NearbyActivityItem[];
  onSelectActivity?: (activity: NearbyActivityItem) => void;
  onViewSafetyGuide?: (slug: string) => void;
}

export const NearbyActivityFeed: React.FC<NearbyActivityFeedProps> = ({
  activities,
  onSelectActivity,
  onViewSafetyGuide,
}) => {
  const getHazardIcon = (type: string) => {
    switch (type) {
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
        return 'bg-[#F4C84A]/30 text-[#946800] border border-[#F4C84A]/50';
      case 'watch':
        return 'bg-[#18C3D0]/20 text-[#075B8A] border border-[#18C3D0]/30';
      default:
        return 'bg-[#45C79A]/20 text-[#0B6E4F] border border-[#45C79A]/30';
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#DCEBED] p-5 shadow-card font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DCEBED]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#075B8A]" />
          <h3 className="font-extrabold text-sm text-[#075B8A] uppercase tracking-wider font-sans">
            Nearby Activity
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#708696] font-semibold uppercase">
          Newest First • {activities.length} Incidents
        </span>
      </div>

      {/* Activity List */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {activities.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectActivity && onSelectActivity(item)}
            className="group p-3 rounded-2xl bg-[#F4F8FA] hover:bg-[#EDFAFC] border border-[#DCEBED] hover:border-[#18C3D0]/60 transition-all duration-150 cursor-pointer space-y-2"
          >
            {/* Top row: Icon + Hazard + Severity + Time */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-lg bg-white border border-[#DCEBED] flex items-center justify-center shrink-0">
                  {getHazardIcon(item.hazardType)}
                </div>
                <span className="font-extrabold text-xs text-[#075B8A] truncate">
                  {item.hazardType}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${getSeverityBadgeClass(
                    item.severity
                  )}`}
                >
                  {item.severity}
                </span>
                <span className="text-[10px] font-mono text-[#708696]">
                  {item.timestamp}
                </span>
              </div>
            </div>

            {/* Title & Location */}
            <div>
              <p className="text-xs font-semibold text-[#18364A] leading-snug group-hover:text-[#075B8A]">
                {item.title}
              </p>
              <div className="flex items-center justify-between text-[10.5px] text-[#708696] mt-1 font-mono">
                <span className="truncate max-w-[200px]">{item.locationName}</span>
                <span className="text-[#075B8A] font-bold shrink-0">
                  {item.distanceKm} km away
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            {onViewSafetyGuide && (
              <div className="pt-1.5 border-t border-[#DCEBED]/60 flex items-center justify-between text-[10.5px]">
                <span className="text-[#708696] truncate max-w-[170px] text-[10px] font-mono">
                  Src: {item.source}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewSafetyGuide(item.safetyGuideSlug || 'floods');
                  }}
                  className="inline-flex items-center gap-1 font-bold text-[#075B8A] hover:text-[#18C3D0] transition-colors"
                >
                  <span>Safety Guide</span>
                  <ChevronRight className="w-3 h-3 text-[#18C3D0]" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
