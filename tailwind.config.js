/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#1d1d1f', 900: '#1d1d1f', 800: '#2c2c2e', 700: '#3a3a3c' },
        graphite: { DEFAULT: '#6e6e73', light: '#86868b', dark: '#424245' },
        hairline: '#d2d2d7',
        mist: '#f5f5f7',
        fog: '#fbfbfd',
        paper: '#ffffff',
        accent: { DEFAULT: '#0071e3', hover: '#0077ed', dark: '#0058a3' },
        journey: {
          buyer: '#ffa1f2', seller: '#9effe0', agent: '#ffcc9c',
          offplan: '#a3bcff', listing: '#5ae09b',
        },
      },
      borderRadius: { apple: '18px' },
    },
  },
  plugins: [],
};
