import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { adminListEmails, type EmailLogRow } from '@/lib/admin';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { FilterControl, DayHeader } from '@/components/ListKit';
import { inPeriod, groupByDay, sortByDate, type PeriodState, type SortDir } from '@/lib/dates';
import { formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty } from './_ui';

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  sent: { bg: 'rgba(52,211,153,0.16)', fg: '#34d399' },
  queued: { bg: 'rgba(245,158,11,0.16)', fg: '#fbbf24' },
  sending: { bg: 'rgba(245,158,11,0.16)', fg: '#fbbf24' },
  skipped: { bg: 'rgba(160,160,166,0.16)', fg: '#a1a1a6' },
  failed: { bg: 'rgba(255,90,90,0.16)', fg: '#ff6b6b' },
};

type StatusFilter = 'all' | 'sent' | 'queued' | 'failed';
const STATUS_FILTERS: StatusFilter[] = ['all', 'sent', 'queued', 'failed'];

function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.skipped;
  return (
    <View style={{ backgroundColor: s.bg }} className="self-start rounded-full px-2.5 py-1">
      <Text style={{ color: s.fg }} className="text-[11.5px] font-semibold capitalize">{status}</Text>
    </View>
  );
}

export default function AdminEmails() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<EmailLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [period, setPeriod] = useState<PeriodState>({ period: 'all' });
  const [sort, setSort] = useState<SortDir>('newest');

  const load = useCallback(async () => { setRows(await adminListEmails(200)); }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (status === 'queued' ? !['queued', 'sending'].includes(r.status) : status !== 'all' && r.status !== status) return false;
      if (!inPeriod(r.created_at, period)) return false;
      if (!q) return true;
      return [r.subject, r.to_email, r.to_name, r.audience].some((v) => v?.toLowerCase().includes(q));
    });
    return sortByDate(filtered, (r) => r.created_at, sort);
  }, [rows, query, status, period, sort]);

  const groups = useMemo(() => groupByDay(shown, (r) => r.created_at), [shown]);

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  let i = 0;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader title="Emails" insetTop={insets.top} />

      <View className="flex-row items-center gap-2 px-4 pb-2">
        <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-hairline bg-surface2 px-3.5">
          <Search size={17} color={colors.graphiteLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search subject, recipient…"
            placeholderTextColor={colors.graphiteLight}
            className="flex-1 py-3 text-[15px] text-ink"
          />
        </View>
        <FilterControl period={period} onPeriod={setPeriod} sort={sort} onSort={setSort} />
      </View>

      <View className="flex-row gap-2 px-4 pb-2">
        {STATUS_FILTERS.map((k) => {
          const active = status === k;
          return (
            <Press
              key={k}
              onPress={() => setStatus(k)}
              className={`rounded-full px-3.5 py-2 ${active ? 'bg-accent' : 'border border-hairline bg-surface2'}`}
            >
              <Text className="text-[13px] font-semibold capitalize" style={{ color: active ? colors.onAccent : colors.ink }}>{k}</Text>
            </Press>
          );
        })}
      </View>

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {shown.length === 0 ? (
            <Empty text="No emails found." />
          ) : (
            groups.map(([label, items]) => (
              <View key={label} className="mb-2">
                <DayHeader label={label} right={`${items.length}`} />
                <View className="gap-3 pb-1">
                  {items.map((r) => (
                    <FadeIn key={r.id} delay={Math.min(i++, 10) * 25}>
                      <View className="rounded-apple border border-hairline bg-surface p-4">
                        <View className="flex-row items-center justify-between">
                          <StatusChip status={r.status} />
                          <Text className="text-[11.5px] text-graphite-light">{formatTime(r.created_at)}</Text>
                        </View>
                        <Text className="mt-2 text-[15px] font-semibold text-ink" numberOfLines={1}>{r.subject}</Text>
                        <Text className="text-[12.5px] text-graphite" numberOfLines={1}>
                          {r.to_name ? `${r.to_name} · ` : ''}{r.to_email}{r.audience ? ` · ${r.audience}` : ''}
                        </Text>
                        {r.status === 'failed' && r.error ? (
                          <Text className="mt-2 text-[12px]" style={{ color: '#ff6b6b' }} numberOfLines={3}>{r.error}</Text>
                        ) : null}
                      </View>
                    </FadeIn>
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
