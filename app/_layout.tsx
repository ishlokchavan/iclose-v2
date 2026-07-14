import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
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

  // Tapping a push should open the notification, not just a blank app. Route to
  // the notifications screen (which shows the title + message) on tap, both when
  // the app is running and when it was launched cold from a notification.
  useEffect(() => {
    const openInbox = () => setTimeout(() => { try { router.push('/notifications'); } catch { /* router not ready */ } }, 400);
    const sub = Notifications.addNotificationResponseReceivedListener(openInbox);
    Notifications.getLastNotificationResponseAsync().then((r) => { if (r) openInbox(); }).catch(() => {});
    return () => sub.remove();
  }, []);

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
            <Stack.Screen name="auth-callback" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="benefits" options={{ presentation: 'modal' }} />
            <Stack.Screen name="faq" options={{ presentation: 'modal' }} />
            <Stack.Screen name="trust" options={{ presentation: 'modal' }} />
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
