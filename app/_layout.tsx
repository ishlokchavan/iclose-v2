import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/lib/auth';
import { useAppFonts, installFontDefaults } from '@/lib/fonts';

installFontDefaults();
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    if (!fontsLoaded) return;
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="intro" />
            <Stack.Screen name="tutorial" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="benefits" options={{ presentation: 'modal' }} />
            <Stack.Screen name="faq" options={{ presentation: 'modal' }} />
            <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
            <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
            <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="new-inquiry" options={{ presentation: 'modal' }} />
            <Stack.Screen name="deal/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            <Stack.Screen name="account/support" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            <Stack.Screen name="account/edit" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            <Stack.Screen name="account/documents" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            <Stack.Screen name="account/banks" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
