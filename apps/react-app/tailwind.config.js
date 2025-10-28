/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff2fe',
          100: '#e1e8fe',
          200: '#c9d3fc',
          300: '#a8b6f9',
          400: '#858ff4',
          500: '#686bec',
          600: '#463ddd',
          700: '#473dc5',
          800: '#3a349f',
          900: '#34317e',
          950: '#1f1d49',
        },
      },
    },
  },
};
