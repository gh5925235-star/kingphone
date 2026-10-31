/** @type {import('tailwindcss').Config} */
// ثيم فاتح: بدلنا قيم الألوان بس، فمفيش ملف تاني محتاج تعديل.
// - ink = الخلفيات (بقت فاتحة)
// - white = لون النصوص (بقى كحلي غامق)، فكل text-white في الموقع بقى غامق وواضح
// - gold = لون التمييز (أحمر على طريقة جرير)
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        white: '#16181d',
        ink: {
          950: '#f4f6fa',
          900: '#ffffff',
          800: '#ffffff',
          700: '#eef1f6',
          600: '#e3e8f0',
          500: '#d3dae6',
        },
        gold: {
          50: '#fff1f1',
          100: '#ffdcdc',
          200: '#c8161d',
          300: '#d71920',
          400: '#c01218',
          500: '#a30f15',
          600: '#870c12',
          700: '#6b0a0e',
          800: '#4f070a',
        },
        tint: {
          50: '#f0f8f8',
          100: '#e3f2f3',
          200: '#d3ebed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(215,25,32,0.30), 0 8px 24px rgba(215,25,32,0.12)',
        'gold-lg': '0 8px 24px rgba(215,25,32,0.30)',
        card: '0 8px 24px rgba(15,23,42,0.08)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #e5232b 0%, #b3121a 100%)',
        'gold-soft': 'linear-gradient(135deg, rgba(215,25,32,0.08) 0%, rgba(179,18,26,0.04) 100%)',
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
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
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
