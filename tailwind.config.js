/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0a',
          900: '#0e0e0e',
          800: '#141414',
          700: '#1c1c1c',
          600: '#242424',
          500: '#2e2e2e',
        },
        gold: {
          50: '#eaf3ff',
          100: '#cfe3ff',
          200: '#9fc8ff',
          300: '#5aa2ff',
          400: '#3b8bf5',
          500: '#2b72dc',
          600: '#1d5bb8',
          700: '#17458c',
          800: '#112f5f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(90,162,255,0.4), 0 8px 30px rgba(90,162,255,0.15)',
        'gold-lg': '0 0 24px rgba(90,162,255,0.35)',
        card: '0 10px 30px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #5aa2ff 0%, #1d5bb8 100%)',
        'gold-soft': 'linear-gradient(135deg, rgba(90,162,255,0.12) 0%, rgba(29,91,184,0.06) 100%)',
        'surface-gradient': 'linear-gradient(180deg, #141414 0%, #0e0e0e 100%)',
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
