import { Tabs } from 'expo-router';
import { AdminTabBar } from '@/components/AdminTabBar';

/**
 * The 5 main admin sections, shown in the liquid-glass AdminTabBar. Detail and
 * sub-pages (managers, faqs, settings, emails, audit, [id]) live one level up in
 * the admin Stack, so pushing to them keeps a proper back-stack (back returns to
 * the list, not the dashboard). The admin guard lives in the parent Stack layout.
 */
export default function AdminTabsLayout() {
  return (
    <Tabs tabBar={(props) => <AdminTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#000000' } }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="inquiries" options={{ title: 'Inquiries' }} />
      <Tabs.Screen name="users" options={{ title: 'Users' }} />
      <Tabs.Screen name="manage" options={{ title: 'Manage' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
