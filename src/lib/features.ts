import Constants from 'expo-constants';

/**
 * Feature flags. `shares` gates the entire tokenized-real-estate module (the 6th
 * "Shares" tab + all /shares routes). It defaults ON for dev/branch builds and
 * can be turned off without touching any other code:
 *   • env:  EXPO_PUBLIC_FEATURE_SHARES=false
 *   • config: extra.features.shares = false
 * Keeping it flag-gated means the module never affects the build under App Store
 * review — that binary simply ships with the flag off.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function readFlag(env: string | undefined, configured: unknown, fallback: boolean): boolean {
  if (env != null && env !== '') return env === 'true' || env === '1';
  if (typeof configured === 'boolean') return configured;
  return fallback;
}

const features = (extra.features ?? {}) as Record<string, unknown>;

export const FEATURES = {
  shares: readFlag(process.env.EXPO_PUBLIC_FEATURE_SHARES, features.shares, true),
};
