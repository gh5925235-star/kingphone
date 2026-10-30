/** @type {import('tailwindcss').Config} */
// ثيم فاتح: بدلنا قيم الألوان بس، فمفيش ملف تاني محتاج تعديل.
// - ink = الخلفيات (بقت فاتحة)
// - white = لون النصوص (بقى كحلي غامق)، فكل text-white في الموقع بقى غامق وواضح
// - gold = لون التمييز (أزرق)
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        white: '#0f172a',
        ink: {
          950: '#f4f6fa',
          900: '#ffffff',
          800: '#ffffff',
          700: '#eef1f6',
          600: '#e3e8f0',
          500: '#d3dae6',
        },
        gold: {
          50: '#eaf3ff',
          100: '#d6e7ff',
          200: '#1d5bb8',
          300: '#2b72dc',
          400: '#1d63c9',
          500: '#1d5bb8',
          600: '#17458c',
          700: '#112f5f',
          800: '#0c2244',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(43,114,220,0.35), 0 8px 24px rgba(43,114,220,0.15)',
        'gold-lg': '0 8px 24px rgba(43,114,220,0.35)',
        card: '0 8px 24px rgba(15,23,42,0.08)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #3b8bf5 0%, #1d5bb8 100%)',
        'gold-soft': 'linear-gradient(135deg, rgba(43,114,220,0.10) 0%, rgba(29,91,184,0.05) 100%)',
        'surface-gradient': 'linear-gradient(180deg, #ffffff 0%, #f4f6fa 100%)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-in': 'slideIn 0.3s ease-out both',
        'scale-in': 'scaleIn 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
