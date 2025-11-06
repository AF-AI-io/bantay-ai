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
        // Primary - Trustworthy blue for interactive elements
        'primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0057B7', // Main primary color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Neutral - High contrast for text and backgrounds
        'neutral': {
          50: '#F9FAFB', // Page background
          100: '#F3F4F6', // Card backgrounds
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563', // Secondary text
          700: '#374151',
          800: '#1F2937',
          900: '#111827', // Primary text
        },
        // Danger - Red for alerts and warnings
        'danger': {
          50: '#fef2f2',
          100: '#FEE2E2', // Alert background tint
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#DC2626', // Main danger color
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Success - Green for safe states
        'success': {
          50: '#f0fdf4',
          100: '#DCFCE7', // Safe background tint
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16A34A', // Main success color
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.1', fontWeight: '800' }],
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'label': ['12px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      spacing: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      boxShadow: {
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'scale-down': 'scaleDown 200ms ease-out',
        'scale-up': 'scaleUp 150ms ease-out',
      },
      keyframes: {
        scaleDown: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.98)' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}