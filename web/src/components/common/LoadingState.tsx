import React from 'react';
import { Loader2, Radio } from 'lucide-react';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'radar';
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  message = 'Loading disaster intel feeds...',
  className = '',
}) => {
  if (variant === 'radar') {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      >
        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-[#18C3D0]/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-[#075B8A]/40" />
          <div className="w-8 h-8 rounded-full bg-[#075B8A] text-[#18C3D0] flex items-center justify-center shadow-md">
            <Radio className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs font-bold text-[#075B8A] font-sans">{message}</p>
        <p className="text-[10px] text-[#708696] font-mono mt-0.5">
          CONNECTING SATELLITE & SENSOR ARRAYS
        </p>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 p-4 ${className}`}>
        <div className="h-4 bg-[#EEF5F8] rounded-full w-2/5 animate-pulse" />
        <div className="h-10 bg-[#EEF5F8] rounded-2xl w-full animate-pulse" />
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-[#EEF5F8] rounded-full w-4/5 animate-pulse" />
          <div className="h-3 bg-[#EEF5F8] rounded-full w-3/5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center text-[#075B8A] ${className}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-[#18C3D0] mb-3" />
      <p className="text-xs font-bold text-[#18364A] font-sans">{message}</p>
    </div>
  );
};
