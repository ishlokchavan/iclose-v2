import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Heart, LogOut, MessageSquare, Home, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useSaved } from '@/store/saved';
import { useEnquiries } from '@/store/enquiries';
import { colors } from '@/theme/tokens';
import type { Session } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { saved } = useSaved();
  const { enquired } = useEnquiries();
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submitEmail() {
    setBusy(true);
    try {
      const fn =
        mode === 'login'
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password });
      const { error } = await fn;
      if (error) Alert.alert('Auth', error.message);
    } finally {
      setBusy(false);
    }
  }

  // Native Google OAuth: open the consent screen in the system browser, then
  // catch the iclose://auth-callback redirect and exchange the code.
  async function google() {
    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return Alert.alert('Google', error?.message ?? 'Failed');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      await supabase.auth.exchangeCodeForSession(result.url);
    }
  }

  if (session) {
    return (
      <ScrollView className="flex-1 bg-fog" contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 }}>
        <View className="items-center gap-2 px-5 py-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-ink">
            <Text className="text-2xl font-bold text-white">
              {(session.user.email ?? 'i')[0].toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-ink">{session.user.email}</Text>
        </View>

        <View className="mx-4 gap-3">
          <Row
            icon={<Heart size={20} color={colors.accent} />}
            label={`${saved.size} saved ${saved.size === 1 ? 'home' : 'homes'}`}
            onPress={() => router.push('/saved')}
          />
          <Row
            icon={<MessageSquare size={20} color={colors.accent} />}
            label={`${enquired.size} ${enquired.size === 1 ? 'enquiry' : 'enquiries'} sent`}
          />
          <Row
            icon={<Home size={20} color={colors.accent} />}
            label="List your property"
            onPress={() => router.push('/sell')}
          />
        </View>

        <Pressable
          onPress={() => supabase.auth.signOut()}
          className="mx-4 mt-4 flex-row items-center justify-center gap-2 rounded-apple bg-ink py-4"
        >
          <LogOut size={18} color="#fff" />
          <Text className="font-semibold text-white">Sign out</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-fog" contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: insets.bottom + 110 }}>
      <Text className="text-3xl font-bold text-ink">{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
      <Text className="mb-6 mt-1 text-base text-graphite">Save homes and bank your iClose credits.</Text>

      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address"
        placeholderTextColor={colors.graphiteLight} className="mb-3 rounded-apple bg-paper px-4 py-4 text-base text-ink" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry
        placeholderTextColor={colors.graphiteLight} className="mb-4 rounded-apple bg-paper px-4 py-4 text-base text-ink" />

      <Pressable disabled={busy} onPress={submitEmail} className="rounded-apple bg-accent py-4">
        <Text className="text-center font-semibold text-white">{mode === 'login' ? 'Sign in' : 'Sign up'}</Text>
      </Pressable>

      <Pressable onPress={google} className="mt-3 rounded-apple border border-hairline bg-paper py-4">
        <Text className="text-center font-semibold text-ink">Continue with Google</Text>
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-6">
        <Text className="text-center text-accent">
          {mode === 'login' ? "New here? Create an account" : 'Already have an account? Sign in'}
        </Text>
      </Pressable>

      <View className="mt-8 gap-3">
        <Row
          icon={<Heart size={20} color={colors.accent} />}
          label={`${saved.size} saved ${saved.size === 1 ? 'home' : 'homes'}`}
          onPress={() => router.push('/saved')}
        />
        <Row
          icon={<Home size={20} color={colors.accent} />}
          label="List your property"
          onPress={() => router.push('/sell')}
        />
      </View>
    </ScrollView>
  );
}

function Row({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-3 rounded-apple bg-paper p-4"
    >
      {icon}
      <Text className="flex-1 text-base text-ink">{label}</Text>
      {onPress ? <ChevronRight size={18} color={colors.graphiteLight} /> : null}
    </Pressable>
  );
}
