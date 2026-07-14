import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';

/**
 * Admin console navigator. A Stack whose first screen is the (tabs) group (the 5
 * main sections with the AdminTabBar); every detail / sub-page is a Stack screen
 * pushed on top, so back always returns to where you came from (fixes the
 * "back drops to dashboard" bug). Non-admins never reach any admin route.
 */
export default function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  if (!loading && !isAdmin) return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="broadcast" />
      <Stack.Screen name="managers" />
      <Stack.Screen name="faqs" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="emails" />
      <Stack.Screen name="audit" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
