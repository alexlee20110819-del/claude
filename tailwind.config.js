/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f6fc',
          100: '#e2ebf7',
          200: '#cbdcf1',
          300: '#a7c5e6',
          400: '#7ca6d8',
          500: '#5c88cb',
          600: '#486ebe',
          700: '#3f5cad',
          800: '#384c8d',
          900: '#1e2f5c',
          950: '#141f3d',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(20 31 61 / 0.04), 0 1px 3px 0 rgb(20 31 61 / 0.08)',
        panel: '0 10px 40px -12px rgb(20 31 61 / 0.25)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 180ms ease-out',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [],
};
