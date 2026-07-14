import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { adminListAudit, type AuditEntry } from '@/lib/admin';
import { GlassBg } from '@/components/Glass';
import { FadeIn } from '@/components/Press';
import { FilterControl, DayHeader } from '@/components/ListKit';
import { inPeriod, groupByDay, sortByDate, type PeriodState, type SortDir } from '@/lib/dates';
import { formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty } from './_ui';

const ACTION_COLOR: Record<string, string> = {
  create: '#34d399',
  update: colors.accent,
  delete: '#ff6b6b',
  deactivate: '#ff6b6b',
  activate: '#34d399',
};

export default function AdminAudit() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<PeriodState>({ period: 'all' });
  const [sort, setSort] = useState<SortDir>('newest');

  const load = useCallback(async () => { setRows(await adminListAudit(200)); }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((a) => {
      if (!inPeriod(a.created_at, period)) return false;
      if (!q) return true;
      return [a.action, a.entity, a.summary, a.actor_email].some((v) => v?.toLowerCase().includes(q));
    });
    return sortByDate(filtered, (a) => a.created_at, sort);
  }, [rows, query, period, sort]);

  const groups = useMemo(() => groupByDay(shown, (a) => a.created_at), [shown]);

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  let i = 0;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader title="Audit trail" insetTop={insets.top} />

      <View className="flex-row items-center gap-2 px-4 pb-2">
        <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-hairline bg-surface2 px-3.5">
          <Search size={17} color={colors.graphiteLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search action, entity, actor…"
            placeholderTextColor={colors.graphiteLight}
            className="flex-1 py-3 text-[15px] text-ink"
          />
        </View>
        <FilterControl period={period} onPeriod={setPeriod} sort={sort} onSort={setSort} />
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
            <Empty text="No audit entries found." />
          ) : (
            groups.map(([label, items]) => (
              <View key={label} className="mb-2">
                <DayHeader label={label} right={`${items.length}`} />
                <View className="gap-2.5 pb-1">
                  {items.map((a) => (
                    <FadeIn key={a.id} delay={Math.min(i++, 10) * 20}>
                      <View className="rounded-apple border border-hairline bg-surface px-4 py-3">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-[11.5px] font-bold uppercase" style={{ color: ACTION_COLOR[a.action] ?? colors.graphite }}>{a.action}</Text>
                            <Text className="text-[11.5px] font-medium uppercase text-graphite">{a.entity}</Text>
                          </View>
                          <Text className="text-[11.5px] text-graphite-light">{formatTime(a.created_at)}</Text>
                        </View>
                        <Text className="mt-1 text-[14px] font-medium text-ink">{a.summary || '—'}</Text>
                        <Text className="mt-0.5 text-[11.5px] text-graphite-light" numberOfLines={1}>{a.actor_email || 'system'}</Text>
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
