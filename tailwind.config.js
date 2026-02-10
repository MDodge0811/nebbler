/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './src/components/ui/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#fff',
        surface: '#F5F5F5',
        border: '#E0E0E0',
        'text-primary': '#333',
        'text-secondary': '#666',
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FFA500',
        info: '#2196F3',
        disabled: '#9E9E9E',
        primary: {
          500: '#333',
          600: '#222',
          700: '#111',
        },
      },
    },
  },
  plugins: [],
};
