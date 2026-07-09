import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { adminGetDeals, STATUS_LABEL, type DealWithUser, type DealStatus } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { StatusBadge } from '@/components/DealUI';
import { Press, FadeIn } from '@/components/Press';
import { formatAed, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty, Chip } from './_ui';

type FilterKey = 'all' | DealStatus;
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: STATUS_LABEL.submitted },
  { key: 'in_discussion', label: STATUS_LABEL.in_discussion },
  { key: 'closed_won', label: STATUS_LABEL.closed_won },
  { key: 'closed_lost', label: STATUS_LABEL.closed_lost },
];

export default function AdminInquiries() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const [deals, setDeals] = useState<DealWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => { setDeals(await adminGetDeals()); }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((d) => {
      if (filter !== 'all' && d.status !== filter) return false;
      if (!q) return true;
      return [d.title, d.project, d.area, d.ref_code, d.submitter?.full_name, d.submitter?.email, d.submitter?.phone]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [deals, filter, query]);

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader title="Inquiries" insetTop={insets.top} />

      <View className="px-4 pb-2">
        <View className="flex-row items-center gap-2 rounded-2xl border border-hairline bg-surface2 px-3.5">
          <Search size={17} color={colors.graphiteLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, ref, project…"
            placeholderTextColor={colors.graphiteLight}
            className="flex-1 py-3 text-[15px] text-ink"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-[52px]" contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 6 }}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {shown.length === 0 ? (
            <Empty text="No matching inquiries." />
          ) : (
            <View className="gap-3">
              {shown.map((d, i) => (
                <FadeIn key={d.id} delay={Math.min(i, 8) * 30}>
                  <Press onPress={() => router.push(`/admin/${d.id}`)} className="rounded-apple border border-hairline bg-surface p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <StatusBadge status={d.status} />
                        <Text className="text-[11.5px] font-medium uppercase text-graphite">
                          {d.kind === 'buy' ? 'Buyer' : d.kind === 'sell' ? 'Seller' : d.is_referral ? 'Referral' : 'Broker'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.graphiteLight} />
                    </View>
                    <Text className="mt-2 text-[15px] font-semibold text-ink" numberOfLines={1}>{d.title || d.project || d.area || 'Inquiry'}</Text>
                    <Text className="text-[13px] text-graphite" numberOfLines={1}>
                      {d.submitter?.full_name || d.submitter?.email || 'Unknown'}{d.submitter?.phone ? ` · ${d.submitter.phone}` : ''}
                    </Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-[12.5px] text-graphite-light">{d.ref_code} · {formatDate(d.created_at)}</Text>
                      <Text className="text-[14px] font-semibold text-ink">
                        {d.deal_value_aed != null ? formatAed(d.deal_value_aed) : d.budget_aed != null ? formatAed(d.budget_aed) : '—'}
                      </Text>
                    </View>
                  </Press>
                </FadeIn>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
