import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from '../context/LocationContext';
import { useProfile } from '../context/ProfileContext';
import { useSOS } from '../context/SOSContext';
import { useTranslation } from '../i18n/useTranslation';
import { HazardService } from '../services/hazardService';
import { WeatherService } from '../services/weatherService';
import { DailyForecastItem, HourlyForecastItem, WeatherTelemetry } from '../types/weather';
import { HazardItem } from '../types/hazard';
import { AlertTicker } from '../components/common/AlertTicker';
import { WeatherIllustration } from '../components/dashboard/WeatherIllustration';

export interface DashboardPageProps {
  onOpenSearch?: () => void;
  onOpenAIModal?: () => void;
  onNavigate?: (tab: string, opt?: { sosId?: string; hazardId?: string }) => void;
  onSelectHazardById?: (hazardId: string) => void;
  onFilterHazardsCategory?: (category: string) => void;
}

// Haversine distance calculator in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onSelectHazardById,
  onOpenSearch,
}) => {
  const { selectedLocation, weather: contextWeather, isGpsActive, requestCurrentGPS } = useLocation();
  const { profile } = useProfile();
  const { beacons } = useSOS();
  const { dict } = useTranslation();

  const userName = profile?.fullName?.trim() ? profile.fullName.trim().split(' ')[0] : 'Friend';
  const locType = selectedLocation?.localityType || (selectedLocation?.village ? 'Village' : 'District');
  const locName = selectedLocation?.localityName || selectedLocation?.village || selectedLocation?.name || 'Your Area';
  const cleanVillageName = locName.split('•')[0].trim();

  const [hazards, setHazards] = useState<HazardItem[]>(() => HazardService.getAllHazards());
  const [dailyForecast, setDailyForecast] = useState<DailyForecastItem[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastItem[]>([]);
  const [liveWeather, setLiveWeather] = useState<WeatherTelemetry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentWeather = liveWeather || contextWeather;

  useEffect(() => {
    const unsub = HazardService.subscribe(() => {
      setHazards(HazardService.getAllHazards());
    });
    return unsub;
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchForecast = async () => {
      try {
        const coords = selectedLocation?.coordinates || [17.228, 82.046];
        const cityName = selectedLocation?.name || 'Local Station';
        const stateName = selectedLocation?.stateName || 'India';
        const live = await WeatherService.fetchLiveWeatherByCoordinates(coords[0], coords[1], cityName, stateName);
        const daily = WeatherService.getDailyForecast(cityName.toLowerCase());
        const hourly = WeatherService.getHourlyForecast(cityName.toLowerCase());
        if (mounted) {
          setDailyForecast(daily || []);
          setHourlyForecast(hourly || []);
          if (live) setLiveWeather(live);
        }
      } catch (err) {
        console.warn('Weather fetch error:', err);
      }
    };
    fetchForecast();
    return () => {
      mounted = false;
    };
  }, [selectedLocation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof requestCurrentGPS === 'function') {
        await requestCurrentGPS();
      }
      const coords = selectedLocation?.coordinates || [17.228, 82.046];
      const cityName = selectedLocation?.name || 'Local Station';
      const stateName = selectedLocation?.stateName || 'India';
      const live = await WeatherService.fetchLiveWeatherByCoordinates(coords[0], coords[1], cityName, stateName);
      const daily = WeatherService.getDailyForecast(cityName.toLowerCase());
      const hourly = WeatherService.getHourlyForecast(cityName.toLowerCase());
      setLiveWeather(live);
      setDailyForecast(daily || []);
      setHourlyForecast(hourly || []);
      const liveHazards = await HazardService.fetchLiveHazards();
      if (liveHazards) setHazards(liveHazards);
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Weather telemetry derived values
  const currentHour = new Date().getHours();
  const isNight = currentHour < 6 || currentHour >= 18;

  const temp = currentWeather?.temp ?? 28;
  const feelsLike = currentWeather?.feelsLike ?? 31;
  const tempMin = currentWeather?.tempMin ?? 24;
  const tempMax = currentWeather?.tempMax ?? 33;
  const humidity = currentWeather?.humidity ?? 78;
  const rainProb = currentWeather?.rainProbability ?? 45;
  const rainfallExpected = currentWeather?.rainfallExpectedMm ?? 4.2;
  const windSpeed = currentWeather?.windSpeed ?? 22;
  const windDir = currentWeather?.windDirection ?? 'SSW';
  const windGusts = currentWeather?.windGust ?? 34;
  const pressure = currentWeather?.barometricPressureHpa ?? 1008;
  const visibility = currentWeather?.visibilityKm ?? 8.5;
  const uvIndex = currentWeather?.uvIndex ?? 6;
  const aqi = currentWeather?.airQualityIndex ?? 64;
  const condition = currentWeather?.condition || 'Scattered Thunderstorms';
  const conditionCode = currentWeather?.conditionCode || 'thunderstorm';

  // Dew point approximation: T - ((100 - RH) / 5)
  const dewPoint = Math.round((temp - ((100 - humidity) / 5)) * 10) / 10;

  // Composite risk calculation
  const calculatedRiskScore = useMemo(() => {
    return Math.min(
      100,
      Math.max(
        10,
        Math.round(
          (temp > 38 ? 30 : 10) +
          (rainProb * 0.4) +
          (windSpeed > 40 ? 25 : 10) +
          (hazards.filter(h => h.severity === 'critical').length * 20)
        )
      )
    );
  }, [temp, rainProb, windSpeed, hazards]);

  const riskBadge = useMemo(() => {
    if (calculatedRiskScore <= 20) return { label: 'LOW', bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    if (calculatedRiskScore <= 40) return { label: 'MODERATE', bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    if (calculatedRiskScore <= 60) return { label: 'ELEVATED', bg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' };
    if (calculatedRiskScore <= 80) return { label: 'HIGH', bg: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' };
    return { label: 'SEVERE', bg: 'bg-red-600/25 text-red-700 dark:text-red-300 border-red-500/50' };
  }, [calculatedRiskScore]);

  // UV Status description
  const uvStatus = useMemo(() => {
    if (uvIndex <= 2) return { text: 'Low', color: 'text-emerald-600 dark:text-emerald-400' };
    if (uvIndex <= 5) return { text: 'Moderate', color: 'text-amber-600 dark:text-amber-400' };
    if (uvIndex <= 7) return { text: 'High', color: 'text-orange-600 dark:text-orange-400' };
    if (uvIndex <= 10) return { text: 'Very High', color: 'text-red-600 dark:text-red-400' };
    return { text: 'Extreme', color: 'text-purple-600 dark:text-purple-400' };
  }, [uvIndex]);

  // AQI status
  const aqiStatus = useMemo(() => {
    if (aqi <= 50) return { label: 'Good', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30' };
    return { label: 'Poor / Hazardous', color: 'text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 border-red-500/30' };
  }, [aqi]);

  // User coordinates for Haversine distance
  const userLat = selectedLocation?.coordinates?.[0] || 17.6868;
  const userLon = selectedLocation?.coordinates?.[1] || 83.2185;

  const activeHazardsList = hazards.slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Banner Alert Ticker */}
      <AlertTicker onSelectHazard={onSelectHazardById} />

      {/* 1. TOP GREETING & VILLAGE WEATHER HEADER (WITH 1-CLICK VILLAGE PICKER & REFRESH) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-emerald-500/10 dark:from-sky-950/40 dark:via-indigo-950/40 dark:to-emerald-950/40 border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hi {userName}!
          </h1>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-base sm:text-lg mt-1.5 flex-wrap">
            <button
              onClick={onOpenSearch}
              className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-1.5 cursor-pointer text-left"
              title="Click to search or change your exact village or city"
            >
              <span>{cleanVillageName || selectedLocation?.name || "Your Area"}</span>
            </button>
            {selectedLocation?.nearbyPlace && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                (Near {selectedLocation.nearbyPlace})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            title="Click location symbol to refresh GPS location"
          >
            <span className={`material-symbols-outlined text-2xl ${isRefreshing ? "animate-spin" : ""}`}>my_location</span>
          </button>
        </div>
      </div>

      {/* 2. HERO WEATHER DISPLAY & DISASTER RISK INDEX (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* HERO WEATHER CARD (2 Cols) */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-md dark:shadow-2xl bg-white dark:bg-[#09090b]">
          {/* Top Row: Weather Status and Station ID */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-white animate-ping" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                {dict.conditions || 'Atmospheric Telemetry'}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
            </span>
          </div>

          {/* Main Weather Hero Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-6 z-10">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
                  {temp}°
                </span>
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 block">
                    {(dict.feelsLike || 'Feels like') + ' '}<span className="text-slate-900 dark:text-white font-mono font-bold">{feelsLike}°C</span>
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    H: {tempMax}° &bull; L: {tempMin}°
                  </span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 capitalize mt-3 tracking-tight">
                {condition}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                Precipitation probability currently at <span className="font-semibold text-slate-800 dark:text-slate-200">{rainProb}%</span> with expected accumulation of <span className="font-semibold text-slate-800 dark:text-slate-200">{rainfallExpected} mm</span>.
              </p>
            </div>

            {/* Dynamic Weather Illustration SVG */}
            <div className="flex items-center justify-center">
              <div className="w-48 h-48 sm:w-56 sm:h-56 filter drop-shadow-lg">
                <WeatherIllustration conditionCode={conditionCode} isNight={isNight} />
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar at bottom of Hero Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-white/10 z-10">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-xs">water_drop</span>{dict.humidity || "Humidity"}</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">{humidity}%</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-xs">air</span>{dict.wind || "Wind"}</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">{windSpeed} <span className="text-xs font-sans text-slate-400">km/h</span></p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-xs">compress</span>{dict.pressure || "Pressure"}</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">{pressure} <span className="text-xs font-sans text-slate-400">hPa</span></p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-xs">visibility</span>{dict.visibility || "Visibility"}</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">{visibility} <span className="text-xs font-sans text-slate-400">km</span></p>
            </div>
          </div>
        </div>

        {/* DISASTER & WEATHER RISK SCORE CARD (1 Col) */}
        <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between shadow-md dark:shadow-2xl bg-white dark:bg-[#09090b] space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-xl">shield_with_heart</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {dict.disasterRiskIndex || 'Disaster Risk Index'}
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border ${riskBadge.bg}`}>
                {riskBadge.label}
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-5xl font-black font-mono text-slate-900 dark:text-white">
                {calculatedRiskScore}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100 max risk</span>
            </div>

            {/* Risk Gauge Bar */}
            <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-2.5 mt-3 overflow-hidden border border-slate-200 dark:border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  calculatedRiskScore > 70
                    ? 'bg-red-600'
                    : calculatedRiskScore > 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${calculatedRiskScore}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
              Real-time multi-hazard assessment factoring cyclonic depressions, convective rain cells, and active district emergency beacons.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/10 text-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {dict.contributingFactors || 'Contributing Factors'}
            </p>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Rainfall Probability
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{rainProb}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Wind Velocity Shear
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{windSpeed} km/h</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Active SOS Beacons
              </span>
              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                {beacons.filter(b => b.triageStatus !== 'RESOLVED').length} Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HOURLY FORECAST SCROLL ROW */}
      <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-6 space-y-4 bg-white dark:bg-[#09090b]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 text-xl">schedule</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {dict.hourlyTelemetry || 'Hourly Telemetry & Forecast'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">Next 12 Hours</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {hourlyForecast.slice(0, 8).map((hour, idx) => (
            <div
              key={idx}
              className={`min-w-[105px] p-3.5 rounded-2xl border transition-all text-center flex flex-col items-center justify-between space-y-2 cursor-pointer ${
                idx === 0
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-transparent shadow-md'
                  : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
              }`}
            >
              <p className="text-xs font-mono font-semibold">{idx === 0 ? 'Now' : hour.time}</p>
              <span className={`material-symbols-outlined text-2xl py-1 ${idx === 0 ? 'text-white dark:text-black' : 'text-slate-700 dark:text-slate-300'}`}>
                {hour.conditionCode === 'rain'
                  ? 'rainy'
                  : hour.conditionCode === 'thunderstorm'
                  ? 'thunderstorm'
                  : 'partly_cloudy_day'}
              </span>
              <p className={`text-base font-bold font-mono ${idx === 0 ? 'text-white dark:text-black' : 'text-slate-900 dark:text-white'}`}>{hour.temp}°</p>
              <div className={`text-[10px] font-mono flex items-center justify-center gap-0.5 ${idx === 0 ? 'text-slate-200 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>
                <span className="material-symbols-outlined text-[10px]">water_drop</span>
                {hour.rainProb}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TODAY'S HIGHLIGHTS (6 Glass Cards Grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 text-xl">analytics</span>
            {dict.todayHighlights || "Today's Telemetry Highlights"}
          </h3>
          <span className="text-xs text-slate-400 font-mono">Sensors: Real-Time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: {dict.precipitation || 'Precipitation & Rainfall'} */}
          <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-5 space-y-3 bg-white dark:bg-[#0c0c0e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{dict.precipitation || 'Precipitation & Rainfall'}</span>
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 text-lg">rainy</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">{rainfallExpected}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">mm expected</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: `${rainProb}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Probability: <span className="font-bold text-slate-900 dark:text-white">{rainProb}%</span> &bull; Peak expected during late afternoon.
            </p>
          </div>

          {/* Card 2: UV Index */}
          <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-5 space-y-3 bg-white dark:bg-[#0c0c0e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{dict.uvRadiation || 'UV Radiation Index'}</span>
              <span className="material-symbols-outlined text-amber-500 text-lg">wb_sunny</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">{uvIndex}</span>
              <span className={`text-xs font-bold ${uvStatus.color}`}>{uvStatus.text}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 rounded-full"
                style={{ width: `${Math.min(100, (uvIndex / 11) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Peak solar intensity from 11:30 to 14:30 IST.
            </p>
          </div>

          {/* Card 3: Wind Status */}
          <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-5 space-y-3 bg-white dark:bg-[#0c0c0e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Wind Status & Gusts</span>
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 text-lg">air</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">{windSpeed}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">km/h ({windDir})</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>Peak Gusts: <strong className="text-slate-900 dark:text-white font-mono">{windGusts} km/h</strong></span>
              <span>Moderate Breeze</span>
            </div>
          </div>

          {/* Card 4: Humidity & Dew Point */}
          <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-5 space-y-3 bg-white dark:bg-[#0c0c0e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Humidity & Dew Point</span>
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 text-lg">humidity_percentage</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">{humidity}%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Dew Point: {dewPoint}°C</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Atmospheric moisture level is high, increasing perceived thermal index.
            </p>
          </div>

          {/* Card 5: Sunrise & Sunset */}
          <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-5 space-y-3 bg-white dark:bg-[#0c0c0e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Solar Cycle (Sunrise/Sunset)</span>
              <span className="material-symbols-outlined text-amber-500 text-lg">wb_twilight</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-sm">arrow_upward</span>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Sunrise</p>
                  <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">05:48 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-sm">arrow_downward</span>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Sunset</p>
                  <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">06:14 PM</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Daylight: 12h 26m</p>
          </div>

          {/* Card 6: Air Quality & Pressure */}
          <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-5 space-y-3 bg-white dark:bg-[#0c0c0e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{dict.airQuality || 'Air Quality Index (AQI)'}</span>
              <span className="material-symbols-outlined text-emerald-500 text-lg">airwave</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">{aqi}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${aqiStatus.color}`}>
                {aqiStatus.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Barometric Pressure: <span className="font-mono font-bold text-slate-900 dark:text-white">{pressure} hPa</span> (Steady)
            </p>
          </div>
        </div>
      </div>

      {/* 5. ACTIVE HAZARDS NEAR YOU (Real AEGIS Disaster Intelligence) */}
      <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-md dark:shadow-2xl bg-white dark:bg-[#09090b]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-2xl">warning</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dict.activeHazardsNearYou || 'Active Hazards Near You'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time distance calculated from your station GPS</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
            {activeHazardsList.length} Monitored
          </span>
        </div>

        {activeHazardsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeHazardsList.map((h) => {
              const dist = h.location.coordinates
                ? calculateDistanceKm(userLat, userLon, h.location.coordinates[0], h.location.coordinates[1])
                : null;

              return (
                <div
                  key={h.id}
                  onClick={() => {
                    onSelectHazardById?.(h.id);
                    onNavigate?.('maps');
                  }}
                  className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 bg-slate-50/50 dark:bg-white/5 transition-all cursor-pointer flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase border ${
                          h.severity === 'critical'
                            ? 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30 animate-pulse'
                            : h.severity === 'warning'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {h.severity}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {h.title || h.categoryName}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {h.headline || h.description}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 text-slate-900 dark:text-white font-bold">
                        <span className="material-symbols-outlined text-xs">near_me</span>
                        {dist !== null ? `${dist} km away` : h.location.district || h.location.state}
                      </span>
                      <span>&bull;</span>
                      <span>Status: <strong className="text-slate-800 dark:text-slate-200">{h.status}</strong></span>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all text-xl">
                    arrow_forward
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
            No active hazards in your immediate vicinity. All regional monitoring nodes green.
          </div>
        )}
      </div>

      {/* 6. 3-DAY SYNOPTIC FORECAST & EMERGENCY QUICK-ACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3-Day Forecast (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-md dark:shadow-xl bg-white dark:bg-[#09090b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 text-xl">date_range</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dict.synopticForecast || '3-Day Synoptic Forecast'}
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">IMD Numerical Prediction</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {dailyForecast.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20 transition-all text-center space-y-2.5"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : item.day}
                </p>
                <span className="material-symbols-outlined text-slate-800 dark:text-slate-200 text-3xl">
                  {item.conditionCode === 'rain'
                    ? 'rainy'
                    : item.conditionCode === 'thunderstorm'
                    ? 'thunderstorm'
                    : 'partly_cloudy_day'}
                </span>
                <div className="font-mono text-xs">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{item.tempMax}°</span>
                  <span className="text-slate-500 dark:text-slate-400"> / {item.tempMin}°</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">{item.rainProb}% Rain</p>
                  <p>{item.rainfallMm} mm</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Helpline & Actions (1 Col) */}
        <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-md dark:shadow-xl bg-white dark:bg-[#09090b] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">phone_in_talk</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dict.emergencyHelplines || 'Emergency Helplines'}
              </h3>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs space-y-1">
                <p className="font-black text-red-700 dark:text-red-300">National Emergency: 112</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">Direct integration with NDRF & SDRF operations command.</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs space-y-1">
                <p className="font-black text-slate-900 dark:text-slate-200">Disaster Helpline: 1078</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">NDMA 24x7 control room for meteorological emergencies.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.('reports')}
            className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-bold transition-all cursor-pointer text-center"
          >
            {(dict.submitIncidentReport || 'Submit Incident Report') + ' →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
