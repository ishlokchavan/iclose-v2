import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/components/GlassTabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#ffffff' } }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="inquiries" options={{ title: 'Inquiries' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
