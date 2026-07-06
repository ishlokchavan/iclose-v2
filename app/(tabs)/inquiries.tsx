import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ArrowDownUp, ClipboardList } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { getMyDeals, type Deal, type DealStatus } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { StatusBadge } from '@/components/DealUI';
import { formatAed, formatDate, dayGroup } from '@/lib/format';
import { colors } from '@/theme/tokens';

// Active pipeline only — closed deals live in History.
const FILTERS: { key: 'all' | DealStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'in_discussion', label: 'In discussion' },
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

  const groups = useMemo(() => {
    const active = deals.filter((d) => d.status === 'submitted' || d.status === 'in_discussion');
    const val = (d: Deal) => d.deal_value_aed ?? d.budget_aed ?? 0;
    let list = active.filter((d) => filter === 'all' || d.status === filter);
    if (q.trim()) {
      const n = q.toLowerCase();
      list = list.filter((d) => [d.title, d.area, d.project, d.ref_code].filter(Boolean).some((s) => s!.toLowerCase().includes(n)));
    }
    list = [...list].sort((a, b) =>
      sort === 'value' ? val(b) - val(a) : sort === 'oldest' ? +new Date(a.created_at) - +new Date(b.created_at) : +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'value') return [['Sorted by value', list]] as [string, Deal[]][];
    const map = new Map<string, Deal[]>();
    for (const d of list) { const k = dayGroup(d.created_at); (map.get(k) ?? map.set(k, []).get(k)!).push(d); }
    return Array.from(map.entries());
  }, [deals, q, filter, sort]);

  const total = groups.reduce((s, [, items]) => s + items.length, 0);
  const nextSort = () => setSort((s) => (s === 'newest' ? 'oldest' : s === 'oldest' ? 'value' : 'newest'));

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-1">
        <Text className="mb-3 text-[24px] font-bold text-ink">Inquiries</Text>
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3.5 py-2.5">
            <Search size={17} color={colors.graphiteLight} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search by name, area, ref…" placeholderTextColor={colors.graphiteLight} className="flex-1 text-[15px] text-ink" />
          </View>
          <Pressable onPress={nextSort} className="flex-row items-center gap-1.5 rounded-2xl border border-white/60 bg-white/70 px-3">
            <ArrowDownUp size={16} color={colors.ink} /><Text className="text-[13px] font-semibold text-ink">{SORT_LABEL[sort]}</Text>
          </Pressable>
        </View>
        <View className="mt-3 flex-row gap-2">
          {FILTERS.map((f) => (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} className={`rounded-full px-3.5 py-2 ${filter === f.key ? 'bg-ink' : 'bg-black/5'}`}>
              <Text className={`text-[13px] font-semibold ${filter === f.key ? 'text-white' : 'text-ink'}`}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-16" color={colors.accent} />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
          {total === 0 ? (
            <View className="mt-10 items-center gap-3 px-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/10"><ClipboardList size={28} color={colors.accent} /></View>
              <Text className="text-center text-[15px] text-graphite">{q || filter !== 'all' ? 'No active inquiries match.' : 'No active inquiries — tap ＋ to add one.'}</Text>
            </View>
          ) : (
            groups.map(([label, items]) => (
              <View key={label} className="mb-4">
                <Text className="mb-2 text-[13px] font-semibold text-graphite-light">{label}</Text>
                <View className="gap-3">
                  {items.map((d) => (
                    <Pressable key={d.id} onPress={() => router.push(`/deal/${d.id}`)} className="rounded-apple border border-white/60 bg-white/75 p-4">
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>{d.title || d.area || 'Inquiry'}</Text>
                          <Text className="mt-0.5 text-[12.5px] text-graphite" numberOfLines={1}>{d.ref_code} · {[d.emirate, d.area].filter(Boolean).join(' · ') || formatDate(d.created_at)}</Text>
                        </View>
                        <Text className="text-[12px] text-graphite-light">{formatDate(d.created_at)}</Text>
                      </View>
                      <View className="mt-3 flex-row items-center justify-between">
                        <StatusBadge status={d.status} />
                        <Text className="text-[14px] font-semibold text-ink">{d.deal_value_aed != null ? formatAed(d.deal_value_aed) : d.budget_aed != null ? formatAed(d.budget_aed) : ''}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
