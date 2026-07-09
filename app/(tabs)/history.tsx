import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { History as HistoryIcon, Search, CheckCircle2, XCircle } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { getMyDeals, computeStats, type Deal } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { PeriodFilter, SortToggle, DayHeader } from '@/components/ListKit';
import { groupByDay, inPeriod, sortByDate, type Period, type PeriodState, type SortDir } from '@/lib/dates';
import { formatAed, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';

const MONTH = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const amountOf = (d: Deal) => d.commission_amount_aed ?? d.deal_value_aed ?? 0;
const DAY_MS = 86_400_000;
const SHORT_PERIODS: Period[] = ['today', 'yesterday', '7d'];

export default function HistoryTab() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortDir>('newest');
  const [period, setPeriod] = useState<PeriodState>({ period: 'all' });

  const load = useCallback(async () => { setDeals(await getMyDeals()); }, []);
  useEffect(() => { if (session) load().finally(() => setLoading(false)); }, [session, load]);
  useFocusEffect(useCallback(() => { if (session) load(); }, [session, load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }, [load]);

  const isBuyer = profile?.role === 'buyer';

  // Summary stats follow the selected period (like the list below).
  const stats = useMemo(() => computeStats(deals.filter((d) => inPeriod(d.created_at, period))), [deals, period]);

  // Day groups for short periods, GPay-style month groups otherwise.
  const dayMode = SHORT_PERIODS.includes(period.period) ||
    (period.period === 'custom' && !!period.from && !!period.to && +period.to - +period.from <= 6 * DAY_MS);

  const groups = useMemo(() => {
    let closed = deals.filter((d) => d.status === 'closed_won' || d.status === 'closed_lost');
    closed = closed.filter((d) => inPeriod(d.created_at, period));
    if (q.trim()) { const n = q.toLowerCase(); closed = closed.filter((d) => [d.title, d.area, d.ref_code].filter(Boolean).some((s) => s!.toLowerCase().includes(n))); }
    const sorted = sortByDate(closed, (d) => d.created_at, sort);
    if (dayMode) return groupByDay(sorted, (d) => d.created_at);
    const map = new Map<string, Deal[]>();
    for (const d of sorted) { const k = MONTH(d.created_at); (map.get(k) ?? map.set(k, []).get(k)!).push(d); }
    return Array.from(map.entries());
  }, [deals, q, period, sort, dayMode]);

  const filtersOn = Boolean(q.trim()) || period.period !== 'all';

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 12 }} className="px-4 pb-1">
        <Text className="mb-3 text-[24px] font-bold text-ink">History</Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-2.5">
            <Search size={17} color={colors.graphiteLight} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search transactions" placeholderTextColor={colors.graphiteLight} className="flex-1 text-[15px] text-ink" />
          </View>
          <SortToggle value={sort} onChange={setSort} />
        </View>
        <View className="mt-3">
          <PeriodFilter value={period} onChange={setPeriod} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-16" color={colors.accent} />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 110 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
          {/* Light summary card — reflects the selected period */}
          <FadeIn>
          <View className="mb-5 rounded-[22px] border border-hairline bg-surface p-5">
            <Text className="text-[13px] text-graphite">{isBuyer ? 'Commission saved' : 'Commission earned'}</Text>
            <Text className="mt-1 text-[32px] font-bold text-accent">{formatAed(isBuyer ? stats.closedValue * 0.02 : stats.commissionEarned)}</Text>
            <View className="mt-3 flex-row gap-6">
              <View><Text className="text-[18px] font-bold text-ink">{stats.closedCount}</Text><Text className="text-[12px] text-graphite">Deals closed</Text></View>
              <View><Text className="text-[18px] font-bold text-ink">{formatAed(stats.closedValue)}</Text><Text className="text-[12px] text-graphite">Total value</Text></View>
              {!isBuyer && stats.commissionPending > 0 ? <View><Text className="text-[18px] font-bold" style={{ color: '#fbbf24' }}>{formatAed(stats.commissionPending)}</Text><Text className="text-[12px] text-graphite">Pending</Text></View> : null}
            </View>
          </View>
          </FadeIn>

          {groups.length === 0 ? (
            <View className="mt-6 items-center gap-3 rounded-apple border border-hairline bg-surface px-8 py-10">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/10"><HistoryIcon size={28} color={colors.accent} /></View>
              <Text className="text-center text-[15px] text-graphite">{filtersOn ? 'No transactions match your filters.' : 'No closed deals yet. Your completed transactions will appear here.'}</Text>
            </View>
          ) : (
            groups.map(([label, items], gi) => (
              <FadeIn key={label} delay={Math.min(gi + 1, 10) * 40}>
              <View className="mb-5">
                {/* Group header with total (GPay style) */}
                <DayHeader label={label} right={formatAed(items.reduce((s, d) => s + amountOf(d), 0))} />
                <View className="overflow-hidden rounded-apple border border-hairline bg-surface">
                  {items.map((d, i) => {
                    const won = d.status === 'closed_won';
                    return (
                      <Press key={d.id} onPress={() => router.push(`/deal/${d.id}`)} className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-hairline' : ''}`}>
                        <View className={`h-10 w-10 items-center justify-center rounded-full ${won ? 'bg-accent/12' : 'bg-surface2'}`}>
                          {won ? <CheckCircle2 size={20} color={colors.accent} /> : <XCircle size={20} color={colors.graphite} />}
                        </View>
                        <View className="flex-1">
                          <Text className="text-[14.5px] font-semibold text-ink" numberOfLines={1}>{d.title || d.area || 'Deal'}</Text>
                          <Text className="text-[12px] text-graphite" numberOfLines={1}>{formatDate(d.created_at)} · {won ? 'Closed' : 'Not closed'}</Text>
                        </View>
                        <Text className="text-[14.5px] font-bold text-ink">{formatAed(amountOf(d))}</Text>
                      </Press>
                    );
                  })}
                </View>
              </View>
              </FadeIn>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
