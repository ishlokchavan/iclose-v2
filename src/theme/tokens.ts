/** Design tokens ported 1:1 from the web app's tailwind.config.ts. */
export const colors = {
  ink: '#1d1d1f',
  ink800: '#2c2c2e',
  ink700: '#3a3a3c',
  graphite: '#6e6e73',
  graphiteLight: '#86868b',
  graphiteDark: '#424245',
  hairline: '#d2d2d7',
  mist: '#f5f5f7',
  fog: '#fbfbfd',
  paper: '#ffffff',
  accent: '#0071e3',
  accentHover: '#0077ed',
  accentDark: '#0058a3',
  journey: {
    buyer: '#ffa1f2',
    seller: '#9effe0',
    agent: '#ffcc9c',
    offplan: '#a3bcff',
    listing: '#5ae09b',
  },
} as const;

export const radius = { apple: 18 } as const;
