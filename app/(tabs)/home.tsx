import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Plus, ChevronRight, MessageCircle, Phone, ClipboardList, TrendingUp, Bell } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { getMyDeals, computeStats, type Deal, type DashboardStats } from '@/lib/deals';
import { getMyManager } from '@/lib/managers';
import { useUnreadCount } from '@/lib/notifications';
import { useAppSettings, whatsappLink, telLink } from '@/lib/settings';
import { GlassBg } from '@/components/Glass';
import { Wordmark, StatusBadge } from '@/components/DealUI';
import { Press, FadeIn } from '@/components/Press';
import { Tour, BUYER_TOUR, BROKER_TOUR } from '@/components/Tour';
import { formatAed } from '@/lib/format';
import { HIGHLIGHTS } from '@/data/learn';
import { colors } from '@/theme/tokens';

const NEW_LABEL = { buyer: 'New buying inquiry', seller: 'List a property', broker: 'New deal inquiry' } as const;
const SUBTITLE = { buyer: 'Track what you’re buying and your savings.', seller: 'Track your listing through to sale.', broker: 'Track your deals and commission.' } as const;

type ManagerCard = { name: string; title: string; photo: string | null };

export default function Home() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const settings = useAppSettings();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [manager, setManager] = useState<ManagerCard | null>(null);
  const [unread, refreshUnread] = useUnreadCount();

  const load = useCallback(async () => {
    const d = await getMyDeals();
    setDeals(d);
    setStats(computeStats(d));
  }, []);
  useEffect(() => { if (session) load().finally(() => setLoading(false)); }, [session, load]);
  useFocusEffect(useCallback(() => { if (session) { load(); refreshUnread(); } }, [session, load, refreshUnread]));

  // Resolve the user's account manager (DB-backed, falls back gracefully).
  useEffect(() => {
    let alive = true;
    getMyManager(profile?.id ?? session?.user.id, profile?.account_manager_id)
      .then((m) => { if (alive) setManager(m); })
      .catch(() => {});
    return () => { alive = false; };
  }, [profile?.id, profile?.account_manager_id, session?.user.id]);
  const onRefresh = useCallback(async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }, [load]);

  const firstName = (profile?.full_name || session?.user.email?.split('@')[0] || 'there').split(' ')[0];
  const role = profile?.role ?? 'buyer';
  const isBuyer = role === 'buyer';
  const heroValue = isBuyer ? (stats?.closedValue ?? 0) * 0.02 : stats?.commissionEarned ?? 0;
  const heroLabel = isBuyer ? 'Estimated commission saved' : 'Commission earned';
  // Monochrome pipeline ramp (dim → bright) — bright bar = closed.
  const bars = [
    { label: 'Submitted', n: deals.filter((d) => d.status === 'submitted').length, color: colors.graphiteLight },
    { label: 'Discussing', n: deals.filter((d) => d.status === 'in_discussion').length, color: colors.graphite },
    { label: 'Closed', n: deals.filter((d) => d.status === 'closed_won').length, color: colors.accent },
  ];
  const maxBar = Math.max(1, ...bars.map((b) => b.n));
  const recent = deals.slice(0, 3);

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.graphite} />}>
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Wordmark size={24} />
          <View className="flex-row items-center gap-2">
            <Press onPress={() => router.push('/notifications')} className="h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface2">
              <Bell size={18} color={colors.ink} />
              {unread > 0 ? (
                <View className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full px-1" style={{ backgroundColor: colors.accent }}>
                  <Text className="text-[10px] font-bold" style={{ color: colors.onAccent }}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </Press>
            <Pressable onPress={() => router.navigate('/account')} className="h-10 w-10 items-center justify-center rounded-full bg-accent">
              <Text className="text-[16px] font-semibold" style={{ color: colors.onAccent }}>{firstName.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-[26px] font-semibold text-ink">Hi {firstName} 👋</Text>
        <Text className="text-[14.5px] text-graphite">{SUBTITLE[role]}</Text>
        {profile?.ref_code ? <Text className="mb-4 mt-1 text-[12px] text-graphite-light">Your ref: {profile.ref_code}</Text> : <View className="mb-4" />}

        {/* Hero metric */}
        <View className="mb-3 overflow-hidden rounded-[22px] border border-hairline bg-surface p-5">
          <View className="flex-row items-center gap-1.5"><TrendingUp size={15} color={colors.accent} /><Text className="text-[13px] font-medium text-graphite">{heroLabel}</Text></View>
          <Text className="mt-1 text-[36px] font-bold" style={{ color: colors.accent }}>{formatAed(heroValue)}</Text>
          <Text className="mt-1 text-[12.5px] text-graphite">{heroValue > 0 ? (isBuyer ? 'Commission you’ve avoided so far' : 'Paid out to you') : 'Grows as your deals close'}</Text>
        </View>

        {/* Mini chart */}
        <View className="mb-3 rounded-apple border border-hairline bg-surface p-4">
          <Text className="mb-3 text-[13px] font-semibold text-graphite">Your pipeline</Text>
          <View className="flex-row items-end justify-around" style={{ height: 96 }}>
            {bars.map((b) => (
              <View key={b.label} className="flex-1 items-center gap-1.5">
                <Text className="text-[13px] font-bold text-ink">{b.n}</Text>
                <View style={{ width: 34, height: Math.max(6, (b.n / maxBar) * 64), backgroundColor: b.color, borderRadius: 8 }} />
                <Text className="text-[11px] text-graphite">{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* New inquiry */}
        <Press onPress={() => router.push('/new-inquiry')} className="mb-3 flex-row items-center gap-3 rounded-apple bg-accent p-4">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-black/10"><Plus size={24} color={colors.onAccent} /></View>
          <View className="flex-1">
            <Text className="text-[15.5px] font-semibold" style={{ color: colors.onAccent }}>{NEW_LABEL[role]}</Text>
            <Text className="text-[13px]" style={{ color: 'rgba(10,10,10,0.65)' }}>Tell us what you want — we’ll take it from there.</Text>
          </View>
          <ChevronRight size={20} color="rgba(10,10,10,0.55)" />
        </Press>

        {/* Account manager */}
        <View className="mb-6 rounded-apple border border-hairline bg-surface p-4">
          <Text className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-graphite-light">Account manager</Text>
          <View className="flex-row items-center gap-3">
            {manager?.photo ? (
              <Image source={{ uri: manager.photo }} style={{ width: 54, height: 54, borderRadius: 27 }} contentFit="cover" />
            ) : (
              <View style={{ width: 54, height: 54, borderRadius: 27 }} className="items-center justify-center bg-surface2">
                <Text className="text-[18px] font-semibold text-graphite">{(manager?.name ?? '·').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-[16px] font-semibold text-ink">{manager?.name ?? 'Your account manager'}</Text>
              <View className="mt-0.5 flex-row items-center gap-1.5"><View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.accent }} /><Text className="text-[12.5px] font-medium text-graphite">Available now</Text></View>
            </View>
          </View>
          <View className="mt-3.5 flex-row gap-2.5">
            <Press onPress={() => Linking.openURL(whatsappLink(settings))} className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-accent py-3">
              <MessageCircle size={17} color={colors.onAccent} /><Text className="text-[14px] font-semibold" style={{ color: colors.onAccent }}>WhatsApp</Text>
            </Press>
            <Press onPress={() => Linking.openURL(telLink(settings))} className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-hairline bg-surface2 py-3">
              <Phone size={16} color={colors.ink} /><Text className="text-[14px] font-semibold text-ink">Call</Text>
            </Press>
          </View>
        </View>

        {/* Highlights carousel */}
        <Text className="mb-2 text-[15px] font-semibold text-ink">Highlights</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-4" contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            // Brokers "save" 100% commission — never see the buyer-facing "never pay" line.
            const title = h.id === 'save' && role === 'broker' ? 'Save 100% of commission' : h.title;
            return (
              <Press key={h.id} onPress={() => h.route && router.push(h.route as never)} style={{ width: 230, minHeight: 132 }} className="justify-between rounded-[20px] border border-hairline bg-surface p-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-surface2"><Icon size={20} color={colors.accent} /></View>
                <View>
                  <Text className="text-[16px] font-bold leading-tight text-ink">{title}</Text>
                  <Text className="mt-1 text-[12.5px] text-graphite">{h.subtitle}</Text>
                  <Text className="mt-1.5 text-[12.5px] font-semibold" style={{ color: colors.accent }}>Learn more →</Text>
                </View>
              </Press>
            );
          })}
        </ScrollView>

        {/* Recent inquiries */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-[15px] font-semibold text-ink">Recent inquiries</Text>
          <Pressable onPress={() => router.navigate('/inquiries')}><Text className="text-[13.5px] font-semibold" style={{ color: colors.accent }}>See all</Text></Pressable>
        </View>
        {loading ? (
          <ActivityIndicator className="mt-6" color={colors.graphite} />
        ) : recent.length === 0 ? (
          <View className="items-center gap-3 rounded-apple border border-hairline bg-surface px-8 py-8">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-surface2"><ClipboardList size={26} color={colors.accent} /></View>
            <Text className="text-center text-[14px] text-graphite">Tap ＋ to submit your first inquiry.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {recent.map((d, i) => (
              <FadeIn key={d.id} delay={i * 40}>
                <Press onPress={() => router.push(`/deal/${d.id}`)} className="rounded-apple border border-hairline bg-surface p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-[15px] font-semibold text-ink" numberOfLines={1}>{d.title || d.area || 'Inquiry'}</Text>
                    <StatusBadge status={d.status} />
                  </View>
                  <Text className="mt-1 text-[12.5px] text-graphite">{d.ref_code} · {d.area}{d.deal_value_aed ? ` · ${formatAed(d.deal_value_aed)}` : d.budget_aed ? ` · ${formatAed(d.budget_aed)}` : ''}</Text>
                </Press>
              </FadeIn>
            ))}
          </View>
        )}
      </ScrollView>
      {session && profile ? <Tour steps={role === 'broker' ? BROKER_TOUR : BUYER_TOUR} storageKey={'tour_v1_' + role} /> : null}
    </View>
  );
}
