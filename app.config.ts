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
  version: '1.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'ae.iclose.app',
    usesAppleSignIn: true,
    // Declared explicitly so EAS's capability sync registers Sign In with Apple
    // on the App ID + provisioning profile (usesAppleSignIn alone wasn't detected).
    entitlements: {
      'com.apple.developer.applesignin': ['Default'],
    },
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: 'ae.iclose.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
  },
  web: { bundler: 'metro', output: 'static', favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-image-picker', { photosPermission: 'iClose needs access to your photos so you can upload your profile picture and verification documents.' }],
    ['expo-splash-screen', { backgroundColor: '#000000', image: './assets/splash.png', resizeMode: 'contain' }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://iclose.ae',
    // iClose deal-closing database (project `iclose`, ref jvdmwvzlunmouvlvtebg).
    // The anon key is a publishable, RLS-protected client key — safe to ship.
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://jvdmwvzlunmouvlvtebg.supabase.co',
    supabaseAnonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2ZG13dnpsdW5tb3V2bHZ0ZWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzOTUyNDYsImV4cCI6MjA5NTk3MTI0Nn0.QLrklMFP8zpYkhwWXs9l5zNgAzTLsXMFm29hs-UGX_8',
    eas: { projectId: '329eea7c-7a6a-4abf-bf2c-a5ed6aaf817a' },
  },
};

export default config;
