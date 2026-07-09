import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

/**
 * In-app + push notifications. Rows come from public.notifications (written by
 * DB triggers on deal events); push is delivered via Expo from a DB trigger
 * using the device token we register here.
 */
export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  deal_id: string | null;
  read: boolean;
  created_at: string;
}

// Show banners while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function getNotifications(limit = 50): Promise<AppNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('id,title,body,type,deal_id,read,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as AppNotification[]) ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);
  return count ?? 0;
}

export async function markRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllRead(): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('read', false);
}

/** Request permission, get the Expo push token, and store it on the profile. */
export async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    let status = (await Notifications.getPermissionsAsync()).status;
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    if (token) await supabase.from('profiles').update({ push_token: token }).eq('id', auth.user.id);
  } catch {
    // non-fatal — notifications simply won't push
  }
}

/** Live unread count for the header bell; returns [count, refresh]. */
export function useUnreadCount(): [number, () => void] {
  const [n, setN] = useState(0);
  const refresh = useCallback(() => {
    getUnreadCount().then(setN).catch(() => {});
  }, []);
  useEffect(() => {
    refresh();
    const sub = Notifications.addNotificationReceivedListener(refresh);
    return () => sub.remove();
  }, [refresh]);
  return [n, refresh];
}
