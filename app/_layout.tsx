import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/lib/auth';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#ffffff' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="tutorial" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="benefits" options={{ presentation: 'modal' }} />
            <Stack.Screen name="faq" options={{ presentation: 'modal' }} />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="new-inquiry" options={{ presentation: 'modal' }} />
            <Stack.Screen name="deal/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            <Stack.Screen name="account" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            <Stack.Screen name="admin/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            <Stack.Screen name="admin/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
