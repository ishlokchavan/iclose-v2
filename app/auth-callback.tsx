import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

/**
 * Deep-link landing route for `iclose://auth-callback`.
 *
 * On Android, Google OAuth (and email confirmation / magic links) redirect the
 * browser straight to this URL, which opens the app on this route. Without a
 * matching screen expo-router renders "Unmatched route". We parse the tokens
 * (implicit flow) or the PKCE `code` from the incoming URL, establish the
 * session, then bounce to the index gate which routes to the right home.
 * AuthProvider also consumes these URLs, so double-handling is harmless.
 */
export default function AuthCallback() {
  const done = useRef(false);

  useEffect(() => {
    async function finish(url: string | null) {
      if (done.current) return;
      try {
        if (url && (url.includes('access_token') || url.includes('code='))) {
          const frag = url.includes('#') ? url.split('#')[1] : (url.split('?')[1] ?? '');
          const params = new URLSearchParams(frag);
          const at = params.get('access_token');
          const rt = params.get('refresh_token');
          const code = params.get('code');
          if (at && rt) await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          else if (code) await supabase.auth.exchangeCodeForSession(url);
        }
      } catch {
        /* ignore — the gate falls back to sign-in if no session was established */
      }
      done.current = true;
      router.replace('/');
    }

    // Cold start (app launched by the link) + warm (already running).
    Linking.getInitialURL().then((u) => finish(u));
    const sub = Linking.addEventListener('url', ({ url }) => finish(url));
    // Never hang here: if no usable URL arrives, the session was set elsewhere.
    const t = setTimeout(() => finish(null), 3500);

    return () => { sub.remove(); clearTimeout(t); };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-paper">
      <ActivityIndicator color={colors.accent} />
      <Text className="mt-3 text-[14px] text-graphite">Signing you in…</Text>
    </View>
  );
}
