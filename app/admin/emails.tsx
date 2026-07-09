import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { adminListEmails, type EmailLogRow } from '@/lib/admin';
import { GlassBg } from '@/components/Glass';
import { FadeIn } from '@/components/Press';
import { formatDate, formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty } from './_ui';

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  sent: { bg: 'rgba(52,211,153,0.16)', fg: '#34d399' },
  queued: { bg: 'rgba(245,158,11,0.16)', fg: '#fbbf24' },
  skipped: { bg: 'rgba(160,160,166,0.16)', fg: '#a1a1a6' },
  failed: { bg: 'rgba(255,90,90,0.16)', fg: '#ff6b6b' },
};

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

  const load = useCallback(async () => { setRows(await adminListEmails(150)); }, []);
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
      <AdminHeader title="Emails" insetTop={insets.top} />

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {rows.length === 0 ? (
            <Empty text="No emails logged yet." />
          ) : (
            <View className="gap-3">
              {rows.map((r, i) => (
                <FadeIn key={r.id} delay={Math.min(i, 10) * 25}>
                  <View className="rounded-apple border border-hairline bg-surface p-4">
                    <View className="flex-row items-center justify-between">
                      <StatusChip status={r.status} />
                      <Text className="text-[11.5px] text-graphite-light">{formatDate(r.created_at)} {formatTime(r.created_at)}</Text>
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
          )}
        </ScrollView>
      )}
    </View>
  );
}
