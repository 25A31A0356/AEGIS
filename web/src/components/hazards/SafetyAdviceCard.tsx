import React, { useState } from 'react';
import { SafetyAction } from '../../types/hazard';
import { CheckCircle, Circle } from 'lucide-react';

interface SafetyAdviceCardProps {
  action: SafetyAction;
}

export const SafetyAdviceCard: React.FC<SafetyAdviceCardProps> = ({ action }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <div
      onClick={() => setIsCompleted(!isCompleted)}
      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
        isCompleted
          ? 'bg-emerald-50/70 border-emerald-200'
          : action.urgent
          ? 'bg-red-50/50 border-red-200 hover:bg-red-50'
          : 'bg-white border-slate-200 hover:bg-slate-50'
      }`}
    >
      <button
        type="button"
        className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
      >
        {isCompleted ? (
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300" />
        )}
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h5
            className={`text-xs font-bold ${
              isCompleted ? 'text-emerald-900 line-through' : 'text-slate-900'
            }`}
          >
            {action.title}
          </h5>
          {action.urgent && !isCompleted && (
            <span className="text-[9px] font-mono font-bold bg-red-600 text-white px-1.5 py-0.2 rounded uppercase">
              HIGH PRIORITY
            </span>
          )}
        </div>
        <p
          className={`text-xs leading-relaxed ${
            isCompleted ? 'text-emerald-700/80' : 'text-slate-600'
          }`}
        >
          {action.instruction}
        </p>
      </div>
    </div>
  );
};
