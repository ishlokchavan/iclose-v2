import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

/**
 * Supabase client configured for React Native: sessions persist in
 * AsyncStorage and refresh automatically. Same project as the web app.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Implicit flow returns tokens directly in the redirect URL — no WebCrypto
    // (unavailable in Expo Go/Hermes), which PKCE's code-challenge requires.
    flowType: 'implicit',
  },
});
