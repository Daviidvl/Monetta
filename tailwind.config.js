/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        accent: {
          50:  '#EEEEFF',
          100: '#E0E0FF',
          200: '#C4C3FF',
          300: '#A09EFF',
          400: '#8480FF',
          500: '#635BFF',
          600: '#4F47E8',
          700: '#3B34CC',
          800: '#2A24A8',
          900: '#1C1880',
        },
        surface: {
          0:   'var(--surface-0)',
          50:  'var(--surface-50)',
          100: 'var(--surface-100)',
          200: 'var(--surface-200)',
          300: 'var(--surface-300)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverse:   'var(--text-inverse)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          base:   'var(--border-base)',
          strong: 'var(--border-strong)',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger:  '#EF4444',
          info:    '#3B82F6',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'xs':  '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'card': '0 0 0 1px var(--border-subtle), 0 2px 4px rgb(0 0 0 / 0.04)',
        'card-hover': '0 0 0 1px var(--border-base), 0 4px 12px rgb(0 0 0 / 0.08)',
        'elevated': '0 8px 32px rgb(0 0 0 / 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
