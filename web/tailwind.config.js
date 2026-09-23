/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Stitch & AEGIS ALERT Unified Palette - Pure Pitch Black in Dark Mode
        stitch: {
          bg: '#000000',
          surface: '#0a0a0c',
          surfaceLight: '#121214',
          border: 'rgba(255, 255, 255, 0.09)',
          primary: '#0284c7',
          secondary: '#38bdf8',
          accent: '#0ea5e9',
          danger: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
          muted: '#71717a',
        },
        // AGIES legacy token aliases
        'agies-dark': '#000000',
        'agies-blue': '#0B6E9E',
        'agies-cyan': '#18C3D0',
        'agies-red': '#E94B68',
        'agies-yellow': '#F4C84A',
        'agies-green': '#45C79A',
        'agies-text': '#18364A',
        'agies-subtext': '#708696',
        'agies-border': '#DCEBED',
        'agies-bg': '#F4F8FA',

        hazard: {
          critical: '#ef4444',
          'critical-bg': '#450a0a',
          'critical-border': '#dc2626',
          warning: '#f59e0b',
          'warning-bg': '#451a03',
          'warning-border': '#d97706',
          moderate: '#eab308',
          'moderate-bg': '#422006',
          'moderate-border': '#ca8a04',
          safe: '#10b981',
          'safe-bg': '#022c22',
          'safe-border': '#059669',
          info: '#0284c7',
          'info-bg': '#082f49',
          'info-border': '#0284c7',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        metric: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'card-lg': '20px',
        'card-xl': '24px',
        'pill': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'elevated': '0 12px 30px -4px rgba(0, 0, 0, 0.6)',
        'float': '0 20px 35px -6px rgba(0, 0, 0, 0.7)',
        'glow-cyan': '0 0 25px rgba(56, 189, 248, 0.3)',
        'glow-red': '0 0 25px rgba(239, 68, 68, 0.35)',
        'glow-blue': '0 0 25px rgba(2, 132, 199, 0.35)',
      },
      keyframes: {
        'pulse-radar': {
          '0%': { transform: 'scale(0.8)', opacity: '0.9' },
          '50%': { transform: 'scale(1.8)', opacity: '0.3' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
        'beacon-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'float-bubble': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      },
      animation: {
        'pulse-radar': 'pulse-radar 2.5s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        'beacon-glow': 'beacon-glow 1.5s ease-in-out infinite',
        'marquee': 'marquee 35s linear infinite',
        'float-bubble': 'float-bubble 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
