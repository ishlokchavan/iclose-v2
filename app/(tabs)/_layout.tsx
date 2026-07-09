import { Tabs, Redirect } from 'expo-router';
import { GlassTabBar } from '@/components/GlassTabBar';
import { useAuth } from '@/lib/auth';

export default function TabsLayout() {
  const { isAdmin, loading } = useAuth();
  // Admins never see the buyer/broker experience — they live in /admin.
  if (!loading && isAdmin) return <Redirect href="/admin" />;

  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#000000' } }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="inquiries" options={{ title: 'Inquiries' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
