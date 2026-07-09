import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { adminListAudit, type AuditEntry } from '@/lib/admin';
import { GlassBg } from '@/components/Glass';
import { FadeIn } from '@/components/Press';
import { formatDate, formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty } from './_ui';

const ACTION_COLOR: Record<string, string> = {
  create: '#34d399',
  update: colors.accent,
  delete: '#ff6b6b',
};

export default function AdminAudit() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => { setRows(await adminListAudit(150)); }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader title="Audit trail" insetTop={insets.top} />

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {rows.length === 0 ? (
            <Empty text="No audit entries yet." />
          ) : (
            <View className="gap-2.5">
              {rows.map((a, i) => (
                <FadeIn key={a.id} delay={Math.min(i, 10) * 20}>
                  <View className="rounded-apple border border-hairline bg-surface px-4 py-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[11.5px] font-bold uppercase" style={{ color: ACTION_COLOR[a.action] ?? colors.graphite }}>{a.action}</Text>
                        <Text className="text-[11.5px] font-medium uppercase text-graphite">{a.entity}</Text>
                      </View>
                      <Text className="text-[11.5px] text-graphite-light">{formatDate(a.created_at)} {formatTime(a.created_at)}</Text>
                    </View>
                    <Text className="mt-1 text-[14px] font-medium text-ink">{a.summary || '—'}</Text>
                    <Text className="mt-0.5 text-[11.5px] text-graphite-light" numberOfLines={1}>{a.actor_email || 'system'}</Text>
                  </View>
                </FadeIn>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
