import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ArrowDownUp, ClipboardList } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { getMyDeals, type Deal, type DealStatus } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { StatusBadge } from '@/components/DealUI';
import { formatAed, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';

const FILTERS: { key: 'all' | DealStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'in_discussion', label: 'In discussion' },
  { key: 'closed_won', label: 'Closed' },
  { key: 'closed_lost', label: 'Not closed' },
];
type Sort = 'newest' | 'oldest' | 'value';
const SORT_LABEL: Record<Sort, string> = { newest: 'Newest', oldest: 'Oldest', value: 'Value' };

export default function Inquiries() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [sort, setSort] = useState<Sort>('newest');

  const load = useCallback(async () => { setDeals(await getMyDeals()); }, []);
  useEffect(() => { if (session) load().finally(() => setLoading(false)); }, [session, load]);
  useFocusEffect(useCallback(() => { if (session) load(); }, [session, load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }, [load]);

  const shown = useMemo(() => {
    const val = (d: Deal) => d.deal_value_aed ?? d.budget_aed ?? 0;
    let list = deals.filter((d) => filter === 'all' || d.status === filter);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((d) => [d.title, d.area, d.project, d.ref_code].filter(Boolean).some((s) => s!.toLowerCase().includes(needle)));
    }
    return [...list].sort((a, b) =>
      sort === 'value' ? val(b) - val(a) : sort === 'oldest' ? +new Date(a.created_at) - +new Date(b.created_at) : +new Date(b.created_at) - +new Date(a.created_at),
    );
  }, [deals, q, filter, sort]);

  const nextSort = () => setSort((s) => (s === 'newest' ? 'oldest' : s === 'oldest' ? 'value' : 'newest'));

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-1">
        <Text className="mb-3 text-[24px] font-bold text-ink">Inquiries</Text>
        {/* Search + sort */}
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3.5 py-2.5">
            <Search size={17} color={colors.graphiteLight} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search by name, area, ref…" placeholderTextColor={colors.graphiteLight} className="flex-1 text-[15px] text-ink" />
          </View>
          <Pressable onPress={nextSort} className="flex-row items-center gap-1.5 rounded-2xl border border-white/60 bg-white/70 px-3">
            <ArrowDownUp size={16} color={colors.ink} /><Text className="text-[13px] font-semibold text-ink">{SORT_LABEL[sort]}</Text>
          </Pressable>
        </View>
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          {FILTERS.map((f) => (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} className={`rounded-full px-3.5 py-2 ${filter === f.key ? 'bg-ink' : 'bg-black/5'}`}>
              <Text className={`text-[13px] font-semibold ${filter === f.key ? 'text-white' : 'text-ink'}`}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-16" color={colors.accent} />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
          {shown.length === 0 ? (
            <View className="mt-10 items-center gap-3 px-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/10"><ClipboardList size={28} color={colors.accent} /></View>
              <Text className="text-center text-[15px] text-graphite">{q || filter !== 'all' ? 'No inquiries match your filters.' : 'No inquiries yet — tap ＋ to add one.'}</Text>
            </View>
          ) : (
            <View className="gap-3">
              {shown.map((d) => (
                <Pressable key={d.id} onPress={() => router.push(`/deal/${d.id}`)} className="rounded-apple border border-white/60 bg-white/75 p-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>{d.title || d.area || 'Inquiry'}</Text>
                      <Text className="mt-0.5 text-[12.5px] text-graphite" numberOfLines={1}>{d.ref_code} · {[d.emirate, d.area].filter(Boolean).join(' · ') || formatDate(d.created_at)}</Text>
                    </View>
                    {d.is_referral ? <View className="rounded-full bg-journey-agent/40 px-2 py-0.5"><Text className="text-[10px] font-semibold text-ink">Referral</Text></View> : null}
                  </View>
                  <View className="mt-3 flex-row items-center justify-between">
                    <StatusBadge status={d.status} />
                    <Text className="text-[14px] font-semibold text-ink">{d.commission_amount_aed != null ? formatAed(d.commission_amount_aed) : d.deal_value_aed != null ? formatAed(d.deal_value_aed) : d.budget_aed != null ? formatAed(d.budget_aed) : ''}</Text>
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
