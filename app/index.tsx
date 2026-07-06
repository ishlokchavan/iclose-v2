import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/auth';
import { GlassBg } from '@/components/Glass';
import { colors } from '@/theme/tokens';

/** Entry gate: signed-in → dashboard; first launch → tutorial; else → sign-in. */
export default function Index() {
  const { session, profile, loading } = useAuth();
  const [seenTutorial, setSeenTutorial] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('seen_tutorial').then((v) => setSeenTutorial(v === '1'));
  }, []);

  if (loading || seenTutorial === null) {
    return (
      <View className="flex-1 items-center justify-center">
        <GlassBg />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (session) {
    // Signed in but profile still loading — wait a beat.
    if (!profile) return <View className="flex-1 items-center justify-center"><GlassBg /><ActivityIndicator color={colors.accent} /></View>;
    return <Redirect href={profile.onboarded ? '/home' : '/onboarding'} />;
  }
  if (!seenTutorial) return <Redirect href="/tutorial" />;
  return <Redirect href="/sign-in" />;
}
