import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Check,
  Bookmark,
  ChevronDown,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useProfile } from '../../context/ProfileContext';
import { useTranslation } from '../../i18n/useTranslation';
import { INDIAN_CITIES_REGISTRY, LocationSearchResult } from '../../services/locationService';
import { DataStatusIndicator } from '../common/DataStatusIndicator';

export const HomepageHeader: React.FC = () => {
  const {
    selectedLocation,
    weather,
    selectedState,
    savedLocations,
    isGpsActive,
    isLoadingLocation,
    locationError,
    clearLocationError,
    requestCurrentGPS,
    selectLocationItem,
  } = useLocation();
  const { profile } = useProfile();
  const { t } = useTranslation();

  const [greeting, setGreeting] = useState('Good afternoon');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const filteredCities = INDIAN_CITIES_REGISTRY.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.stateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userName = profile?.fullName?.trim() || 'Citizen';

  const handleSelectCity = (city: LocationSearchResult) => {
    selectLocationItem(city);
    setIsLocationModalOpen(false);
    setSearchQuery('');
  };

  const handleUseCurrentGPS = async () => {
    await requestCurrentGPS();
    if (!locationError) {
      setIsLocationModalOpen(false);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Top Greeting & Status Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-[#18364A] dark:text-slate-100 tracking-tight font-sans">
              {greeting}, <span className="text-[#075B8A] dark:text-[#38BDF8]">{userName}</span>
            </h1>
            {/* Dynamic Data Mode Status Indicator (LIVE vs DEMO) */}
            <DataStatusIndicator sourceHint="IMD & Open-Meteo" />
          </div>
          <p className="text-xs sm:text-sm text-[#708696] dark:text-slate-400 mt-1 font-medium">
            {t('home.greeting_sub', "Here's the latest weather and hazard overview for your area.")}
          </p>
        </div>

        {/* Location Selector Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Saved Location Chips */}
          {savedLocations.length > 0 && (
            <div className="hidden xl:flex items-center gap-1.5 bg-white dark:bg-[#071828] p-1 rounded-full border border-[#DCEBED] dark:border-[#1E3347] shadow-xs">
              <Bookmark className="w-3.5 h-3.5 text-[#075B8A] dark:text-[#38BDF8] ml-2 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-[#708696] dark:text-slate-400 uppercase mr-1">
                Saved:
              </span>
              {savedLocations.slice(0, 3).map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => selectLocationItem(loc)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedLocation?.id === loc.id
                      ? 'bg-[#075B8A] text-white font-bold shadow-xs'
                      : 'text-[#18364A] dark:text-slate-300 hover:bg-[#F4F8FA] dark:hover:bg-[#0D2235]'
                  }`}
                >
                  {loc.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* Main Location Dropdown / Modal Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsLocationModalOpen(!isLocationModalOpen)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-[#071828] hover:bg-[#F4F8FA] dark:hover:bg-[#0D2235] border border-[#DCEBED] dark:border-[#1E3347] text-xs font-bold text-[#18364A] dark:text-slate-100 shadow-card transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#E94B68] shrink-0" />
              <div className="text-left">
                <span className="text-[#075B8A] dark:text-[#38BDF8]">
                  {isGpsActive ? '📍 Current GPS: ' : ''}
                  {selectedLocation?.name || weather.cityName}, {selectedState?.id || 'IN'}
                </span>
                <span className="text-[11px] text-[#708696] dark:text-slate-400 font-mono ml-2 font-normal">
                  ({weather.temp}°C)
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#708696] dark:text-slate-400" />
            </button>

            {/* Location Selector Modal Dropdown */}
            {isLocationModalOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#071828] rounded-[24px] shadow-float border border-[#DCEBED] dark:border-[#1E3347] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCEBED] dark:border-[#1E3347]">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#075B8A] dark:text-[#38BDF8]">
                    {t('nav.select_location', 'Select Command Location')}
                  </h4>
                  <span className="text-[10px] text-[#708696] dark:text-slate-400 font-mono">
                    36 States / UTs
                  </span>
                </div>

                {/* Friendly Geolocation Error Banner if permission denied */}
                {locationError && (
                  <div className="my-2 p-2.5 bg-[#FFF2F4] dark:bg-red-950/40 border border-[#FFD3DA] dark:border-red-900 rounded-xl text-xs text-[#18364A] dark:text-red-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#E94B68]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{locationError.message}</span>
                      </div>
                      <button
                        onClick={clearLocationError}
                        className="text-[#708696] dark:text-slate-400 hover:text-[#18364A] dark:hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10.5px] text-[#708696] dark:text-slate-400 leading-tight">
                      {locationError.friendlyAdvice}
                    </p>
                  </div>
                )}

                {/* 1. Live Current Location Button */}
                <div className="py-3 border-b border-[#DCEBED] dark:border-[#1E3347]">
                  <button
                    onClick={handleUseCurrentGPS}
                    disabled={isLoadingLocation}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isGpsActive
                        ? 'bg-[#EDFAFC] dark:bg-[#06243A] text-[#075B8A] dark:text-[#38BDF8] border border-[#AEEBF0] dark:border-[#0E4A70]'
                        : 'bg-[#075B8A] hover:bg-[#0B6E9E] text-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Navigation className={`w-4 h-4 text-[#18C3D0] ${isLoadingLocation ? 'animate-spin' : ''}`} />
                      <span>{isLoadingLocation ? 'Acquiring GPS Signal...' : isGpsActive ? 'Using Real GPS Coordinates' : 'Use Current Device Location'}</span>
                    </div>
                    {isGpsActive && <Check className="w-4 h-4 text-[#18C3D0]" />}
                  </button>
                </div>

                {/* 2. Search Box */}
                <div className="py-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#708696] dark:text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Indian city, district, or state..."
                      className="w-full pl-9 pr-3 py-2 bg-[#F4F8FA] dark:bg-[#0B1E30] border border-[#DCEBED] dark:border-[#1E3347] rounded-full text-xs text-[#18364A] dark:text-slate-100 placeholder:text-[#708696] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#18C3D0]"
                    />
                  </div>
                </div>

                {/* 3. Saved Locations Quick Select */}
                {savedLocations.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[10px] font-mono font-bold text-[#708696] dark:text-slate-400 uppercase px-1">
                      Saved Locations
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {savedLocations.map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => {
                            selectLocationItem(loc);
                            setIsLocationModalOpen(false);
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            selectedLocation?.id === loc.id
                              ? 'bg-[#075B8A] text-white border-[#075B8A] font-bold'
                              : 'bg-[#F4F8FA] dark:bg-[#0B1E30] text-[#18364A] dark:text-slate-300 border-[#DCEBED] dark:border-[#1E3347] hover:bg-[#EEF5F8] dark:hover:bg-[#132C45]'
                          }`}
                        >
                          {loc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Cities List */}
                <div className="max-h-48 overflow-y-auto divide-y divide-[#F4F8FA] dark:divide-[#1E3347] pr-1">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-xl hover:bg-[#F4F8FA] dark:hover:bg-[#0B1E30] transition-colors cursor-pointer ${
                        selectedLocation?.id === city.id
                          ? 'bg-[#EDFAFC] dark:bg-[#06243A] font-bold text-[#075B8A] dark:text-[#38BDF8]'
                          : 'text-[#18364A] dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-[#18364A] dark:text-slate-100">{city.name}</div>
                        <div className="text-[10px] text-[#708696] dark:text-slate-400">{city.district}, {city.stateName}</div>
                      </div>
                      <span className="font-mono text-xs text-[#075B8A] dark:text-[#38BDF8] bg-[#EEF5F8] dark:bg-[#0B1E30] px-2 py-0.5 rounded-full">
                        {city.weatherSnippet?.split('•')[0] || '29°C'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
