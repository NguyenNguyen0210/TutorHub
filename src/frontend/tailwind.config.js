/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            950: '#0B0F17',
            900: '#0F172A',
            800: '#1E293B',
          },
          indigo: {
            50: '#EEF2FF',
            100: '#E0E7FF',
            500: '#6366F1',
            600: '#4F46E5',
            700: '#4338CA',
          },
        },
        financial: {
          available: '#10B981',
          'available-bg': '#ECFDF5',
          holding: '#F59E0B',
          'holding-bg': '#FFFBEB',
          dispute: '#EF4444',
          'dispute-bg': '#FEF2F2',
          escrow: '#3B82F6',
          'escrow-bg': '#EFF6FF',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'glass-hover': '0 10px 25px -3px rgba(79, 70, 229, 0.12)',
        'card-glow': '0 0 25px -5px rgba(79, 70, 229, 0.15)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    // Để Ant Design v5 và Tailwind không bị xung đột reset nút bấm
    preflight: true,
  },
};
