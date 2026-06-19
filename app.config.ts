import type { ExpoConfig } from 'expo/config';

/**
 * iClose — native app config.
 * Bundle id ae.iclose.app (reverse-DNS of iclose.ae). Custom scheme `iclose`
 * powers OAuth deep links (iclose://auth-callback).
 */
const config: ExpoConfig = {
  name: 'iClose',
  slug: 'iclose',
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
    ['expo-splash-screen', { backgroundColor: '#ffffff', image: './assets/splash.png', resizeMode: 'contain' }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://iclose.ae',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};

export default config;
