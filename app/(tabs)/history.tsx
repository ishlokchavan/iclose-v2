import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { History as HistoryIcon, CheckCircle2, XCircle } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { getMyDeals, computeStats, type Deal } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { formatAed, formatDate, dayGroup } from '@/lib/format';
import { colors } from '@/theme/tokens';

export default function HistoryTab() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => { setDeals(await getMyDeals()); }, []);
  useEffect(() => { if (session) load().finally(() => setLoading(false)); }, [session, load]);
  useFocusEffect(useCallback(() => { if (session) load(); }, [session, load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }, [load]);

  const closed = useMemo(() => deals.filter((d) => d.status === 'closed_won' || d.status === 'closed_lost'), [deals]);
  const stats = computeStats(deals);
  const isBuyer = profile?.role === 'buyer';

  const groups = useMemo(() => {
    const map = new Map<string, Deal[]>();
    for (const d of closed) {
      const k = dayGroup(d.created_at);
      (map.get(k) ?? map.set(k, []).get(k)!).push(d);
    }
    return Array.from(map.entries());
  }, [closed]);

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
        <Text className="mb-4 text-[24px] font-bold text-ink">History</Text>

        {/* Summary */}
        <View className="mb-5 overflow-hidden rounded-[22px]">
          <LinearGradient colors={['#0f172a', '#334155']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
            <Text className="text-[13px] text-white/75">{stats.closedCount} deal{stats.closedCount === 1 ? '' : 's'} closed · {formatAed(stats.closedValue)} total</Text>
            <Text className="mt-2 text-[13px] text-white/75">{isBuyer ? 'Commission saved' : 'Commission earned'}</Text>
            <Text className="text-[30px] font-bold text-white">{formatAed(isBuyer ? stats.closedValue * 0.02 : stats.commissionEarned)}</Text>
            {!isBuyer && stats.commissionPending > 0 ? <Text className="mt-1 text-[12.5px] text-amber-300">{formatAed(stats.commissionPending)} pending payout</Text> : null}
          </LinearGradient>
        </View>

        {loading ? (
          <ActivityIndicator className="mt-8" color={colors.accent} />
        ) : closed.length === 0 ? (
          <View className="mt-6 items-center gap-3 rounded-apple border border-white/60 bg-white/60 px-8 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/10"><HistoryIcon size={28} color={colors.accent} /></View>
            <Text className="text-center text-[15px] text-graphite">No closed deals yet. Your completed transactions will appear here.</Text>
          </View>
        ) : (
          groups.map(([label, items]) => (
            <View key={label} className="mb-4">
              <Text className="mb-2 text-[13px] font-semibold text-graphite-light">{label}</Text>
              <View className="gap-3">
                {items.map((d) => {
                  const won = d.status === 'closed_won';
                  return (
                    <Pressable key={d.id} onPress={() => router.push(`/deal/${d.id}`)} className="flex-row items-center gap-3 rounded-apple border border-white/60 bg-white/75 p-4">
                      <View className={`h-10 w-10 items-center justify-center rounded-full ${won ? 'bg-emerald-500/12' : 'bg-black/5'}`}>
                        {won ? <CheckCircle2 size={20} color="#059669" /> : <XCircle size={20} color={colors.graphite} />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>{d.title || d.area || 'Deal'}</Text>
                        <Text className="text-[12.5px] text-graphite" numberOfLines={1}>{d.ref_code} · {won ? 'Closed' : 'Not closed'} · {formatDate(d.created_at)}</Text>
                      </View>
                      <Text className="text-[14px] font-semibold text-ink">{d.commission_amount_aed != null ? formatAed(d.commission_amount_aed) : d.deal_value_aed != null ? formatAed(d.deal_value_aed) : ''}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
