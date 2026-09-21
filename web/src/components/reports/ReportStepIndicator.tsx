import React from 'react';
import {
  Flame,
  MapPin,
  Camera,
  FileText,
  Send,
  Check,
} from 'lucide-react';

interface ReportStepIndicatorProps {
  currentStep: number; // 1 to 5
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { step: 1, label: 'Hazard', icon: Flame },
  { step: 2, label: 'Location', icon: MapPin },
  { step: 3, label: 'Media', icon: Camera },
  { step: 4, label: 'Details', icon: FileText },
  { step: 5, label: 'Review & Send', icon: Send },
];

export const ReportStepIndicator: React.FC<ReportStepIndicatorProps> = ({
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="bg-white rounded-[24px] border border-[#DCEBED] p-4 shadow-card mb-6">
      <div className="flex items-center justify-between max-w-3xl mx-auto relative">
        {/* Connecting Background Line */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-[#EEF5F8] -z-0" />

        {STEPS.map((item) => {
          const Icon = item.icon;
          const isPassed = currentStep > item.step;
          const isCurrent = currentStep === item.step;

          return (
            <button
              key={item.step}
              type="button"
              disabled={item.step > currentStep + 1}
              onClick={() => onStepClick && onStepClick(item.step)}
              className="relative z-10 flex flex-col items-center gap-1.5 group focus:outline-none disabled:cursor-not-allowed"
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-200 shadow-sm ${
                  isPassed
                    ? 'bg-[#45C79A] text-white shadow-[#45C79A]/20'
                    : isCurrent
                    ? 'bg-[#075B8A] text-white ring-4 ring-[#18C3D0]/30 shadow-[#075B8A]/25 scale-110'
                    : 'bg-[#F4F8FA] border border-[#DCEBED] text-[#708696]'
                }`}
              >
                {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-sans font-bold tracking-tight text-center ${
                  isCurrent
                    ? 'text-[#075B8A]'
                    : isPassed
                    ? 'text-[#18364A]'
                    : 'text-[#708696]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
