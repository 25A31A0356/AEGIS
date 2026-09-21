import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'critical' | 'warning' | 'success' | 'info' | 'neutral';
  styleType?: 'soft' | 'solid' | 'outline';
  dot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  styleType = 'soft',
  dot = false,
  className = '',
  children,
  ...props
}) => {
  const colorStyles: Record<string, Record<'soft' | 'solid' | 'outline', string>> = {
    cyan: {
      soft: 'bg-[#EDFAFC] text-[#075B8A] border-[#AEEBF0]',
      solid: 'bg-[#18C3D0] text-[#075B8A] border-transparent font-bold',
      outline: 'bg-transparent text-[#075B8A] border-[#18C3D0]',
    },
    critical: {
      soft: 'bg-[#FEF1F3] text-[#E94B68] border-[#FDC8D1]',
      solid: 'bg-[#E94B68] text-white border-transparent',
      outline: 'bg-transparent text-[#E94B68] border-[#E94B68]',
    },
    warning: {
      soft: 'bg-[#FFFBF0] text-[#B78809] border-[#FDE8A4]',
      solid: 'bg-[#F4C84A] text-[#18364A] border-transparent font-bold',
      outline: 'bg-transparent text-[#B78809] border-[#F4C84A]',
    },
    success: {
      soft: 'bg-[#EFFCF6] text-[#1E8A63] border-[#B7F1DC]',
      solid: 'bg-[#45C79A] text-white border-transparent',
      outline: 'bg-transparent text-[#1E8A63] border-[#45C79A]',
    },
    info: {
      soft: 'bg-[#EBF4FA] text-[#075B8A] border-[#D1E6F0]',
      solid: 'bg-[#075B8A] text-white border-transparent',
      outline: 'bg-transparent text-[#075B8A] border-[#075B8A]',
    },
    neutral: {
      soft: 'bg-[#F4F8FA] text-[#708696] border-[#DCEBED]',
      solid: 'bg-[#708696] text-white border-transparent',
      outline: 'bg-transparent text-[#708696] border-[#DCEBED]',
    },
  };

  const dotColors: Record<string, string> = {
    cyan: 'bg-[#18C3D0]',
    critical: 'bg-[#E94B68] animate-pulse',
    warning: 'bg-[#F4C84A]',
    success: 'bg-[#45C79A]',
    info: 'bg-[#075B8A]',
    neutral: 'bg-[#708696]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border transition-colors ${
        colorStyles[variant][styleType]
      } ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
