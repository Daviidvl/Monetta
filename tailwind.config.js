/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        heading: '-0.02em',
        button: '0.01em',
        caption: '0.02em',
      },
      colors: {
        accent: {
          50:  '#F3ECFF',
          100: '#EFE7FF',
          200: '#D8C2FF',
          300: '#B68CFF',
          400: '#9255FF',
          500: '#7A2FFF',
          600: '#6A1FFF',
          700: '#5E17EB',
          800: '#4B0FA8',
          900: '#2A005F',
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
          success: '#46D889',
          warning: '#FFA534',
          danger:  '#FF5B6A',
          info:    '#36C5F4',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #6A1FFF 0%, #8B3EFF 100%)',
        'gradient-hero': 'linear-gradient(180deg, #5E17EB 0%, #3A0A82 100%)',
        'glow-radial': 'radial-gradient(circle, rgba(122,47,255,.35), transparent)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'xs':  '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'card': '0 4px 12px rgba(15,23,42,.06)',
        'card-hover': '0 12px 30px rgba(15,23,42,.08)',
        'elevated': '0 30px 60px rgba(15,23,42,.12)',
        'glow': '0 0 40px rgba(122,47,255,.25)',
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
