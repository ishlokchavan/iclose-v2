import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { BookOpen, HelpCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { colors } from '@/theme/tokens';
import type { UserRole } from '@/lib/deals';

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [role, setRole] = useState<UserRole>('agent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Once authenticated, leave the auth screen.
  useEffect(() => { if (session) router.replace('/dashboard'); }, [session]);

  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
  }, []);

  async function submitEmail() {
    if (!email || !password) return Alert.alert('Missing details', 'Enter your email and password.');
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert('Sign in', error.message);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() || null, role } },
        });
        if (error) return Alert.alert('Sign up', error.message);
        if (!data.session) Alert.alert('Check your email', 'Confirm your email address to finish creating your account, then sign in.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function apple() {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!cred.identityToken) return Alert.alert('Apple sign-in', 'No identity token returned.');
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
      if (error) Alert.alert('Apple sign-in', error.message);
    } catch (e) {
      if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign-in', (e as Error)?.message ?? 'Failed');
    }
  }

  async function google() {
    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
    });
    if (error || !data?.url) return Alert.alert('Google sign-in', error?.message ?? 'Could not start sign-in.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return;
    const frag = result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1] ?? '';
    const params = new URLSearchParams(frag);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const code = params.get('code');
    if (access_token && refresh_token) {
      const { error: e } = await supabase.auth.setSession({ access_token, refresh_token });
      if (e) Alert.alert('Google sign-in', e.message);
    } else if (code) {
      const { error: e } = await supabase.auth.exchangeCodeForSession(result.url);
      if (e) Alert.alert('Google sign-in', e.message);
    } else {
      Alert.alert('Almost there', `Add this redirect URL in Supabase → Authentication → URL Configuration:\n\n${redirectTo}`);
    }
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <View className="mb-2 items-center"><Wordmark size={34} /></View>
        <Text className="mb-8 text-center text-[15px] text-graphite">Close deals. Skip commission. Get paid.</Text>

        {mode === 'signup' ? (
          <View className="mb-4">
            <Text className="mb-2 text-[13px] font-medium text-graphite">I am a…</Text>
            <View className="flex-row gap-3">
              {(['agent', 'buyer'] as UserRole[]).map((r) => (
                <Pressable key={r} onPress={() => setRole(r)} className={`flex-1 items-center rounded-2xl border py-3.5 ${role === r ? 'border-accent bg-accent/10' : 'border-white/60 bg-white/60'}`}>
                  <Text className={`text-[15px] font-semibold ${role === r ? 'text-accent' : 'text-ink'}`}>{r === 'agent' ? 'Agent' : 'Buyer'}</Text>
                  <Text className="mt-0.5 text-[11.5px] text-graphite">{r === 'agent' ? 'Close deals' : 'Skip commission'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View className="gap-3 rounded-apple border border-white/60 bg-white/70 p-4">
          {mode === 'signup' ? (
            <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5 text-base text-ink" />
          ) : null}
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5 text-base text-ink" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5 text-base text-ink" />
          <Pressable disabled={busy} onPress={submitEmail} className="mt-1 rounded-full bg-accent py-3.5">
            {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-center text-[15px] font-semibold text-white">{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
          </Pressable>

          {appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={999}
              style={{ height: 48, width: '100%' }}
              onPress={apple}
            />
          ) : null}
          <Pressable onPress={google} className="rounded-full border border-hairline bg-white/60 py-3.5"><Text className="text-center text-[15px] font-semibold text-ink">Continue with Google</Text></Pressable>
        </View>

        <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-4">
          <Text className="text-center text-[14.5px] text-accent">{mode === 'login' ? 'New to iClose? Create an account' : 'Already have an account? Sign in'}</Text>
        </Pressable>

        <View className="mt-8 flex-row justify-center gap-3">
          <Pressable onPress={() => router.push('/tutorial')} className="flex-row items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-2.5">
            <BookOpen size={16} color={colors.graphite} /><Text className="text-[13.5px] font-medium text-ink">How it works</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/faq')} className="flex-row items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-2.5">
            <HelpCircle size={16} color={colors.graphite} /><Text className="text-[13.5px] font-medium text-ink">FAQ</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
