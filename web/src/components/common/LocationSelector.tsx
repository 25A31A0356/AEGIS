import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  ChevronDown,
  Check,
  Search,
  AlertTriangle,
  X,
  Compass,
  Building2,
  Globe2,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import {
  INDIAN_CITIES_REGISTRY,
  ALL_INDIAN_STATES_DATA,
  LocationSearchResult,
  SavedLocationItem,
} from '../../services/locationService';

interface LocationSelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const {
    selectedLocation,
    weather,
    savedLocations,
    isGpsActive,
    isLoadingLocation,
    locationError,
    clearLocationError,
    requestCurrentGPS,
    selectLocationItem,
  } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'districts' | 'saved'>('districts');

  // Filter districts by state and search query
  const filteredDistricts = useMemo(() => {
    let list = INDIAN_CITIES_REGISTRY;

    if (selectedStateFilter !== 'ALL') {
      list = list.filter((item) => item.stateId === selectedStateFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.stateName.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.stateId.toLowerCase() === q
      );
    }

    return list;
  }, [searchQuery, selectedStateFilter]);

  const handleSelectDistrict = (district: LocationSearchResult) => {
    selectLocationItem(district);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectSaved = (saved: SavedLocationItem) => {
    selectLocationItem(saved);
    setIsOpen(false);
  };

  const handleUseCurrentGPS = async () => {
    await requestCurrentGPS();
    if (!locationError) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#071828] hover:bg-[#F4F8FA] dark:hover:bg-[#0B1E30] border border-[#DCEBED] dark:border-[#1E3347] text-xs font-semibold text-[#18364A] dark:text-slate-100 shadow-subtle transition-all duration-150 cursor-pointer"
        title="Switch Location & District Station across India"
      >
        <MapPin className="w-3.5 h-3.5 text-[#E94B68] shrink-0" />
        <div className="text-left">
          <div className="font-bold text-[11px] leading-tight text-[#18364A] dark:text-white flex items-center gap-1.5">
            <span className="truncate max-w-[130px] sm:max-w-[170px]">
              {selectedLocation?.name || weather.cityName}
            </span>
            {isGpsActive ? (
              <span className="text-[8.5px] font-mono uppercase bg-[#18C3D0]/20 text-[#075B8A] dark:text-[#18C3D0] px-1 py-0.2 rounded font-bold">
                GPS
              </span>
            ) : selectedLocation?.stateId ? (
              <span className="text-[8.5px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 py-0.2 rounded font-bold">
                {selectedLocation.stateId}
              </span>
            ) : null}
          </div>
          {variant === 'full' && (
            <div className="text-[10px] text-[#708696] dark:text-slate-400 font-mono leading-none mt-0.5">
              {weather.temp}°C • {weather.condition}
            </div>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#708696] dark:text-slate-400 shrink-0" />
      </button>

      {/* Popover Dropdown Dialog */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-84 sm:w-96 bg-white dark:bg-[#071828] rounded-[22px] shadow-elevated border border-[#DCEBED] dark:border-[#1E3347] py-3 z-50 animate-in fade-in slide-in-from-top-2">
          {/* Header & Tabs */}
          <div className="px-3.5 pb-2.5 border-b border-[#DCEBED] dark:border-[#1E3347] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#075B8A] dark:text-[#18C3D0] uppercase font-mono">
              <Compass className="w-4 h-4 text-[#18C3D0]" />
              <span>Pan-India Locations (780+)</span>
            </div>

            <div className="flex items-center gap-1 bg-[#F4F8FA] dark:bg-[#0B1E30] p-0.5 rounded-lg border border-[#DCEBED] dark:border-[#1E3347]">
              <button
                onClick={() => setActiveTab('districts')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-colors cursor-pointer ${
                  activeTab === 'districts'
                    ? 'bg-[#075B8A] text-white shadow-xs'
                    : 'text-[#708696] dark:text-slate-400 hover:text-[#18364A] dark:hover:text-white'
                }`}
              >
                Districts ({INDIAN_CITIES_REGISTRY.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-colors cursor-pointer ${
                  activeTab === 'saved'
                    ? 'bg-[#075B8A] text-white shadow-xs'
                    : 'text-[#708696] dark:text-slate-400 hover:text-[#18364A] dark:hover:text-white'
                }`}
              >
                Saved ({savedLocations.length})
              </button>
            </div>
          </div>

          {/* Friendly Geolocation Error Banner if permission denied / unavailable */}
          {locationError && (
            <div className="mx-3 my-2 p-2.5 bg-[#FFF2F4] dark:bg-red-950/40 border border-[#FFD3DA] dark:border-red-800 rounded-xl text-xs text-[#18364A] dark:text-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[#E94B68]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{locationError.message}</span>
                </div>
                <button
                  onClick={clearLocationError}
                  className="text-[#708696] hover:text-[#18364A] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10.5px] text-[#708696] dark:text-slate-400 leading-tight">
                {locationError.friendlyAdvice}
              </p>
            </div>
          )}

          {/* 1-Click GPS Button (Mobile App Parity) */}
          <div className="p-3 pb-2">
            <button
              onClick={handleUseCurrentGPS}
              disabled={isLoadingLocation}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isGpsActive
                  ? 'bg-[#EDFAFC] dark:bg-[#075B8A]/30 text-[#075B8A] dark:text-[#18C3D0] border border-[#18C3D0]'
                  : 'bg-[#075B8A] hover:bg-[#0B6E9E] text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Navigation
                  className={`w-4 h-4 text-[#18C3D0] ${isLoadingLocation ? 'animate-spin' : ''}`}
                />
                <span>
                  {isLoadingLocation
                    ? 'Detecting GPS Coordinates...'
                    : isGpsActive
                    ? '📍 My Real GPS Location Active'
                    : 'Use My Current GPS Location'}
                </span>
              </div>
              <span className="text-[9px] font-mono uppercase bg-white/20 dark:bg-black/30 px-1.5 py-0.5 rounded">
                High Accuracy
              </span>
            </button>
          </div>

          {/* Search Input & State Filter */}
          <div className="px-3 pb-2 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#708696] dark:text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all 780+ Indian districts..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F4F8FA] dark:bg-[#0B1E30] border border-[#DCEBED] dark:border-[#1E3347] rounded-full text-xs text-[#18364A] dark:text-slate-100 placeholder:text-[#708696] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#18C3D0]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#708696] hover:text-[#18364A] dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* State / UT Dropdown Filter */}
            {activeTab === 'districts' && (
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-mono text-[#708696] dark:text-slate-400 flex items-center gap-1 shrink-0">
                  <Globe2 className="w-3 h-3 text-[#18C3D0]" />
                  <span>State/UT:</span>
                </div>
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="w-full text-xs py-1 px-2.5 bg-[#F4F8FA] dark:bg-[#0B1E30] border border-[#DCEBED] dark:border-[#1E3347] rounded-lg text-[#18364A] dark:text-slate-200 focus:outline-none focus:border-[#18C3D0] font-sans"
                >
                  <option value="ALL">All States & Union Territories (36)</option>
                  {ALL_INDIAN_STATES_DATA.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name} ({state.districts.length} districts)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-60 overflow-y-auto px-2 space-y-1">
            {activeTab === 'saved' ? (
              savedLocations.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#708696] dark:text-slate-400">
                  No saved locations yet. You can add places from the Live Map.
                </div>
              ) : (
                savedLocations.map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => handleSelectSaved(saved)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between hover:bg-[#F4F8FA] dark:hover:bg-[#0B1E30] transition-colors cursor-pointer ${
                      selectedLocation?.id === saved.id
                        ? 'bg-[#EDFAFC] dark:bg-[#075B8A]/30 font-bold text-[#075B8A] dark:text-[#18C3D0]'
                        : 'text-[#18364A] dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#18364A] dark:text-white">{saved.name}</div>
                      <div className="text-[10px] text-[#708696] dark:text-slate-400 font-mono">
                        {saved.district}, {saved.stateName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#18C3D0]/20 text-[#075B8A] dark:text-[#18C3D0]">
                        {saved.riskLevel}
                      </span>
                      {selectedLocation?.id === saved.id && (
                        <Check className="w-3.5 h-3.5 text-[#18C3D0]" />
                      )}
                    </div>
                  </button>
                ))
              )
            ) : filteredDistricts.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#708696] dark:text-slate-400 space-y-1">
                <div>No matching district found for "{searchQuery}".</div>
                <div className="text-[10px] text-slate-400">Try searching by state or another spelling.</div>
              </div>
            ) : (
              filteredDistricts.map((district) => (
                <button
                  key={district.id}
                  onClick={() => handleSelectDistrict(district)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between hover:bg-[#F4F8FA] dark:hover:bg-[#0B1E30] transition-colors cursor-pointer ${
                    selectedLocation?.id === district.id
                      ? 'bg-[#EDFAFC] dark:bg-[#075B8A]/30 font-bold text-[#075B8A] dark:text-[#18C3D0]'
                      : 'text-[#18364A] dark:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-[#18364A] dark:text-white flex items-center gap-1.5">
                      <span>{district.name}</span>
                      <span className="text-[9px] font-mono text-[#708696] dark:text-slate-400 font-normal">
                        ({district.stateId})
                      </span>
                    </div>
                    <div className="text-[10px] text-[#708696] dark:text-slate-400">
                      {district.stateName} • [{district.coordinates[0].toFixed(2)}°N, {district.coordinates[1].toFixed(2)}°E]
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase ${
                        district.riskLevel === 'Critical'
                          ? 'bg-[#E94B68]/15 text-[#E94B68]'
                          : district.riskLevel === 'High'
                          ? 'bg-[#F4C84A]/30 text-[#946800] dark:text-[#F4C84A]'
                          : 'bg-[#45C79A]/20 text-[#0B6E4F] dark:text-[#45C79A]'
                      }`}
                    >
                      {district.riskLevel}
                    </span>
                    {selectedLocation?.id === district.id && (
                      <Check className="w-3.5 h-3.5 text-[#18C3D0]" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
