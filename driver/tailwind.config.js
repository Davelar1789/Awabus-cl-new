/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0b1b2b', light: '#132a40', dark: '#081420' },
        brand: {
          50: '#ecfdf7',
          300: '#7ee9c9',
          500: '#1cb894',
          600: '#0d9488',
        },
      },
    },
  },
  plugins: [],
};
