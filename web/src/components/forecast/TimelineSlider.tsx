import React from 'react';
import { Clock } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
  sublabel: string;
  tempOffset: number;
  rainProbOffset: number;
  riskStatus: 'low' | 'moderate' | 'warning' | 'critical';
}

export const TIMELINE_STEPS: TimelineStep[] = [
  { id: 'now', label: 'NOW', sublabel: 'Live (21:00)', tempOffset: 0, rainProbOffset: 0, riskStatus: 'warning' },
  { id: '3h', label: '+3 HOURS', sublabel: '00:00 Night', tempOffset: -1.6, rainProbOffset: +10, riskStatus: 'critical' },
  { id: '6h', label: '+6 HOURS', sublabel: '03:00 Dawn', tempOffset: -2.9, rainProbOffset: +5, riskStatus: 'warning' },
  { id: '12h', label: '+12 HOURS', sublabel: '09:00 Morning', tempOffset: -1.2, rainProbOffset: -35, riskStatus: 'low' },
  { id: '24h', label: 'TOMORROW', sublabel: '15 Sep Day', tempOffset: +1.8, rainProbOffset: +10, riskStatus: 'warning' },
  { id: '3d', label: '3 DAYS', sublabel: '17 Sep Outlook', tempOffset: +3.0, rainProbOffset: -35, riskStatus: 'low' },
  { id: '7d', label: '7 DAYS', sublabel: '21 Sep Model', tempOffset: +3.6, rainProbOffset: -50, riskStatus: 'low' },
];

interface TimelineSliderProps {
  currentStepIndex: number;
  onSelectStepIndex: (index: number) => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  currentStepIndex,
  onSelectStepIndex,
}) => {
  const currentStep = TIMELINE_STEPS[currentStepIndex];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-sky-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-900 uppercase font-mono tracking-wider">
              Predictive Timeline Modeling Engine
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Temporal Step: <strong className="text-slate-900">{currentStep.label} ({currentStep.sublabel})</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Algorithm:</span>
          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
            IMD GFS-0.25° HIGH-RES
          </span>
        </div>
      </div>

      {/* Interactive Step Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {TIMELINE_STEPS.map((step, idx) => {
          const isSelected = idx === currentStepIndex;
          return (
            <button
              key={step.id}
              onClick={() => onSelectStepIndex(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-elevated ring-2 ring-sky-400/40'
                  : 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-sky-300' : 'text-slate-500'}`}>
                  {step.label}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    step.riskStatus === 'critical'
                      ? 'bg-red-500 animate-pulse'
                      : step.riskStatus === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className={`text-xs font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {step.sublabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Line */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>T=0 (OBSERVATIONAL GROUND TRUTH)</span>
        <span className="text-slate-400">← SLIDE TEMPORAL HORIZON →</span>
        <span>T+168H (EXTENDED SYNOPTIC ENSEMBLE)</span>
      </div>
    </div>
  );
};
