import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { checkIsAdmin, getMyProfile, type Profile } from './deals';
import { registerPushToken } from './notifications';

/**
 * Consume an `iclose://auth-callback#access_token=...&refresh_token=...` deep
 * link (email confirmation, magic link, password reset) and establish the
 * session. Google's own flow captures its redirect synchronously in-browser;
 * this covers links opened from Mail — both cold start and while running.
 */
async function consumeAuthUrl(url: string | null) {
  if (!url || !url.includes('access_token')) return;
  const frag = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
  const params = new URLSearchParams(frag);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
  }
}

/**
 * Central auth state: the Supabase session, the user's profile, and whether
 * they're an admin (from the RLS-backed is_admin() RPC — never trusted from the
 * client, only reflected). Screens read this instead of re-fetching.
 */
interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  session: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: Session | null) => {
    setSession(s);
    if (s) {
      const [p, admin] = await Promise.all([getMyProfile(), checkIsAdmin()]);
      setProfile(p);
      setIsAdmin(admin);
      // Register this device for push (best-effort, fire-and-forget).
      registerPushToken();
    } else {
      setProfile(null);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session).finally(() => setLoading(false)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { load(s); });

    // Cold start: app opened directly from an email link.
    Linking.getInitialURL().then(consumeAuthUrl);
    // Warm: app already running, link opened while backgrounded/foregrounded.
    const linkSub = Linking.addEventListener('url', ({ url }) => consumeAuthUrl(url));

    return () => { sub.subscription.unsubscribe(); linkSub.remove(); };
  }, [load]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await load(data.session);
  }, [load]);

  return (
    <AuthCtx.Provider value={{ session, profile, isAdmin, loading, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
