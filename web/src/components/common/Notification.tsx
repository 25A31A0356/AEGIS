import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface NotificationProps {
  id?: string;
  type?: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  message?: string;
  timestamp?: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const Notification: React.FC<NotificationProps> = ({
  type = 'info',
  title,
  message,
  timestamp,
  onDismiss,
  action,
  className = '',
}) => {
  const typeStyles = {
    critical: {
      bg: 'bg-[#FEF1F3]',
      border: 'border-[#FDC8D1]',
      text: 'text-[#E94B68]',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-[#FFFBF0]',
      border: 'border-[#FDE8A4]',
      text: 'text-[#B78809]',
      icon: AlertTriangle,
    },
    success: {
      bg: 'bg-[#EFFCF6]',
      border: 'border-[#B7F1DC]',
      text: 'text-[#1E8A63]',
      icon: CheckCircle2,
    },
    info: {
      bg: 'bg-[#EDFAFC]',
      border: 'border-[#AEEBF0]',
      text: 'text-[#075B8A]',
      icon: Info,
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={`rounded-[20px] border p-4 shadow-subtle ${style.bg} ${style.border} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${style.text}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-[#18364A] font-sans">
              {title}
            </h4>
            {timestamp && (
              <span className="text-[10px] font-mono text-[#708696] shrink-0">
                {timestamp}
              </span>
            )}
          </div>
          {message && (
            <p className="text-xs text-[#708696] mt-1 leading-relaxed">
              {message}
            </p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-2 text-xs font-bold underline hover:opacity-80 transition-opacity ${style.text}`}
            >
              {action.label}
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[#708696] hover:text-[#18364A] p-1 rounded-full hover:bg-white/40 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
