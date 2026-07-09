/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Light text on black
        ink: { DEFAULT: '#f5f5f7', 900: '#f5f5f7', 800: '#e5e5ea', 700: '#c7c7cc' },
        graphite: { DEFAULT: '#a1a1a6', light: '#6e6e73', dark: '#c7c7cc' },
        // Lines & surfaces (dark)
        hairline: '#2a2a2e',
        mist: '#1c1c1e',
        fog: '#0a0a0a',
        paper: '#000000',
        surface: { DEFAULT: '#141416', 2: '#1f1f22' },
        // Brand neon lime
        accent: { DEFAULT: '#9eff00', hover: '#b3ff3d', dark: '#7ed000' },
        onaccent: '#0a0a0a',
        journey: {
          buyer: '#ffa1f2', seller: '#9effe0', agent: '#ffcc9c',
          offplan: '#a3bcff', listing: '#5ae09b',
        },
      },
      fontFamily: {
        heading: ['Anton_400Regular'],
        sans: ['Inter_400Regular'],
      },
      borderRadius: { apple: '18px' },
    },
  },
  plugins: [],
};
