/**
 * Design tokens — dark "iClose.ae" brand (black + neon lime), matching the
 * marketing poster. Semantic names are kept from the old light theme so most
 * `text-ink` / `text-graphite` / `text-accent` usages flip automatically:
 *   ink      = primary text (now light)
 *   graphite = secondary / tertiary text (now dim grey)
 *   accent   = brand neon-lime (was blue)
 *   surface  = card background on the black page
 */
export const colors = {
  // Text (light on black)
  ink: '#f5f5f7',
  ink800: '#e5e5ea',
  ink700: '#c7c7cc',
  graphite: '#a1a1a6',
  graphiteLight: '#6e6e73',
  graphiteDark: '#c7c7cc',
  // Lines & surfaces
  hairline: '#2a2a2e',
  mist: '#1c1c1e',
  fog: '#0a0a0a',
  paper: '#000000',
  surface: '#141416',
  surface2: '#1f1f22',
  // Brand neon lime
  accent: '#9eff00',
  accentHover: '#b3ff3d',
  accentDark: '#7ed000',
  // On-accent foreground (neon lime needs dark text)
  onAccent: '#0a0a0a',
  journey: {
    buyer: '#ffa1f2',
    seller: '#9effe0',
    agent: '#ffcc9c',
    offplan: '#a3bcff',
    listing: '#5ae09b',
  },
} as const;

export const radius = { apple: 18 } as const;
