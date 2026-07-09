import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Bell, ClipboardList, TrendingUp, BadgePercent, CheckCheck } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { getNotifications, markAllRead, markRead, type AppNotification } from '@/lib/notifications';
import { formatDate, formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';

const ICON: Record<string, typeof Bell> = {
  inquiry: ClipboardList,
  admin_inquiry: ClipboardList,
  status: TrendingUp,
  commission: BadgePercent,
  general: Bell,
};

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setItems(await getNotifications(80));
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }, [load]);

  const hasUnread = items.some((n) => !n.read);

  async function open(n: AppNotification) {
    if (!n.read) { markRead(n.id).catch(() => {}); setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))); }
    if (n.deal_id) router.push(`/deal/${n.deal_id}`);
  }

  async function clearAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    markAllRead().catch(() => {});
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Press onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
          <X size={20} color={colors.ink} />
        </Press>
        <Text className="flex-1 text-[17px] font-semibold text-ink">Notifications</Text>
        {hasUnread ? (
          <Press onPress={clearAll} className="flex-row items-center gap-1.5 rounded-full border border-hairline bg-surface2 px-3 py-2">
            <CheckCheck size={15} color={colors.accent} />
            <Text className="text-[12.5px] font-semibold text-ink">Mark all read</Text>
          </Press>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator className="mt-20" color={colors.accent} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {items.length === 0 ? (
            <View className="mt-16 items-center gap-3 px-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-surface2"><Bell size={28} color={colors.graphite} /></View>
              <Text className="text-center text-[15px] text-graphite">You're all caught up. Updates on your inquiries will show up here.</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {items.map((n, i) => {
                const Icon = ICON[n.type] ?? Bell;
                return (
                  <FadeIn key={n.id} delay={Math.min(i, 10) * 30}>
                    <Press
                      onPress={() => open(n)}
                      className={`flex-row items-start gap-3 rounded-apple border p-4 ${n.read ? 'border-hairline bg-surface' : 'border-accent/40 bg-accent/5'}`}
                    >
                      <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-surface2">
                        <Icon size={18} color={n.read ? colors.graphite : colors.accent} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="flex-1 text-[14.5px] font-semibold text-ink" numberOfLines={1}>{n.title}</Text>
                          {!n.read ? <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.accent }} /> : null}
                        </View>
                        {n.body ? <Text className="mt-0.5 text-[13px] text-graphite" numberOfLines={2}>{n.body}</Text> : null}
                        <Text className="mt-1 text-[11.5px] text-graphite-light">{formatDate(n.created_at)} · {formatTime(n.created_at)}</Text>
                      </View>
                    </Press>
                  </FadeIn>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
