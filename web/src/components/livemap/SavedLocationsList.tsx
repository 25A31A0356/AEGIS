import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Home,
  Briefcase,
  Users,
  Bookmark,
} from 'lucide-react';
import { SavedLocationItem } from '../../services/locationService';
import { AddLocationModal } from './AddLocationModal';

interface SavedLocationsListProps {
  savedLocations: SavedLocationItem[];
  selectedLocationId: string | null;
  onSelectLocation: (location: SavedLocationItem) => void;
  onAddLocation: (location: Omit<SavedLocationItem, 'id'>) => void;
  onRemoveLocation: (id: string) => void;
}

export const SavedLocationsList: React.FC<SavedLocationsListProps> = ({
  savedLocations,
  selectedLocationId,
  onSelectLocation,
  onAddLocation,
  onRemoveLocation,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'home':
        return <Home className="w-3.5 h-3.5 text-[#075B8A]" />;
      case 'work':
        return <Briefcase className="w-3.5 h-3.5 text-[#075B8A]" />;
      case 'family':
        return <Users className="w-3.5 h-3.5 text-[#075B8A]" />;
      default:
        return <Bookmark className="w-3.5 h-3.5 text-[#075B8A]" />;
    }
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'bg-[#E94B68]/15 text-[#E94B68] border border-[#E94B68]/30';
      case 'high':
        return 'bg-[#F4C84A]/30 text-[#946800] border border-[#F4C84A]/50';
      case 'medium':
        return 'bg-[#18C3D0]/20 text-[#075B8A] border border-[#18C3D0]/30';
      default:
        return 'bg-[#45C79A]/20 text-[#0B6E4F] border border-[#45C79A]/30';
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#DCEBED] p-5 shadow-card font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DCEBED]">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#075B8A]" />
            <h3 className="font-extrabold text-sm text-[#075B8A] uppercase tracking-wider font-sans">
              Saved Locations
            </h3>
          </div>
          <p className="text-[11px] text-[#708696] mt-0.5">
            1-click center map and synchronize hazard activity
          </p>
        </div>

        {/* Add Location Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDFAFC] hover:bg-[#18C3D0] text-[#075B8A] hover:text-[#075B8A] text-xs font-bold border border-[#AEEBF0] transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Grid of Saved Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {savedLocations.map((loc) => {
          const isSelected = selectedLocationId === loc.id;
          return (
            <div
              key={loc.id}
              onClick={() => onSelectLocation(loc)}
              className={`group relative p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#EDFAFC] border-[#18C3D0] shadow-md shadow-[#18C3D0]/10 ring-2 ring-[#18C3D0]'
                  : 'bg-[#F4F8FA] border-[#DCEBED] hover:bg-white hover:border-[#18C3D0]/60'
              }`}
            >
              {/* Category Icon & Risk Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 rounded-lg bg-white border border-[#DCEBED] flex items-center justify-center shadow-xs">
                  {getCategoryIcon(loc.category)}
                </div>

                <span
                  className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${getRiskBadgeClass(
                    loc.riskLevel
                  )}`}
                >
                  {loc.riskLevel} Risk
                </span>
              </div>

              {/* Location Name & District */}
              <div className="space-y-0.5 mb-2">
                <h4 className="font-extrabold text-xs text-[#18364A] truncate group-hover:text-[#075B8A]">
                  {loc.name}
                </h4>
                <p className="text-[10px] text-[#708696] font-mono truncate">
                  {loc.district}, {loc.stateName}
                </p>
              </div>

              {/* Weather Snippet & Remove */}
              <div className="flex items-center justify-between pt-2 border-t border-[#DCEBED]/80 text-[10.5px]">
                <span className="text-[#708696] font-medium truncate max-w-[120px]">
                  {loc.weatherSnippet}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLocation(loc.id);
                  }}
                  className="p-1 rounded-lg text-[#708696] hover:text-[#E94B68] hover:bg-white transition-colors"
                  title="Remove saved location"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddLocation={onAddLocation}
      />
    </div>
  );
};
