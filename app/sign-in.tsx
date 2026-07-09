import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Apple, Sparkles, HelpCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Wordmark } from '@/components/DealUI';
import { GoogleIcon } from '@/components/GoogleIcon';
import { IMAGES } from '@/data/images';
import { colors } from '@/theme/tokens';

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (session && profile) router.replace(profile.onboarded ? '/home' : '/onboarding');
  }, [session, profile]);
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
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() || null } } });
        if (error) return Alert.alert('Sign up', error.message);
        if (!data.session) Alert.alert('Check your email', 'Confirm your email address to finish, then sign in.');
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
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } } });
    if (error || !data?.url) return Alert.alert('Google sign-in', error?.message ?? 'Could not start sign-in.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return;
    const frag = result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1] ?? '';
    const params = new URLSearchParams(frag);
    const at = params.get('access_token'), rt = params.get('refresh_token'), code = params.get('code');
    if (at && rt) { const { error: e } = await supabase.auth.setSession({ access_token: at, refresh_token: rt }); if (e) Alert.alert('Google sign-in', e.message); }
    else if (code) { const { error: e } = await supabase.auth.exchangeCodeForSession(result.url); if (e) Alert.alert('Google sign-in', e.message); }
    else Alert.alert('Almost there', `Add this redirect URL in Supabase → URL Configuration:\n\n${redirectTo}`);
  }

  return (
    <View className="flex-1 bg-paper">
      {/* Hero */}
      <View style={{ height: 260 }}>
        <Image source={{ uri: IMAGES.hero }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={300} />
        <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,1)']} locations={[0, 0.55, 1]} style={{ position: 'absolute', inset: 0 }} />
        <View style={{ position: 'absolute', top: insets.top + 10, left: 24 }}>
          <View className="flex-row items-center rounded-full bg-surface px-3 py-1.5"><Wordmark size={20} /></View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Text className="-mt-2 text-[27px] font-bold leading-tight tracking-tight text-ink">Never pay commission to buy, sell or close.</Text>
        <Text className="mb-4 mt-1.5 text-[14.5px] text-graphite">Create your account to get started — it’s free.</Text>

        <Pressable onPress={() => router.push('/benefits')} className="mb-5 flex-row items-center gap-2 self-start rounded-full border border-accent/25 bg-accent/8 px-3.5 py-2">
          <Sparkles size={15} color={colors.accent} /><Text className="text-[13.5px] font-semibold text-accent">See what you get</Text>
        </Pressable>

        <View className="gap-3">
          {mode === 'signup' ? (
            <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface px-4 py-3.5 text-base text-ink" />
          ) : null}
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface px-4 py-3.5 text-base text-ink" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface px-4 py-3.5 text-base text-ink" />
        </View>

        {/* Uniform auth buttons */}
        <View className="mt-4 gap-3">
          <Pressable disabled={busy} onPress={submitEmail} className="h-[52px] flex-row items-center justify-center rounded-full bg-accent">
            {busy ? <ActivityIndicator color={colors.onAccent} /> : <Text className="text-[15.5px] font-semibold" style={{ color: colors.onAccent }}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
          </Pressable>

          <View className="my-1 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-hairline" /><Text className="text-[12.5px] text-graphite-light">or continue with</Text><View className="h-px flex-1 bg-hairline" />
          </View>

          {appleAvailable ? (
            <Pressable onPress={apple} className="h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-black">
              <Apple size={19} color="#fff" fill="#fff" /><Text className="text-[15.5px] font-semibold text-white">Continue with Apple</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={google} className="h-[52px] flex-row items-center justify-center gap-2.5 rounded-full bg-white">
            <GoogleIcon size={19} /><Text className="text-[15.5px] font-semibold" style={{ color: colors.onAccent }}>Continue with Google</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-5">
          <Text className="text-center text-[14.5px] text-accent">{mode === 'login' ? 'New to iClose? Create an account' : 'Already have an account? Sign in'}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/faq')} className="mt-6 flex-row items-center justify-center gap-2 self-center">
          <HelpCircle size={15} color={colors.graphiteLight} /><Text className="text-[13.5px] text-graphite">Questions? Read the FAQ</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
