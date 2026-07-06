import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { router, useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ChevronRight, ShieldCheck, Inbox, MessageCircle, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { getMyDeals, computeStats, type Deal, type DashboardStats } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { Wordmark, StatusBadge } from '@/components/DealUI';
import { formatAed, formatAedShort, formatDate } from '@/lib/format';
import { CONTACT_WHATSAPP } from '@/lib/config';
import { colors } from '@/theme/tokens';

const NEW_LABEL = { buyer: 'New buying inquiry', seller: 'List a property', broker: 'New deal inquiry' } as const;
const SUBTITLE = {
  buyer: 'Track what you’re buying and your savings.',
  seller: 'Track your listing through to sale.',
  broker: 'Track your deals and commission.',
} as const;

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { session, profile, isAdmin, loading: authLoading } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const d = await getMyDeals();
    setDeals(d);
    setStats(computeStats(d));
  }, []);

  useEffect(() => { if (session) load().finally(() => setLoading(false)); }, [session, load]);
  useFocusEffect(useCallback(() => { if (session) load(); }, [session, load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  if (!authLoading && !session) return <Redirect href="/sign-in" />;

  const firstName = (profile?.full_name || session?.user.email?.split('@')[0] || 'there').split(' ')[0];
  const role = profile?.role ?? 'buyer';

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View className="mb-5 flex-row items-center justify-between">
          <Wordmark size={24} />
          <View className="flex-row items-center gap-2">
            {isAdmin ? (
              <Pressable onPress={() => router.push('/admin')} className="flex-row items-center gap-1.5 rounded-full bg-ink px-3 py-2">
                <ShieldCheck size={15} color="#fff" /><Text className="text-[13px] font-semibold text-white">Admin</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.push('/account')} className="h-10 w-10 items-center justify-center rounded-full bg-ink">
              <Text className="text-[16px] font-semibold text-white">{firstName.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-[26px] font-semibold text-ink">Hi {firstName} 👋</Text>
        <Text className="mb-5 text-[14.5px] text-graphite">{SUBTITLE[role]}</Text>

        {/* KPIs */}
        <View className="mb-3 flex-row gap-3">
          <Kpi label="Active" value={String(stats?.active ?? 0)} />
          <Kpi label="Deals closed" value={String(stats?.closedCount ?? 0)} sub={stats?.closedValue ? formatAedShort(stats.closedValue) : undefined} />
        </View>
        <View className="mb-6 flex-row gap-3">
          <Kpi label="Commission earned" value={formatAedShort(stats?.commissionEarned ?? 0)} accent />
          <Kpi label="Commission pending" value={formatAedShort(stats?.commissionPending ?? 0)} />
        </View>

        {/* New inquiry */}
        <Pressable onPress={() => router.push('/new-inquiry')} className="mb-3 flex-row items-center gap-3 rounded-apple bg-accent p-4">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20"><Plus size={24} color="#fff" /></View>
          <View className="flex-1">
            <Text className="text-[15.5px] font-semibold text-white">{NEW_LABEL[role]}</Text>
            <Text className="text-[13px] text-white/80">Tell us what you want — we’ll take it from there.</Text>
          </View>
          <ChevronRight size={20} color="rgba(255,255,255,0.75)" />
        </Pressable>

        {/* Message us + benefits */}
        <View className="mb-6 flex-row gap-3">
          <Pressable onPress={() => Linking.openURL(`https://wa.me/${CONTACT_WHATSAPP}`)} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-white/60 bg-white/70 py-3.5">
            <MessageCircle size={17} color="#25D366" /><Text className="text-[14px] font-semibold text-ink">Message us</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/benefits')} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-white/60 bg-white/70 py-3.5">
            <Sparkles size={16} color={colors.accent} /><Text className="text-[14px] font-semibold text-ink">What you get</Text>
          </Pressable>
        </View>

        <Text className="mb-3 text-[15px] font-semibold text-ink">Your inquiries</Text>
        {loading ? (
          <ActivityIndicator className="mt-8" color={colors.accent} />
        ) : deals.length === 0 ? (
          <View className="mt-6 items-center gap-3 px-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/10"><Inbox size={28} color={colors.accent} /></View>
            <Text className="text-center text-[16px] font-semibold text-ink">No inquiries yet</Text>
            <Text className="max-w-[280px] text-center text-[14px] text-graphite">Submit your first one and our team will reach out to close it with you.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {deals.map((d) => (
              <Pressable key={d.id} onPress={() => router.push(`/deal/${d.id}`)} className="rounded-apple border border-white/60 bg-white/75 p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>{d.title || d.project || d.area || (d.kind === 'buy' ? 'Buying inquiry' : 'Deal inquiry')}</Text>
                    <Text className="mt-0.5 text-[13px] text-graphite" numberOfLines={1}>
                      {[d.area, d.property_type, d.bedrooms ? `${d.bedrooms} BR` : null].filter(Boolean).join(' · ') || formatDate(d.created_at)}
                    </Text>
                  </View>
                  {d.is_referral ? <View className="rounded-full bg-journey-agent/40 px-2 py-0.5"><Text className="text-[10.5px] font-semibold text-ink">Referral</Text></View> : null}
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <StatusBadge status={d.status} />
                  <Text className="text-[14px] font-semibold text-ink">
                    {d.commission_amount_aed != null ? formatAed(d.commission_amount_aed) : d.deal_value_aed != null ? formatAed(d.deal_value_aed) : d.budget_aed != null ? formatAed(d.budget_aed) : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <View className="flex-1 rounded-apple border border-white/60 bg-white/70 p-4">
      <Text className="text-[12.5px] text-graphite" numberOfLines={1}>{label}</Text>
      <Text className={`mt-1 text-[22px] font-semibold ${accent ? 'text-accent' : 'text-ink'}`} numberOfLines={1}>{value}</Text>
      {sub ? <Text className="text-[12px] text-graphite" numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}
