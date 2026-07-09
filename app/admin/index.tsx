import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Inbox, Banknote, TrendingUp, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { adminGetStats, adminListAudit, type AdminStats, type AuditEntry } from '@/lib/admin';
import { adminGetDeals, STATUS_LABEL, type DealWithUser, type DealStatus } from '@/lib/deals';
import { inPeriod, type PeriodState } from '@/lib/dates';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { Press, FadeIn } from '@/components/Press';
import { PeriodFilter } from '@/components/ListKit';
import { formatAedShort, formatDate, formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { Loading, StatTile } from './_ui';

const STATUS_ORDER: DealStatus[] = ['submitted', 'in_discussion', 'closed_won', 'closed_lost'];
const BAR_COLOR: Record<DealStatus, string> = {
  submitted: colors.graphiteLight,
  in_discussion: colors.graphite,
  closed_won: colors.accent,
  closed_lost: '#3a3a3e',
};

/** "today" / "3d" / "2w" — how long a deal has been sitting untouched. */
function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const [deals, setDeals] = useState<DealWithUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [period, setPeriod] = useState<PeriodState>({ period: 'all' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [d, s, a] = await Promise.all([adminGetDeals(), adminGetStats(), adminListAudit(6)]);
    setDeals(d);
    setStats(s);
    setAudit(a);
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  // ---- Period-scoped stats (client-side from the full deal list) ----------
  const scoped = useMemo(() => deals.filter((d) => inPeriod(d.created_at, period)), [deals, period]);
  const kpi = useMemo(() => {
    const k = { inquiries: scoped.length, active: 0, closed: 0, closedValue: 0, paid: 0, pending: 0, byStatus: { submitted: 0, in_discussion: 0, closed_won: 0, closed_lost: 0 } as Record<DealStatus, number> };
    for (const d of scoped) {
      k.byStatus[d.status] += 1;
      if (d.status === 'submitted' || d.status === 'in_discussion') k.active += 1;
      if (d.status === 'closed_won') {
        k.closed += 1;
        k.closedValue += Number(d.deal_value_aed ?? 0);
        if (d.commission_status === 'pending') k.pending += Number(d.commission_amount_aed ?? 0);
      }
      if (d.commission_status === 'paid') k.paid += Number(d.commission_amount_aed ?? 0);
    }
    return k;
  }, [scoped]);

  // ---- Needs attention (never period-filtered — always actionable) --------
  const untouched = useMemo(
    () => deals.filter((d) => d.status === 'submitted').sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [deals],
  );
  const payoutsDue = useMemo(
    () => deals.filter((d) => d.status === 'closed_won' && d.commission_status === 'pending').sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [deals],
  );

  const firstName = (profile?.full_name || session?.user.email?.split('@')[0] || 'admin').split(' ')[0];
  const maxBar = Math.max(1, ...STATUS_ORDER.map((s) => kpi.byStatus[s]));

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Wordmark size={24} />
          <View className="rounded-full bg-accent/10 px-2.5 py-1">
            <Text className="text-[11.5px] font-semibold text-accent">Admin</Text>
          </View>
        </View>
        <Text className="text-[26px] font-semibold text-ink">Hi {firstName}</Text>
        <Text className="mb-4 text-[14.5px] text-graphite">The whole operation at a glance.</Text>

        {loading ? (
          <Loading />
        ) : (
          <>
            {/* Period scope */}
            <View className="mb-3">
              <PeriodFilter value={period} onChange={setPeriod} />
            </View>

            {/* KPI grid — counts (tappable) then money */}
            <View className="mb-3 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
              {[
                { label: 'New inquiries', value: String(kpi.inquiries), w: '33.333%' as const, onPress: () => router.push('/admin/inquiries') },
                { label: 'Active', value: String(kpi.active), w: '33.333%' as const, onPress: () => router.push('/admin/inquiries') },
                { label: 'Closed', value: String(kpi.closed), w: '33.333%' as const, onPress: () => router.push('/admin/inquiries') },
                { label: 'Closed value', value: formatAedShort(kpi.closedValue), w: '50%' as const },
                { label: 'Commission paid', value: formatAedShort(kpi.paid), w: '50%' as const, accent: true },
                { label: 'Payout pending', value: formatAedShort(kpi.pending), w: '50%' as const },
                { label: 'Users', value: String(stats?.users ?? 0), w: '50%' as const, onPress: () => router.push('/admin/users') },
              ].map((k, i) => (
                <FadeIn key={k.label} delay={i * 40} style={{ width: k.w, padding: 4 }}>
                  <StatTile label={k.label} value={k.value} accent={k.accent} onPress={k.onPress} />
                </FadeIn>
              ))}
            </View>

            {/* Needs attention — the operational core */}
            <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-graphite">Needs attention</Text>
            {untouched.length === 0 && payoutsDue.length === 0 ? (
              <FadeIn>
                <View className="mb-4 flex-row items-center gap-3 rounded-apple border border-hairline bg-surface p-4">
                  <CheckCircle2 size={20} color={colors.accent} />
                  <Text className="flex-1 text-[13.5px] text-graphite">All clear — no untouched inquiries and no payouts due.</Text>
                </View>
              </FadeIn>
            ) : (
              <View className="mb-4 gap-2.5">
                {untouched.length > 0 ? (
                  <FadeIn>
                    <View className="overflow-hidden rounded-apple border border-hairline bg-surface">
                      <Press onPress={() => router.push('/admin/inquiries')} className="flex-row items-center gap-3 p-3.5">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
                          <Inbox size={19} color={colors.accent} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[15px] font-semibold text-ink">{untouched.length} untouched {untouched.length === 1 ? 'inquiry' : 'inquiries'}</Text>
                          <Text className="text-[12.5px] text-graphite">Still &lsquo;Submitted&rsquo; — nobody has replied yet</Text>
                        </View>
                        <ChevronRight size={18} color={colors.graphiteLight} />
                      </Press>
                      {untouched.slice(0, 3).map((d) => (
                        <AttentionRow
                          key={d.id}
                          title={d.title || d.project || d.ref_code}
                          sub={`${d.submitter?.full_name || d.submitter?.email || 'Unknown'} · ${formatDate(d.created_at)}`}
                          right={`${ageLabel(d.created_at)} old`}
                          onPress={() => router.push(`/admin/${d.id}`)}
                        />
                      ))}
                    </View>
                  </FadeIn>
                ) : null}

                {payoutsDue.length > 0 ? (
                  <FadeIn delay={60}>
                    <View className="overflow-hidden rounded-apple border border-hairline bg-surface">
                      <View className="flex-row items-center gap-3 p-3.5">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
                          <Banknote size={19} color={colors.accent} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[15px] font-semibold text-ink">{payoutsDue.length} {payoutsDue.length === 1 ? 'payout' : 'payouts'} due</Text>
                          <Text className="text-[12.5px] text-graphite">Closed deals with commission still pending</Text>
                        </View>
                      </View>
                      {payoutsDue.slice(0, 3).map((d) => (
                        <AttentionRow
                          key={d.id}
                          title={d.title || d.project || d.ref_code}
                          sub={d.submitter?.full_name || d.submitter?.email || 'Unknown'}
                          right={formatAedShort(d.commission_amount_aed)}
                          rightAccent
                          onPress={() => router.push(`/admin/${d.id}`)}
                        />
                      ))}
                    </View>
                  </FadeIn>
                ) : null}
              </View>
            )}

            {/* Pipeline mini-bar (respects the period filter) */}
            <FadeIn delay={80}>
              <View className="mb-4 rounded-apple border border-hairline bg-surface p-4">
                <View className="mb-3 flex-row items-center gap-1.5">
                  <TrendingUp size={15} color={colors.accent} />
                  <Text className="text-[13px] font-semibold text-graphite">Pipeline by status</Text>
                </View>
                <View className="flex-row items-end justify-around" style={{ height: 96 }}>
                  {STATUS_ORDER.map((s) => {
                    const n = kpi.byStatus[s];
                    return (
                      <View key={s} className="flex-1 items-center gap-1.5">
                        <Text className="text-[13px] font-bold text-ink">{n}</Text>
                        <View style={{ width: 30, height: Math.max(6, (n / maxBar) * 60), backgroundColor: BAR_COLOR[s], borderRadius: 8 }} />
                        <Text className="text-center text-[10.5px] text-graphite" numberOfLines={1}>{STATUS_LABEL[s]}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </FadeIn>

            {/* Recent activity */}
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold uppercase tracking-wide text-graphite">Recent activity</Text>
              <Press onPress={() => router.push('/admin/audit')}>
                <Text className="text-[13px] font-semibold" style={{ color: colors.accent }}>View all</Text>
              </Press>
            </View>
            {audit.length === 0 ? (
              <Text className="py-6 text-center text-graphite">No activity yet.</Text>
            ) : (
              <View className="gap-2.5">
                {audit.map((a, i) => (
                  <FadeIn key={a.id} delay={i * 30}>
                    <View className="rounded-apple border border-hairline bg-surface px-4 py-3">
                      <Text className="text-[13.5px] font-medium text-ink" numberOfLines={2}>{a.summary || `${a.action} ${a.entity}`}</Text>
                      <Text className="mt-0.5 text-[11.5px] text-graphite-light">
                        {a.actor_email || 'system'} · {formatDate(a.created_at)} {formatTime(a.created_at)}
                      </Text>
                    </View>
                  </FadeIn>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function AttentionRow({ title, sub, right, rightAccent, onPress }: { title: string; sub: string; right: string; rightAccent?: boolean; onPress: () => void }) {
  return (
    <Press onPress={onPress} className="flex-row items-center gap-3 border-t border-hairline px-4 py-3">
      <View className="flex-1">
        <Text className="text-[13.5px] font-semibold text-ink" numberOfLines={1}>{title}</Text>
        <Text className="text-[11.5px] text-graphite" numberOfLines={1}>{sub}</Text>
      </View>
      <Text className="text-[12px] font-semibold" style={{ color: rightAccent ? colors.accent : colors.graphite }}>{right}</Text>
      <ChevronRight size={15} color={colors.graphiteLight} />
    </Press>
  );
}
