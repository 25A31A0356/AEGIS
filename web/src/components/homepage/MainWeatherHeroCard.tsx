import React from 'react';
import {
  CloudLightning,
  CloudRain,
  Sun,
  Cloud,
  Wind,
  Droplets,
  Gauge,
  Eye,
  SunMedium,
  Umbrella,
  ArrowUp,
  ArrowDown,
  Volume2,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useProfile } from '../../context/ProfileContext';
import { DataStatusIndicator } from '../common/DataStatusIndicator';

export const MainWeatherHeroCard: React.FC = () => {
  const { weather, selectedLocation, selectedState, isGpsActive, speakLocation } = useLocation();
  const { profile } = useProfile();
  const userName = profile?.fullName?.trim() ? profile.fullName.trim().split(' ')[0] : 'Friend';
  const locType = selectedLocation?.localityType || (selectedLocation?.village ? 'Village' : (selectedLocation?.isVillageLevel ? 'Village' : 'District'));
  const locName = selectedLocation?.localityName || selectedLocation?.village || selectedLocation?.name || weather.cityName || 'Local Area';
  const cleanLocName = locName
    .replace(/^(Village|Town|City|Locality|District):?\s*/i, '')
    .replace(/^Rural Sector\s*•\s*/i, '')
    .split('•')[0]
    .split('(')[0]
    .trim();
  const nearbyPlace = selectedLocation?.nearbyPlace || selectedLocation?.subdistrict;
  const locEmoji = locType === 'Village' ? '🏡' : locType === 'Town' ? '🏘️' : locType === 'City' ? '🏙️' : '📍';

  const getWeatherIcon = (code: string) => {
    switch (code) {
      case 'thunderstorm':
      case 'cyclonic':
        return <CloudLightning className="w-16 h-16 text-[#18C3D0] animate-pulse" />;
      case 'rain':
      case 'heavy_rain':
        return <CloudRain className="w-16 h-16 text-[#18C3D0]" />;
      case 'sunny':
      case 'heatwave':
        return <Sun className="w-16 h-16 text-[#F4C84A]" />;
      default:
        return <Cloud className="w-16 h-16 text-[#A7D7E8]" />;
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#075B8A] via-[#0B6E9E] to-[#054366] text-white rounded-[24px] p-6 sm:p-8 shadow-elevated border border-white/10 flex flex-col justify-between">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#18C3D0]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#E94B68]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar: Location Tag & Data Source Badge */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-white/10 relative z-10 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            Hi {userName}! 👋 &bull; {locEmoji} {locType}: <span className="underline decoration-[#18C3D0] underline-offset-4 font-extrabold">{cleanLocName}</span>
          </span>
          {nearbyPlace && (
            <span className="text-xs text-[#D3E8F4] bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
              Near {nearbyPlace}
            </span>
          )}
          <button
            onClick={() => speakLocation()}
            className="flex items-center gap-1 px-2.5 py-0.5 bg-[#18C3D0]/20 hover:bg-[#18C3D0]/40 text-[#EDFAFC] hover:text-white rounded-full text-xs font-semibold border border-[#18C3D0]/40 transition-all cursor-pointer"
            title="Hear exact location and weather spoken out"
            aria-label="Speak exact location"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#18C3D0]" />
            <span>Say Location</span>
          </button>
        </div>

        {/* Dynamic Source & Mode Badge */}
        <DataStatusIndicator compact />
      </div>

      {/* Main Weather Display Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-2 relative z-10">
        {/* Left Side: Temperature, High/Low, Feels Like */}
        <div className="md:col-span-7 space-y-1">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white font-sans">
              {weather.temp}°C
            </span>
            <div className="flex flex-col text-xs sm:text-sm text-[#D3E8F4] font-medium">
              <span className="font-semibold text-white">
                Feels like {weather.feelsLike}°C
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#A7D7E8] mt-0.5">
                <span className="flex items-center gap-0.5">
                  <ArrowUp className="w-3 h-3 text-[#F4C84A]" />
                  High {weather.tempMax}°C
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <ArrowDown className="w-3 h-3 text-[#18C3D0]" />
                  Low {weather.tempMin}°C
                </span>
              </div>
            </div>
          </div>

          {/* Condition Headline */}
          <p className="text-sm sm:text-base font-bold text-[#EDFAFC] pt-2 leading-relaxed flex items-center gap-2">
            <span>{weather.condition}</span>
            {weather.rainfallExpectedMm > 0 && (
              <span className="text-xs font-mono font-normal bg-white/20 px-2 py-0.5 rounded-full border border-white/25">
                {weather.rainfallExpectedMm} mm ({weather.rainProbability}%)
              </span>
            )}
          </p>
        </div>

        {/* Right Side: Large Weather Graphic */}
        <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-3">
          <div className="p-4 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
            {getWeatherIcon(weather.conditionCode)}
          </div>
        </div>
      </div>

      {/* Six Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 mt-4 border-t border-white/10 relative z-10">
        {/* 1. Humidity */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7D7E8] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              HUMIDITY
            </span>
            <Droplets className="w-3.5 h-3.5 text-[#18C3D0]" />
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono">
            {weather.humidity}%
          </div>
        </div>

        {/* 2. Wind */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7D7E8] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              WIND
            </span>
            <Wind className="w-3.5 h-3.5 text-[#18C3D0]" />
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono truncate">
            {weather.windSpeed} km/h
          </div>
        </div>

        {/* 3. Rain */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7D7E8] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              RAIN
            </span>
            <Umbrella className="w-3.5 h-3.5 text-[#18C3D0]" />
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono">
            {weather.rainProbability}%
          </div>
        </div>

        {/* 4. UV Index */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7D7E8] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              UV INDEX
            </span>
            <SunMedium className="w-3.5 h-3.5 text-[#F4C84A]" />
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono">
            {weather.uvIndex} <span className="text-xs font-normal text-[#A7D7E8]">({weather.uvStatus})</span>
          </div>
        </div>

        {/* 5. Pressure */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7D7E8] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              PRESSURE
            </span>
            <Gauge className="w-3.5 h-3.5 text-[#18C3D0]" />
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono truncate">
            {weather.barometricPressureHpa} mb
          </div>
        </div>

        {/* 6. Visibility */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7D7E8] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              VISIBILITY
            </span>
            <Eye className="w-3.5 h-3.5 text-[#18C3D0]" />
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono">
            {weather.visibilityKm} km
          </div>
        </div>
      </div>
    </div>
  );
};
