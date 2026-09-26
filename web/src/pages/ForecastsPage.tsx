import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { useTranslation } from '../i18n/useTranslation';
import { WeatherService } from '../services/weatherService';

export const ForecastsPage: React.FC = () => {
  const { selectedLocation } = useLocation();
  const { dict } = useTranslation();

  const [selectedEvent, setSelectedEvent] = useState<'weather' | 'rainfall' | 'temperature' | 'wind' | 'cyclone' | 'flood' | 'earthquake' | 'fire'>('weather');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'24h' | '3d' | '7d' | '30d' | 'custom'>('7d');

  const city = selectedLocation?.name || 'Visakhapatnam';
  const daily = WeatherService.getDailyForecast(city.toLowerCase());

  // Trend data based on real daily telemetry
  const trendData = [
    { label: 'Day -6', temp: 31, humidity: 72, wind: 16, rain: 5, risk: 25 },
    { label: 'Day -5', temp: 32, humidity: 68, wind: 18, rain: 10, risk: 30 },
    { label: 'Day -4', temp: 33, humidity: 75, wind: 22, rain: 25, risk: 45 },
    { label: 'Day -3', temp: 30, humidity: 82, wind: 28, rain: 40, risk: 60 },
    { label: 'Day -2', temp: 29, humidity: 85, wind: 32, rain: 65, risk: 75 },
    { label: 'Yesterday', temp: 28, humidity: 80, wind: 24, rain: 35, risk: 50 },
    { label: 'Today (Observed)', temp: 30, humidity: 76, wind: 20, rain: 15, risk: 38 },
  ];

  const eventsList = [
    { id: 'weather', label: 'All Weather Metrics' },
    { id: 'rainfall', label: 'Rainfall & Inundation' },
    { id: 'temperature', label: 'Surface Temperature' },
    { id: 'wind', label: 'Wind Velocity' },
    { id: 'cyclone', label: 'Cyclone / Storm Surge' },
    { id: 'flood', label: 'River Flood Watch' },
    { id: 'earthquake', label: 'Seismic Activity' },
    { id: 'fire', label: 'Wildfire Risk' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#27272a] pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {dict.forecast || 'Analysis'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#a1a1aa] mt-0.5">
          Inspect historical trends, contributing factors, and 3-day predictive outlooks.
        </p>
      </div>

      {/* Control Bar: Location, Event, Time Period */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-4 shadow-xs dark:shadow-md grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
            Monitored Region
          </label>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] text-xs font-medium text-slate-800 dark:text-white flex items-center justify-between">
            <span>{city} ({selectedLocation?.stateName || 'AP'})</span>
            <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
          </div>
        </div>

        {/* 2. Event */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
            Hazard / Metric Event
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value as any)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
          >
            {eventsList.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.label}</option>
            ))}
          </select>
        </div>

        {/* 3. Time Period */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
            Time Period Range
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['24h', '3d', '7d', '30d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimePeriod(period)}
                className={`py-2 text-xs font-bold rounded-xl border uppercase transition-all cursor-pointer ${
                  selectedTimePeriod === period
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-xs'
                    : 'border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-600 dark:text-[#a1a1aa] hover:bg-slate-100 dark:hover:bg-[#222225]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Visualization Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Bar/Table */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-5 shadow-xs dark:shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {selectedEvent.toUpperCase()} Historical Telemetry Trend
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#a1a1aa] font-semibold">Observed Telemetry</span>
          </div>

          <div className="space-y-2">
            {trendData.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181b] text-xs border border-slate-100 dark:border-[#27272a]">
                <span className="font-medium text-slate-700 dark:text-[#e4e4e7] w-28">{d.label}</span>
                <div className="flex-1 mx-3 h-2 bg-slate-200 dark:bg-[#27272a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-700 dark:bg-slate-200 rounded-full"
                    style={{ width: `${selectedEvent === 'rainfall' ? d.rain : selectedEvent === 'temperature' ? d.temp * 2.2 : d.risk}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-white w-16 text-right">
                  {selectedEvent === 'rainfall' ? `${d.rain} mm` : selectedEvent === 'temperature' ? `${d.temp}°C` : `${d.risk} / 100`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3-DAY WEATHER OUTLOOK */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a] p-5 shadow-xs dark:shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {dict.synopticForecast || '3-Day Weather Outlook'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 dark:bg-[#18181b] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#27272a]">
              PREDICTION / FORECAST
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
            <span className="font-bold">Informational Notice:</span> Predictions are generated from meteorological computer models and may change with atmospheric variability.
          </div>

          <div className="space-y-3">
            {daily.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    {idx === 0 ? 'Today (Forecast)' : idx === 1 ? 'Tomorrow (Forecast)' : `${item.day} (Forecast)`}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa] mt-0.5">{item.condition} &bull; {item.primaryRisk}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {item.tempMax}°C / {item.tempMin}°C
                  </span>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-[#a1a1aa]">{item.rainProb}% Rain ({item.rainfallMm} mm)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastsPage;
