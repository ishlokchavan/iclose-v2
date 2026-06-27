import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/components/GlassTabBar';
import { FEATURES } from '@/lib/features';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#ffffff' } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="trending" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="map" />
      {/* 6th tab — tokenized real-estate. Hidden entirely when the flag is off. */}
      <Tabs.Screen name="shares" options={{ href: FEATURES.shares ? undefined : null }} />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
