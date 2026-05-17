/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff', 100: '#e0e9ff', 200: '#c7d7fd', 300: '#a5bbfb',
          400: '#8196f8', 500: '#6272f3', 600: '#4d53e8', 700: '#3f43d4',
          800: '#3437ab', 900: '#2f3388', 950: '#1c1e52',
        },
        surface: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
        success: { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a' },
        warning: { 400: '#fb923c', 500: '#f97316', 600: '#ea580c' },
        danger:  { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem', '3xl': '1.5rem' },
      boxShadow: {
        glass:  '0 8px 32px rgba(0,0,0,0.08)',
        card:   '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        brand:  '0 4px 24px rgba(98,114,243,0.3)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'slide-right':'slideRight 0.3s ease-out',
        'scale-in':  'scaleIn 0.2s ease-out',
        'shimmer':   'shimmer 1.5s infinite linear',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 },                        to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn:    { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
