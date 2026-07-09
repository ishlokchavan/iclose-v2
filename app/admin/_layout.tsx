import { Stack } from 'expo-router';

/** Admin console navigator — dark, chrome-less; every screen paints black. */
export default function AdminLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }} />;
}
