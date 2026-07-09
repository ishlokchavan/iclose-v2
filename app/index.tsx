import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/auth';
import { Splash } from '@/components/Splash';

/** Entry gate: signed-in → home/onboarding; first launch → intro; else → sign-in. */
export default function Index() {
  const { session, profile, isAdmin, loading } = useAuth();
  const [seenIntro, setSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('seen_intro').then((v) => setSeenIntro(v === '1'));
  }, []);

  if (loading || seenIntro === null) return <Splash />;

  if (session) {
    if (!profile) return <Splash />;
    if (isAdmin) return <Redirect href="/admin" />;
    return <Redirect href={profile.onboarded ? '/home' : '/onboarding'} />;
  }
  if (!seenIntro) return <Redirect href="/intro" />;
  return <Redirect href="/sign-in" />;
}
