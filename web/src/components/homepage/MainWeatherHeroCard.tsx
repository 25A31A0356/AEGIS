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
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { DataStatusIndicator } from '../common/DataStatusIndicator';

export const MainWeatherHeroCard: React.FC = () => {
  const { weather, selectedState } = useLocation();

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
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A7D7E8]">
            {weather.cityName}, {selectedState?.name || 'India'}
          </span>
          <span className="text-white/40">•</span>
          <span className="text-[11px] font-mono text-[#D3E8F4]">
            {weather.coordinates ? `[${weather.coordinates[0].toFixed(2)}°N, ${weather.coordinates[1].toFixed(2)}°E]` : ''}
          </span>
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
          <p className="text-sm sm:text-base font-semibold text-[#EDFAFC] pt-2 leading-relaxed">
            {weather.condition.includes('Thunderstorm') || weather.condition.includes('Rain')
              ? 'Thunderstorms likely with heavy rain in the evening'
              : weather.condition}
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
