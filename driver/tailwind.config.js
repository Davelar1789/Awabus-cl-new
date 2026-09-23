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
          100: '#d1faec',
          300: '#7ee9c9',
          500: '#1cb894',
          600: '#0d9488',
          700: '#0c7a6f',
        },
        // Deeper forest green used for the "trip active" header, primary
        // action buttons, and success states in the driver app design.
        trip: {
          50: '#eaf6ee',
          100: '#cfead9',
          500: '#2e7d4f',
          600: '#256640',
          700: '#1f5636',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
