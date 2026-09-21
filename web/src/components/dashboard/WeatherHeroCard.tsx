import React from 'react';
import {
  CloudRain,
  Wind,
  Sun,
  Gauge,
  RefreshCw,
  Activity,
  Zap,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export const WeatherHeroCard: React.FC = () => {
  const { weather } = useLocation();

  const getAQIBadge = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (aqi <= 100) return { label: 'Moderate', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: 'Severe', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  const aqiBadge = getAQIBadge(weather.airQualityIndex);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 lg:p-6 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 font-mono tracking-tight uppercase">
            METEOROLOGICAL TELEMETRY • {weather.cityName.toUpperCase()}, {weather.stateName.toUpperCase()}
          </span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            (LAT {weather.coordinates[0]}°N, LON {weather.coordinates[1]}°E)
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span>Synced: Today, 21:00 IST (IMD AWS-04)</span>
        </div>
      </div>

      {/* Primary Data Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Temperature & Main Condition */}
        <div className="lg:col-span-4 flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-900 text-sky-400 shadow-md flex items-center justify-center shrink-0">
            {weather.conditionCode === 'thunderstorm' ? (
              <Zap className="w-8 h-8 text-amber-400 animate-bounce" />
            ) : weather.conditionCode === 'heavy_rain' ? (
              <CloudRain className="w-8 h-8 text-sky-400" />
            ) : (
              <Sun className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-extrabold text-slate-900 font-mono tracking-tight">
                {weather.temp}°
              </span>
              <span className="text-sm font-semibold text-slate-500">C</span>
              <span className="text-xs font-medium text-slate-400 ml-1">
                Feels like {weather.feelsLike}°C
              </span>
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1 leading-snug">
              {weather.condition}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Low {weather.tempMin}°C • High {weather.tempMax}°C
            </div>
          </div>
        </div>

        {/* Center & Right: High-Density Meteorological Sensors */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Precipitation Risk */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1 font-mono">
              <span>PRECIP CHANCE</span>
              <CloudRain className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {weather.rainProbability}%
            </div>
            <div className="text-[10px] text-slate-500">Exp: {weather.rainfallExpectedMm} mm</div>
          </div>

          {/* Wind Vectors */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1 font-mono">
              <span>WIND SPEED</span>
              <Wind className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {weather.windSpeed} <span className="text-xs font-sans text-slate-500">km/h</span>
            </div>
            <div className="text-[10px] text-slate-500">Dir: {weather.windDirection} • Gust {weather.windGust} km/h</div>
          </div>

          {/* Air Quality (AQI) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1 font-mono">
              <span>AIR QUALITY</span>
              <Activity className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-slate-900 font-mono">
                {weather.airQualityIndex}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${aqiBadge.color}`}>
                {aqiBadge.label}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">PM2.5 Primary</div>
          </div>

          {/* Humidity & Pressure */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1 font-mono">
              <span>BAROMETER / HUM</span>
              <Gauge className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {weather.humidity}%
            </div>
            <div className="text-[10px] text-slate-500">{weather.barometricPressureHpa} hPa • Dew {weather.dewPointCelsius}°C</div>
          </div>
        </div>
      </div>
    </div>
  );
};
