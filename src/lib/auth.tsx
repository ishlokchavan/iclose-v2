import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { checkIsAdmin, getMyProfile, type Profile } from './deals';
import { registerPushToken } from './notifications';

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
    return () => sub.subscription.unsubscribe();
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
