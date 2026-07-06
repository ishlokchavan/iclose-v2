import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { adminGetDeals, type DealWithUser } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { StatusBadge } from '@/components/DealUI';
import { formatAed, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';

const FILTERS = [
  { key: 'active', label: 'Active', match: (d: DealWithUser) => d.status === 'submitted' || d.status === 'in_discussion' },
  { key: 'closed', label: 'Closed', match: (d: DealWithUser) => d.status === 'closed_won' || d.status === 'closed_lost' },
  { key: 'all', label: 'All', match: () => true },
] as const;

export default function AdminList() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const [deals, setDeals] = useState<DealWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('active');

  const load = useCallback(async () => { setDeals(await adminGetDeals()); }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  if (!authLoading && !isAdmin) return <Redirect href="/dashboard" />;

  const active = FILTERS.find((f) => f.key === filter)!;
  const shown = deals.filter(active.match);

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/5"><ChevronLeft size={22} color={colors.ink} /></Pressable>
        <Text className="text-[17px] font-semibold text-ink">Admin · Deals</Text>
      </View>

      <View className="flex-row gap-2 px-4 pb-2 pt-1">
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)} className={`rounded-full px-4 py-2 ${filter === f.key ? 'bg-ink' : 'bg-black/5'}`}>
            <Text className={`text-[13px] font-semibold ${filter === f.key ? 'text-white' : 'text-ink'}`}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator className="mt-20" color={colors.accent} />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
          {shown.length === 0 ? (
            <Text className="mt-16 text-center text-graphite">No {active.label.toLowerCase()} deals.</Text>
          ) : (
            <View className="gap-3">
              {shown.map((d) => (
                <Pressable key={d.id} onPress={() => router.push(`/admin/${d.id}`)} className="rounded-apple border border-white/60 bg-white/75 p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <StatusBadge status={d.status} />
                      <Text className="text-[11.5px] font-medium uppercase text-graphite">{d.kind === 'buy' ? 'Buyer' : d.kind === 'sell' ? 'Seller' : d.is_referral ? 'Referral' : 'Broker'}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.graphiteLight} />
                  </View>
                  <Text className="mt-2 text-[15px] font-semibold text-ink" numberOfLines={1}>{d.title || d.project || d.area || 'Inquiry'}</Text>
                  <Text className="text-[13px] text-graphite" numberOfLines={1}>
                    {d.submitter?.full_name || d.submitter?.email || 'Unknown'}{d.submitter?.phone ? ` · ${d.submitter.phone}` : ''}
                  </Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-[12.5px] text-graphite-light">{formatDate(d.created_at)}</Text>
                    <Text className="text-[14px] font-semibold text-ink">{d.deal_value_aed != null ? formatAed(d.deal_value_aed) : d.budget_aed != null ? formatAed(d.budget_aed) : '—'}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
