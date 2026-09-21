import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load disaster telemetry',
  message = 'An unexpected error occurred while communicating with the telemetry feed.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-6 sm:p-8 text-center flex flex-col items-center justify-center bg-[#FEF1F3] rounded-[20px] border border-[#FDC8D1] shadow-card ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#E94B68] text-white flex items-center justify-center mb-3 shadow-md shadow-[#E94B68]/20">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-[#E94B68] font-sans">
        {title}
      </h3>
      <p className="text-xs text-[#708696] max-w-md mt-1 mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="danger"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCcw className="w-3.5 h-3.5" />}
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
};
