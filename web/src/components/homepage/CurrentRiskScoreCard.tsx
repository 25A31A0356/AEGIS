import React from 'react';
import { useLocation } from '../../context/LocationContext';
import { useTranslation } from '../../i18n/useTranslation';

export const CurrentRiskScoreCard: React.FC = () => {
  const { weather } = useLocation();
  const { t } = useTranslation();

  // Dynamically compute risk score based on telemetry
  let score = 72; // Default realistic high risk benchmark
  if (weather.temp >= 40) score = Math.min(96, 75 + (weather.temp - 40) * 5);
  else if (weather.rainProbability >= 70) score = Math.min(92, 60 + Math.round(weather.rainProbability * 0.35));
  else if (weather.windSpeed >= 40) score = Math.min(90, 65 + Math.round(weather.windSpeed * 0.5));
  else if (weather.airQualityIndex >= 200) score = Math.min(88, 60 + Math.round(weather.airQualityIndex * 0.1));
  else if (weather.temp < 35 && weather.rainProbability < 30) score = 28;

  let riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical Risk' = 'High Risk';
  let badgeColor = 'bg-[#FEF1F3] text-[#E94B68] border-[#FDC8D1] dark:bg-red-950/40 dark:border-red-900 dark:text-red-400';
  let ringColor = '#E94B68';
  let explanation =
    'Elevated multi-hazard risk index driven by active convective storm activity, localized waterlogging risks, and high precipitation probability.';

  if (score < 40) {
    riskLevel = 'Low Risk';
    badgeColor = 'bg-[#EFFCF6] text-[#1E8A63] border-[#B7F1DC] dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400';
    ringColor = '#45C79A';
    explanation =
      'Regional atmosphere is calm with nominal meteorological parameters. No severe alerts active for this jurisdiction.';
  } else if (score < 65) {
    riskLevel = 'Medium Risk';
    badgeColor = 'bg-[#FFFBF0] text-[#B78809] border-[#FDE8A4] dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400';
    ringColor = '#F4C84A';
    explanation =
      'Moderate advisory conditions. Keep a watch on changing weather fronts and local municipal advisories.';
  }

  // SVG Ring Calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-[#071828] rounded-[24px] border border-[#DCEBED] dark:border-[#1E3347] p-5 sm:p-6 shadow-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#DCEBED] dark:border-[#1E3347]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#075B8A] dark:text-[#38BDF8]">
            {t('home.current_risk_score', 'CURRENT RISK SCORE')}
          </span>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${badgeColor}`}
        >
          {riskLevel}
        </span>
      </div>

      {/* Main Score Graphic & Numbers */}
      <div className="flex items-center gap-5 my-2">
        {/* Circular SVG Ring */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-[#EEF5F8] dark:stroke-[#0B1E30]"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={ringColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-[#18364A] dark:text-slate-100 font-sans leading-none">
              {score}
            </span>
            <span className="text-[10px] font-mono text-[#708696] dark:text-slate-400 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Text description */}
        <div className="flex-1 text-left">
          <div className="text-sm font-bold text-[#18364A] dark:text-slate-100">
            {riskLevel} ({score} / 100)
          </div>
          <p className="text-xs text-[#708696] dark:text-slate-400 mt-1 leading-relaxed line-clamp-3">
            {explanation}
          </p>
        </div>
      </div>

      {/* Low / Medium / High 3-tier visual gauge */}
      <div className="pt-3 mt-2 border-t border-[#DCEBED] dark:border-[#1E3347]">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#708696] dark:text-slate-400 mb-1.5 uppercase">
          <span className={score < 40 ? 'text-[#1E8A63] font-black' : ''}>Low (0-39)</span>
          <span className={score >= 40 && score < 65 ? 'text-[#B78809] font-black' : ''}>
            Medium (40-64)
          </span>
          <span className={score >= 65 ? 'text-[#E94B68] font-black' : ''}>High (65-100)</span>
        </div>
        <div className="h-2 w-full bg-[#EEF5F8] dark:bg-[#0B1E30] rounded-full overflow-hidden flex">
          <div className="w-[40%] bg-[#45C79A]/40 h-full" />
          <div className="w-[25%] bg-[#F4C84A]/40 h-full" />
          <div className="w-[35%] bg-[#E94B68]/40 h-full" />
        </div>
      </div>
    </div>
  );
};
