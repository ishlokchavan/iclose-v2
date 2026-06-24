import type { ExpoConfig } from 'expo/config';

/**
 * iClose — native app config.
 * Bundle id ae.iclose.app (reverse-DNS of iclose.ae). Custom scheme `iclose`
 * powers OAuth deep links (iclose://auth-callback).
 */
const config: ExpoConfig = {
  name: 'iClose',
  slug: 'iclose',
  owner: 'shlokchavan.personal',
  scheme: 'iclose',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'ae.iclose.app',
    usesAppleSignIn: true,
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'iClose uses your location to show nearby homes on the map.',
    },
  },
  android: {
    package: 'ae.iclose.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    config: {
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '' },
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  web: { bundler: 'metro', output: 'static', favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-video',
    ['expo-splash-screen', { backgroundColor: '#ffffff', image: './assets/splash.png', resizeMode: 'contain' }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://iclose.ae',
    // Live iClose database (iclose-academy-db). The anon key is a publishable,
    // RLS-protected client key — safe to ship, same as the web app.
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://nnkicmfsdbfpucfcnutn.supabase.co',
    supabaseAnonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ua2ljbWZzZGJmcHVjZmNudXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODkyMDcsImV4cCI6MjA5NDI2NTIwN30.liASHVfCZQsB4OFwhY6uBYuv99IWXaMBbGGgbuFiKTs',
    eas: { projectId: '329eea7c-7a6a-4abf-bf2c-a5ed6aaf817a' },
  },
};

export default config;
