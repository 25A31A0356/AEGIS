import React from 'react';

interface WeatherIllustrationProps {
  conditionCode?: string;
  isNight?: boolean;
  className?: string;
}

export const WeatherIllustration: React.FC<WeatherIllustrationProps> = ({
  conditionCode = 'partly_cloudy',
  isNight = false,
  className = 'w-48 h-48 sm:w-56 sm:h-56',
}) => {
  const code = conditionCode.toLowerCase();

  // 1. NIGHT STATE (if isNight or conditions specify night)
  if (isNight) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Crescent Moon & Stars Glow */}
        <div className="absolute w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl" fill="none">
          {/* Twinkling Stars */}
          <circle cx="45" cy="40" r="1.5" fill="#f8fafc" className="anim-pulse-glow" opacity="0.8" />
          <circle cx="160" cy="50" r="2" fill="#38bdf8" className="anim-pulse-glow" opacity="0.9" />
          <circle cx="140" cy="30" r="1" fill="#f8fafc" opacity="0.7" />
          <circle cx="60" cy="80" r="1.5" fill="#f8fafc" opacity="0.6" />

          {/* Crescent Moon */}
          <path
            d="M95 45 C70 45 50 65 50 90 C50 115 70 135 95 135 C108 135 120 129 128 120 C108 122 90 106 90 85 C90 68 100 54 115 47 C109 45 102 45 95 45 Z"
            fill="url(#moonGrad)"
            className="anim-float"
          />

          {/* Layered Night Cloud */}
          <path
            d="M60 140 C50 140 40 130 40 120 C40 112 45 105 53 102 C56 90 67 82 80 82 C90 82 99 87 104 95 C108 93 113 92 118 92 C132 92 143 103 143 117 C143 118 143 119 143 120 C150 122 155 128 155 136 C155 145 147 152 138 152 L60 152 Z"
            fill="url(#nightCloudGrad)"
            opacity="0.85"
            className="anim-float"
          />

          <defs>
            <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="nightCloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // 2. THUNDERSTORM
  if (code === 'thunderstorm' || code === 'cyclonic') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute w-44 h-44 bg-sky-500/15 rounded-full blur-3xl" />
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl" fill="none">
          {/* Dark Storm Cloud */}
          <path
            d="M45 110 C32 110 22 100 22 88 C22 78 29 70 38 67 C42 52 55 42 72 42 C85 42 96 48 102 58 C107 55 113 54 120 54 C137 54 150 67 150 84 C150 85 150 86 150 88 C158 90 165 98 165 108 C165 118 157 126 146 126 L45 126 Z"
            fill="url(#stormCloudGrad)"
            className="anim-float"
          />

          {/* Lightning Bolt */}
          <path
            d="M95 115 L80 145 L102 145 L88 178 L122 135 L102 135 Z"
            fill="url(#lightningGrad)"
            className="anim-lightning"
          />

          {/* Rain Streaks */}
          <line x1="45" y1="135" x2="38" y2="155" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" className="anim-rain-1" opacity="0.8" />
          <line x1="70" y1="138" x2="63" y2="160" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" className="anim-rain-2" opacity="0.8" />
          <line x1="130" y1="135" x2="123" y2="158" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" className="anim-rain-3" opacity="0.8" />
          <line x1="150" y1="138" x2="143" y2="160" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" className="anim-rain-1" opacity="0.8" />

          <defs>
            <linearGradient id="stormCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="lightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // 3. RAIN & HEAVY RAIN
  if (code === 'rain' || code === 'heavy_rain') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute w-44 h-44 bg-sky-500/10 rounded-full blur-2xl" />
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl" fill="none">
          {/* Main Rain Cloud */}
          <path
            d="M48 105 C35 105 25 95 25 83 C25 73 32 65 41 62 C45 47 58 37 75 37 C88 37 99 43 105 53 C110 50 116 49 123 49 C140 49 153 62 153 79 C153 80 153 81 153 83 C161 85 168 93 168 103 C168 113 160 121 149 121 L48 121 Z"
            fill="url(#rainCloudGrad)"
            className="anim-float"
          />

          {/* Animated Rain Droplets */}
          <line x1="55" y1="130" x2="48" y2="155" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="anim-rain-1" />
          <line x1="80" y1="135" x2="73" y2="162" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="anim-rain-2" />
          <line x1="105" y1="130" x2="98" y2="156" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="anim-rain-3" />
          <line x1="130" y1="135" x2="123" y2="162" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="anim-rain-1" />
          <line x1="150" y1="130" x2="143" y2="155" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="anim-rain-2" />

          <defs>
            <linearGradient id="rainCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // 4. CLEAR / SUNNY / HEATWAVE
  if (code === 'sunny' || code === 'clear' || code === 'heatwave') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Sun Glow */}
        <div className="absolute w-44 h-44 bg-amber-400/20 rounded-full blur-3xl anim-pulse-glow" />
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl" fill="none">
          {/* Sun Rays */}
          <g stroke="url(#sunRayGrad)" strokeWidth="3.5" strokeLinecap="round" opacity="0.85">
            <line x1="100" y1="20" x2="100" y2="35" />
            <line x1="100" y1="165" x2="100" y2="180" />
            <line x1="20" y1="100" x2="35" y2="100" />
            <line x1="165" y1="100" x2="180" y2="100" />
            <line x1="43" y1="43" x2="54" y2="54" />
            <line x1="146" y1="146" x2="157" y2="157" />
            <line x1="43" y1="157" x2="54" y2="146" />
            <line x1="146" y1="54" x2="157" y2="43" />
          </g>

          {/* Central Sun Disc */}
          <circle cx="100" cy="100" r="42" fill="url(#sunDiscGrad)" className="anim-float" />

          <defs>
            <linearGradient id="sunDiscGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id="sunRayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // 5. FOG / MIST
  if (code === 'fog' || code === 'mist') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute w-44 h-44 bg-slate-400/10 rounded-full blur-2xl" />
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg" fill="none">
          <path
            d="M50 90 C40 90 32 82 32 72 C32 64 38 57 46 54 C50 42 61 34 74 34 C85 34 94 39 99 47 C103 44 108 43 114 43 C128 43 139 54 139 68 C145 70 150 76 150 84 C150 92 144 98 135 98 L50 98 Z"
            fill="url(#fogCloudGrad)"
            opacity="0.8"
            className="anim-float"
          />
          {/* Horizontal Fog Bands */}
          <line x1="30" y1="120" x2="170" y2="120" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <line x1="45" y1="135" x2="155" y2="135" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
          <line x1="25" y1="150" x2="175" y2="150" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          <line x1="50" y1="165" x2="145" y2="165" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.4" />

          <defs>
            <linearGradient id="fogCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // 6. DEFAULT / PARTLY CLOUDY / CLOUDY
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute w-44 h-44 bg-amber-400/10 rounded-full blur-2xl" />
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl" fill="none">
        {/* Sun Behind Cloud */}
        <circle cx="130" cy="70" r="32" fill="url(#partlySunGrad)" />

        {/* Front Layered Cloud */}
        <path
          d="M48 135 C35 135 25 125 25 113 C25 103 32 95 41 92 C45 77 58 67 75 67 C88 67 99 73 105 83 C110 80 116 79 123 79 C140 79 153 92 153 109 C153 110 153 111 153 113 C161 115 168 123 168 133 C168 143 160 151 149 151 L48 151 Z"
          fill="url(#cloudWhiteGrad)"
          className="anim-float"
        />

        <defs>
          <linearGradient id="partlySunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="cloudWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default WeatherIllustration;
