import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cyan' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const sizeMap = {
    sm: 'px-3 py-1.5 text-xs rounded-full gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm rounded-full gap-2',
    lg: 'px-6 py-3 text-sm sm:text-base rounded-full gap-2.5',
  };

  const variantMap = {
    primary:
      'bg-[#075B8A] hover:bg-[#0B6E9E] text-white font-bold shadow-sm shadow-[#075B8A]/20 active:scale-[0.98]',
    secondary:
      'bg-[#EEF5F8] hover:bg-[#DCEBED] text-[#075B8A] font-semibold border border-[#DCEBED] active:scale-[0.98]',
    cyan:
      'bg-[#18C3D0] hover:bg-[#15B0BC] text-[#075B8A] font-bold shadow-sm shadow-[#18C3D0]/25 active:scale-[0.98]',
    danger:
      'bg-[#E94B68] hover:bg-[#D43D59] text-white font-bold shadow-sm shadow-[#E94B68]/20 active:scale-[0.98]',
    warning:
      'bg-[#F4C84A] hover:bg-[#E5B938] text-[#18364A] font-bold shadow-sm shadow-[#F4C84A]/20 active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-[#F4F8FA] text-[#18364A] border border-[#DCEBED] font-semibold active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-[#EEF5F8] text-[#075B8A] font-semibold active:scale-[0.98]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-sans tracking-wide transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${sizeMap[size]} ${variantMap[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
