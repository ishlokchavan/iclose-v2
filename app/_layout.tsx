import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ExperienceProvider } from '@/store/experience';
import { SavedProvider } from '@/store/saved';
import { SignalStoreProvider } from '@/store/signals';
import { IntroStory } from '@/components/IntroStory';
import { TastePicker } from '@/components/TastePicker';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ExperienceProvider>
          <SavedProvider>
            <SignalStoreProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#ffffff' } }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="property/[reference]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
                <Stack.Screen name="launches" options={{ presentation: 'modal' }} />
                <Stack.Screen name="sell" options={{ presentation: 'modal' }} />
                <Stack.Screen name="saved" options={{ presentation: 'modal' }} />
              </Stack>
              {/* First-run onboarding — cover the whole app incl. the tab bar */}
              <TastePicker />
              <IntroStory />
            </SignalStoreProvider>
          </SavedProvider>
        </ExperienceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
