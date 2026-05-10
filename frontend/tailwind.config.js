/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-clash)', 'serif'],
        body: ['var(--font-satoshi)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        sand: {
          50:  '#faf8f3',
          100: '#f3ede0',
          200: '#e8dcc8',
          300: '#d9c7a8',
          400: '#c5aa82',
          500: '#b08f60',
          600: '#9a764a',
          700: '#7e5f3b',
          800: '#664e32',
          900: '#54402a',
        },
        ocean: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        ink: {
          50:  '#f5f4f2',
          100: '#e8e5e0',
          200: '#cdc8bf',
          300: '#ada69a',
          400: '#8c8378',
          500: '#736961',
          600: '#5f5650',
          700: '#4e4641',
          800: '#433c38',
          900: '#1a1714',
          950: '#0d0b09',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'slide-right': 'slideRight 0.3s ease forwards',
        'ping-once': 'ping 0.6s ease-out 1',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
