import { Tabs, Redirect } from 'expo-router';
import { AdminTabBar } from '@/components/AdminTabBar';
import { useAuth } from '@/lib/auth';

/**
 * Admin console navigator — a Tabs shell with the liquid-glass AdminTabBar.
 * Every admin route is a Tabs screen so the bar persists everywhere; only the
 * 5 main sections render items, the rest are reached via router.push.
 */
export default function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  // Non-admins never see the console.
  if (!loading && !isAdmin) return <Redirect href="/" />;

  return (
    <Tabs tabBar={(props) => <AdminTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#000000' } }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="inquiries" options={{ title: 'Inquiries' }} />
      <Tabs.Screen name="users" options={{ title: 'Users' }} />
      <Tabs.Screen name="manage" options={{ title: 'Manage' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="managers" options={{ title: 'Account managers' }} />
      <Tabs.Screen name="faqs" options={{ title: 'FAQs' }} />
      <Tabs.Screen name="settings" options={{ title: 'Global settings' }} />
      <Tabs.Screen name="emails" options={{ title: 'Emails' }} />
      <Tabs.Screen name="audit" options={{ title: 'Audit trail' }} />
      <Tabs.Screen name="[id]" options={{ title: 'Deal' }} />
    </Tabs>
  );
}
