import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect, Redirect, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ClipboardList, Users, UserCog, HelpCircle, Settings, Mail, History,
  LogOut, ChevronRight, TrendingUp,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { adminGetStats, adminListAudit, type AdminStats, type AuditEntry } from '@/lib/admin';
import { STATUS_LABEL, type DealStatus } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { Press, FadeIn } from '@/components/Press';
import { formatAedShort } from '@/lib/format';
import { formatTime, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { Loading } from './_ui';

const SECTIONS: { label: string; sub: string; href: Href; Icon: typeof Users }[] = [
  { label: 'Inquiries', sub: 'Deals & pipeline', href: '/admin/inquiries', Icon: ClipboardList },
  { label: 'Users', sub: 'Roles & managers', href: '/admin/users', Icon: Users },
  { label: 'Account managers', sub: 'The team', href: '/admin/managers', Icon: UserCog },
  { label: 'FAQs', sub: 'Help content', href: '/admin/faqs', Icon: HelpCircle },
  { label: 'Global settings', sub: 'Contact channels', href: '/admin/settings', Icon: Settings },
  { label: 'Emails', sub: 'Outbox log', href: '/admin/emails', Icon: Mail },
  { label: 'Audit trail', sub: 'Every change', href: '/admin/audit', Icon: History },
];

const STATUS_ORDER: DealStatus[] = ['submitted', 'in_discussion', 'closed_won', 'closed_lost'];
const BAR_COLOR: Record<DealStatus, string> = {
  submitted: colors.graphiteLight,
  in_discussion: colors.graphite,
  closed_won: colors.accent,
  closed_lost: '#3a3a3e',
};

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { session, profile, isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, a] = await Promise.all([adminGetStats(), adminListAudit(8)]);
    setStats(s);
    setAudit(a);
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  const firstName = (profile?.full_name || session?.user.email?.split('@')[0] || 'admin').split(' ')[0];
  const maxBar = Math.max(1, ...STATUS_ORDER.map((s) => stats?.byStatus[s] ?? 0));

  const kpis = stats
    ? [
        { label: 'Users', value: String(stats.users) },
        { label: 'Deals', value: String(stats.deals) },
        { label: 'Active', value: String(stats.active) },
        { label: 'Closed', value: String(stats.closed) },
        { label: 'Commission paid', value: formatAedShort(stats.commissionPaid), accent: true },
        { label: 'Payout pending', value: formatAedShort(stats.commissionPending) },
      ]
    : [];

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Wordmark size={24} />
          <Press
            onPress={() => supabase.auth.signOut()}
            className="flex-row items-center gap-1.5 rounded-full border border-hairline bg-surface2 px-3 py-2"
          >
            <LogOut size={15} color={colors.ink} />
            <Text className="text-[13px] font-semibold text-ink">Sign out</Text>
          </Press>
        </View>

        <Text className="text-[26px] font-semibold text-ink">Hi {firstName}</Text>
        <Text className="mb-4 text-[14.5px] text-graphite">Admin console — the whole operation at a glance.</Text>

        {loading || !stats ? (
          <Loading />
        ) : (
          <>
            {/* KPI grid */}
            <View className="mb-3 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
              {kpis.map((k, i) => (
                <FadeIn key={k.label} delay={i * 40} style={{ width: '33.333%', padding: 4 }}>
                  <View className="rounded-apple border border-hairline bg-surface px-3 py-3.5">
                    <Text
                      className="text-[19px] font-bold"
                      style={{ color: k.accent ? colors.accent : colors.ink }}
                      numberOfLines={1}
                    >
                      {k.value}
                    </Text>
                    <Text className="mt-0.5 text-[11.5px] text-graphite" numberOfLines={1}>{k.label}</Text>
                  </View>
                </FadeIn>
              ))}
            </View>

            {/* Pipeline mini-bar */}
            <View className="mb-4 rounded-apple border border-hairline bg-surface p-4">
              <View className="mb-3 flex-row items-center gap-1.5">
                <TrendingUp size={15} color={colors.accent} />
                <Text className="text-[13px] font-semibold text-graphite">Pipeline by status</Text>
              </View>
              <View className="flex-row items-end justify-around" style={{ height: 96 }}>
                {STATUS_ORDER.map((s) => {
                  const n = stats.byStatus[s] ?? 0;
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

            {/* Section navigation */}
            <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-graphite">Manage</Text>
            <View className="mb-5 gap-2.5">
              {SECTIONS.map((sec, i) => (
                <FadeIn key={sec.label} delay={i * 30}>
                  <Press
                    onPress={() => router.push(sec.href)}
                    className="flex-row items-center gap-3 rounded-apple border border-hairline bg-surface p-3.5"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
                      <sec.Icon size={19} color={colors.accent} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-ink">{sec.label}</Text>
                      <Text className="text-[12.5px] text-graphite">{sec.sub}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.graphiteLight} />
                  </Press>
                </FadeIn>
              ))}
            </View>

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
                {audit.map((a) => (
                  <View key={a.id} className="rounded-apple border border-hairline bg-surface px-4 py-3">
                    <Text className="text-[13.5px] font-medium text-ink" numberOfLines={2}>{a.summary || `${a.action} ${a.entity}`}</Text>
                    <Text className="mt-0.5 text-[11.5px] text-graphite-light">
                      {a.actor_email || 'system'} · {formatDate(a.created_at)} {formatTime(a.created_at)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
