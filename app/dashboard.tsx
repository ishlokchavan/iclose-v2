import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { router, useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, ChevronRight, ShieldCheck, Inbox, MessageCircle, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { getMyDeals, computeStats, type Deal, type DashboardStats } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { Wordmark, StatusBadge } from '@/components/DealUI';
import { BottomNav } from '@/components/BottomNav';
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
  const isBuyer = role === 'buyer';
  // Buyers see estimated commission saved (~2% avoided); brokers see earned.
  const heroValue = isBuyer ? (stats?.closedValue ?? 0) * 0.02 : stats?.commissionEarned ?? 0;
  const heroLabel = isBuyer ? 'Estimated commission saved' : 'Commission earned';
  const pipeline = [
    { label: 'Submitted', n: deals.filter((d) => d.status === 'submitted').length },
    { label: 'In discussion', n: deals.filter((d) => d.status === 'in_discussion').length },
    { label: 'Closed', n: deals.filter((d) => d.status === 'closed_won').length },
  ];

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
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
        <Text className="text-[14.5px] text-graphite">{SUBTITLE[role]}</Text>
        {profile?.ref_code ? <Text className="mb-4 mt-1 text-[12px] text-graphite-light">Your ref: {profile.ref_code}</Text> : <View className="mb-4" />}

        {/* Hero metric */}
        <View className="mb-3 overflow-hidden rounded-[22px]">
          <LinearGradient colors={['#0071e3', '#4aa3ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
            <Text className="text-[13px] font-medium text-white/85">{heroLabel}</Text>
            <Text className="mt-1 text-[34px] font-bold text-white">{formatAed(heroValue)}</Text>
            <Text className="mt-1 text-[12.5px] text-white/80">{heroValue > 0 ? (isBuyer ? 'Commission you’ve avoided so far' : 'Paid out to you') : isBuyer ? 'You’ll see savings here when a deal closes' : 'You’ll see earnings here when a deal closes'}</Text>
          </LinearGradient>
        </View>

        {/* Pipeline strip */}
        <View className="mb-3 flex-row gap-3">
          {pipeline.map((p) => (
            <View key={p.label} className="flex-1 items-center rounded-apple border border-white/60 bg-white/70 py-3">
              <Text className="text-[22px] font-bold text-ink">{p.n}</Text>
              <Text className="text-[11.5px] text-graphite">{p.label}</Text>
            </View>
          ))}
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
          <View className="mt-4 items-center gap-3 rounded-apple border border-white/60 bg-white/60 px-8 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/10"><Inbox size={28} color={colors.accent} /></View>
            <Text className="text-center text-[16px] font-semibold text-ink">No inquiries yet</Text>
            <Text className="max-w-[280px] text-center text-[14px] text-graphite">Tap the ＋ below to submit your first — our team will reach out to close it with you.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {deals.map((d) => (
              <Pressable key={d.id} onPress={() => router.push(`/deal/${d.id}`)} className="rounded-apple border border-white/60 bg-white/75 p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>{d.title || d.project || d.area || 'Inquiry'}</Text>
                    <Text className="mt-0.5 text-[12.5px] text-graphite" numberOfLines={1}>{d.ref_code} · {[d.area, d.property_type, d.bedrooms != null ? `${d.bedrooms || 'Studio'} BR` : null].filter(Boolean).join(' · ') || formatDate(d.created_at)}</Text>
                  </View>
                  {d.is_referral ? <View className="rounded-full bg-journey-agent/40 px-2 py-0.5"><Text className="text-[10.5px] font-semibold text-ink">Referral</Text></View> : null}
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <StatusBadge status={d.status} />
                  <Text className="text-[14px] font-semibold text-ink">{d.commission_amount_aed != null ? formatAed(d.commission_amount_aed) : d.deal_value_aed != null ? formatAed(d.deal_value_aed) : d.budget_aed != null ? formatAed(d.budget_aed) : ''}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav active="home" />
    </View>
  );
}
