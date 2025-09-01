/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F7FFE6',
          100: '#EFFFCC',
          200: '#E5FF99',
          300: '#D8FF57',
          400: '#CCFF33',
          500: '#D8FF57',
          600: '#B8E63D',
          700: '#9ACC2A',
          800: '#7CB31A',
          900: '#5C8A0D',
        },
        dark: {
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#B3B3B3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1E1E1E',
        }
      }
    },
  },
  plugins: [],
};
