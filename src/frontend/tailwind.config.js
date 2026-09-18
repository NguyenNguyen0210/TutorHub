/** @type {import('tailwindcss').Config} */

/**
 * TutorHub Design Tokens — Brand Style Guide v2
 *
 * Colour values are NEVER written here: every entry points at a CSS variable
 * declared in `src/styles/tokens.css` (`rgb(var(--x) / <alpha-value>)` keeps
 * Tailwind opacity modifiers working, e.g. `bg-brand-primary-500/20`).
 *
 * `brand-indigo-*`, `financial-*`, `surface-*`, `text-*` and the bare `indigo`
 * scale are BACKWARD-COMPATIBILITY ALIASES kept while pages migrate onto the
 * semantic `brand`/`fg`/`surface`/`border` names. They must not receive new usage.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Brand: Primary Blue ─────────────────────────────────────── */
        brand: {
          primary: {
            50: 'rgb(var(--brand-primary-50) / <alpha-value>)',
            100: 'rgb(var(--brand-primary-100) / <alpha-value>)',
            200: 'rgb(var(--brand-primary-200) / <alpha-value>)',
            300: 'rgb(var(--brand-primary-300) / <alpha-value>)',
            400: 'rgb(var(--brand-primary-400) / <alpha-value>)',
            500: 'rgb(var(--brand-primary-500) / <alpha-value>)',
            600: 'rgb(var(--brand-primary-600) / <alpha-value>)',
            700: 'rgb(var(--brand-primary-700) / <alpha-value>)',
            800: 'rgb(var(--brand-primary-800) / <alpha-value>)',
            950: 'rgb(var(--brand-primary-950) / <alpha-value>)',
            DEFAULT: 'rgb(var(--brand-primary-600) / <alpha-value>)',
          },
          secondary: {
            50: 'rgb(var(--brand-secondary-50) / <alpha-value>)',
            100: 'rgb(var(--brand-secondary-100) / <alpha-value>)',
            200: 'rgb(var(--brand-secondary-200) / <alpha-value>)',
            400: 'rgb(var(--brand-secondary-400) / <alpha-value>)',
            500: 'rgb(var(--brand-secondary-500) / <alpha-value>)',
            600: 'rgb(var(--brand-secondary-600) / <alpha-value>)',
            700: 'rgb(var(--brand-secondary-700) / <alpha-value>)',
            DEFAULT: 'rgb(var(--brand-secondary-500) / <alpha-value>)',
          },
          navy: {
            700: 'rgb(var(--brand-navy-700) / <alpha-value>)',
            800: 'rgb(var(--brand-navy-800) / <alpha-value>)',
            900: 'rgb(var(--brand-navy-900) / <alpha-value>)',
            950: 'rgb(var(--brand-navy-950) / <alpha-value>)',
          },
        },

        /* Flat brand aliases (bg-brand-primary-600) */
        'brand-primary-50': 'rgb(var(--brand-primary-50) / <alpha-value>)',
        'brand-primary-100': 'rgb(var(--brand-primary-100) / <alpha-value>)',
        'brand-primary-200': 'rgb(var(--brand-primary-200) / <alpha-value>)',
        'brand-primary-300': 'rgb(var(--brand-primary-300) / <alpha-value>)',
        'brand-primary-400': 'rgb(var(--brand-primary-400) / <alpha-value>)',
        'brand-primary-500': 'rgb(var(--brand-primary-500) / <alpha-value>)',
        'brand-primary-600': 'rgb(var(--brand-primary-600) / <alpha-value>)',
        'brand-primary-700': 'rgb(var(--brand-primary-700) / <alpha-value>)',
        'brand-primary-800': 'rgb(var(--brand-primary-800) / <alpha-value>)',
        'brand-primary-950': 'rgb(var(--brand-primary-950) / <alpha-value>)',
        'brand-secondary-50': 'rgb(var(--brand-secondary-50) / <alpha-value>)',
        'brand-secondary-100': 'rgb(var(--brand-secondary-100) / <alpha-value>)',
        'brand-secondary-400': 'rgb(var(--brand-secondary-400) / <alpha-value>)',
        'brand-secondary-500': 'rgb(var(--brand-secondary-500) / <alpha-value>)',
        'brand-secondary-600': 'rgb(var(--brand-secondary-600) / <alpha-value>)',
        'brand-secondary-700': 'rgb(var(--brand-secondary-700) / <alpha-value>)',

        /* ── Migration alias: legacy "indigo" brand → Primary Blue ───── */
        indigo: {
          50: 'rgb(var(--brand-primary-50) / <alpha-value>)',
          100: 'rgb(var(--brand-primary-100) / <alpha-value>)',
          200: 'rgb(var(--brand-primary-200) / <alpha-value>)',
          300: 'rgb(var(--brand-primary-300) / <alpha-value>)',
          400: 'rgb(var(--brand-primary-400) / <alpha-value>)',
          500: 'rgb(var(--brand-primary-500) / <alpha-value>)',
          600: 'rgb(var(--brand-primary-600) / <alpha-value>)',
          700: 'rgb(var(--brand-primary-700) / <alpha-value>)',
          800: 'rgb(var(--brand-primary-800) / <alpha-value>)',
          900: 'rgb(var(--brand-primary-800) / <alpha-value>)',
          950: 'rgb(var(--brand-primary-950) / <alpha-value>)',
        },

        /* ── Migration alias: legacy `brand-indigo-*` → Primary Blue ─── */
        'brand-indigo-50': 'rgb(var(--brand-primary-50) / <alpha-value>)',
        'brand-indigo-100': 'rgb(var(--brand-primary-100) / <alpha-value>)',
        'brand-indigo-500': 'rgb(var(--brand-primary-500) / <alpha-value>)',
        'brand-indigo-600': 'rgb(var(--brand-primary-600) / <alpha-value>)',
        'brand-indigo-700': 'rgb(var(--brand-primary-700) / <alpha-value>)',
        'brand-navy-800': 'rgb(var(--brand-navy-800) / <alpha-value>)',
        'brand-navy-900': 'rgb(var(--brand-navy-900) / <alpha-value>)',
        'brand-navy-950': 'rgb(var(--brand-navy-950) / <alpha-value>)',

        /* ── Foreground / text ───────────────────────────────────────── */
        fg: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          inverse: 'rgb(var(--text-inverse) / <alpha-value>)',
        },
        /* Migration aliases (classes: `text-text-muted`) */
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',

        /* ── Surfaces & border ───────────────────────────────────────── */
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          card: 'rgb(var(--surface) / <alpha-value>)',
          canvas: 'rgb(var(--canvas) / <alpha-value>)',
        },
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          light: 'rgb(var(--border) / <alpha-value>)',
        },
        /* Migration aliases */
        'surface-card-light': 'rgb(var(--surface) / <alpha-value>)',
        'surface-canvas-light': 'rgb(var(--canvas) / <alpha-value>)',
        'surface-card-glass': 'var(--glass-surface-bg)',
        'border-light': 'rgb(var(--border) / <alpha-value>)',

        /* ── Semantic: financial status (business invariants) ─────────── */
        success: {
          DEFAULT: 'rgb(var(--semantic-success) / <alpha-value>)',
          strong: 'rgb(var(--semantic-success-strong) / <alpha-value>)',
          subtle: 'rgb(var(--semantic-success-subtle) / <alpha-value>)',
        },
        holding: {
          DEFAULT: 'rgb(var(--semantic-holding) / <alpha-value>)',
          strong: 'rgb(var(--semantic-holding-strong) / <alpha-value>)',
          subtle: 'rgb(var(--semantic-holding-subtle) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--semantic-danger) / <alpha-value>)',
          strong: 'rgb(var(--semantic-danger-strong) / <alpha-value>)',
          subtle: 'rgb(var(--semantic-danger-subtle) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--semantic-info) / <alpha-value>)',
          subtle: 'rgb(var(--semantic-info-subtle) / <alpha-value>)',
        },

        /* ── Migration aliases: legacy financial-* ───────────────────── */
        'financial-available': 'rgb(var(--semantic-success) / <alpha-value>)',
        'financial-available-strong': 'rgb(var(--semantic-success-strong) / <alpha-value>)',
        'financial-available-bg': 'rgb(var(--semantic-success-subtle) / <alpha-value>)',
        'financial-holding': 'rgb(var(--semantic-holding) / <alpha-value>)',
        'financial-holding-bg': 'rgb(var(--semantic-holding-subtle) / <alpha-value>)',
        'financial-dispute': 'rgb(var(--semantic-danger) / <alpha-value>)',
        'financial-dispute-bg': 'rgb(var(--semantic-danger-subtle) / <alpha-value>)',
        'financial-escrow-blue': 'rgb(var(--semantic-info) / <alpha-value>)',
        'financial-escrow-blue-bg': 'rgb(var(--semantic-info-subtle) / <alpha-value>)',
        financial: {
          available: 'rgb(var(--semantic-success) / <alpha-value>)',
          'available-strong': 'rgb(var(--semantic-success-strong) / <alpha-value>)',
          'available-bg': 'rgb(var(--semantic-success-subtle) / <alpha-value>)',
          holding: 'rgb(var(--semantic-holding) / <alpha-value>)',
          'holding-bg': 'rgb(var(--semantic-holding-subtle) / <alpha-value>)',
          dispute: 'rgb(var(--semantic-danger) / <alpha-value>)',
          'dispute-bg': 'rgb(var(--semantic-danger-subtle) / <alpha-value>)',
          escrow: 'rgb(var(--semantic-info) / <alpha-value>)',
          'escrow-bg': 'rgb(var(--semantic-info-subtle) / <alpha-value>)',
        },
      },

      borderRadius: {
        'brand-sm': '6px',
        'brand-md': '10px',
        'brand-lg': '16px',
        'brand-xl': '24px',
        pill: '9999px',
        /* Legacy aliases */
        sm6: '6px',
        md10: '10px',
        lg16: '16px',
        xl24: '24px',
        '2xl32': '32px',
      },

      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        margin: '1.5rem',
        gutter: '1rem',
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        /* Migration alias — 57 usages of `font-monospace-num` */
        'monospace-num': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        'display-hero': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'headline-1': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'headline-2': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'headline-3': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'body-lg': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'body-reg': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        caption: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-hero': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-1': ['28px', { lineHeight: '1.3', fontWeight: '700' }],
        'headline-2': ['22px', { lineHeight: '1.35', fontWeight: '600' }],
        'headline-3': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-reg': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'monospace-num': ['14px', { lineHeight: '1.4', fontWeight: '600' }],
      },

      boxShadow: {
        'brand-sm': '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        'brand-md': '0 4px 12px -2px rgb(15 23 42 / 0.08)',
        'brand-lg': '0 12px 28px -8px rgb(15 23 42 / 0.12)',
        'brand-xl': '0 24px 48px -16px rgb(15 23 42 / 0.16)',
        /* Legacy aliases */
        glass: '0 4px 20px -2px rgb(15 23 42 / 0.05)',
        'glass-hover': '0 10px 25px -3px rgb(37 99 235 / 0.12)',
        'card-glow': '0 0 25px -5px rgb(37 99 235 / 0.15)',
        premium: '0 20px 40px -15px rgb(15 23 42 / 0.07)',
        'glow-indigo': '0 0 30px -5px rgb(37 99 235 / 0.3)',
        'glow-emerald': '0 0 30px -5px rgb(16 185 129 / 0.3)',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 4s ease-in-out infinite',
        fadeIn: 'fadeIn 0.25s ease-out forwards',
        shake: 'shake 0.4s ease-in-out',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
};
