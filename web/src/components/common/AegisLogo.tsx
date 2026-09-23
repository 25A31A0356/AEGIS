import React from 'react';

interface AegisLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  iconOnly?: boolean;
  onClick?: () => void;
}

export const AegisShieldIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-xs ${className}`}
      aria-label="AEGIS ALERT Shield Logo"
    >
      {/* Outer Shield Outline */}
      <path
        d="M50 4L16 17V48C16 71.5 30.5 91 50 97C69.5 91 84 71.5 84 48V17L50 4Z"
        fill="#0B132B"
        stroke="#1C2D5A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Inner subtle shield bevel */}
      <path
        d="M50 8L20 20V48C20 68.5 32.5 86.5 50 92C67.5 86.5 80 68.5 80 48V20L50 8Z"
        fill="#0F172A"
      />

      {/* Signal Arc 3 (Outer Wave) */}
      <path
        d="M32 37C37.5 30.5 43.5 27 50 27C56.5 27 62.5 30.5 68 37"
        stroke="#0284C7"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Signal Arc 2 (Middle Wave) */}
      <path
        d="M38 46C41.5 41.5 45.5 39 50 39C54.5 39 58.5 41.5 62 46"
        stroke="#0EA5E9"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Signal Arc 1 (Inner Wave) */}
      <path
        d="M44 55C45.8 52.8 47.8 51.5 50 51.5C52.2 51.5 54.2 52.8 56 55"
        stroke="#38BDF8"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Central Solid Beacon Dot */}
      <circle cx="50" cy="68" r="9" fill="#0284C7" />
      <circle cx="50" cy="68" r="6" fill="#38BDF8" />
    </svg>
  );
};

export const AegisLogo: React.FC<AegisLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  iconOnly = false,
  onClick,
}) => {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const subtitleSizes = {
    sm: 'text-[7px]',
    md: 'text-[8.5px]',
    lg: 'text-[10px]',
    xl: 'text-[11.5px]',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer ' : ''}${className}`}
    >
      <AegisShieldIcon size={iconSizes[size]} />
      {!iconOnly && (
        <div className="flex flex-col justify-center text-left">
          <div className="flex items-baseline font-black tracking-tight leading-none">
            <span className={`font-sans font-extrabold text-slate-900 dark:text-white ${titleSizes[size]}`}>
              AEGIS
            </span>
            <span className={`font-sans font-extrabold text-[#0284C7] dark:text-[#38BDF8] ml-1.5 ${titleSizes[size]}`}>
              ALERT
            </span>
          </div>
          {showSubtitle && (
            <span
              className={`font-mono font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mt-1 leading-none ${subtitleSizes[size]}`}
            >
              HAZARD &amp; WEATHER INTELLIGENCE
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AegisLogo;
