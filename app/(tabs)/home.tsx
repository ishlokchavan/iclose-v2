import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, Linking, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Plus, ChevronRight, ShieldCheck, MessageCircle, Phone, ClipboardList, TrendingUp, Play } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { getMyDeals, computeStats, type Deal, type DashboardStats } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { Wordmark, StatusBadge } from '@/components/DealUI';
import { formatAed } from '@/lib/format';
import { CONTACT_WHATSAPP, CONTACT_PHONE } from '@/lib/config';
import { HIGHLIGHTS, VIDEOS } from '@/data/learn';
import { pickManager } from '@/data/managers';
import { colors } from '@/theme/tokens';

const NEW_LABEL = { buyer: 'New buying inquiry', seller: 'List a property', broker: 'New deal inquiry' } as const;
const SUBTITLE = { buyer: 'Track what you’re buying and your savings.', seller: 'Track your listing through to sale.', broker: 'Track your deals and commission.' } as const;

export default function Home() {
  const insets = useSafeAreaInsets();
  const { session, profile, isAdmin } = useAuth();
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
  const onRefresh = useCallback(async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }, [load]);

  const firstName = (profile?.full_name || session?.user.email?.split('@')[0] || 'there').split(' ')[0];
  const role = profile?.role ?? 'buyer';
  const isBuyer = role === 'buyer';
  const manager = pickManager(profile?.id ?? session?.user.id);
  const heroValue = isBuyer ? (stats?.closedValue ?? 0) * 0.02 : stats?.commissionEarned ?? 0;
  const heroLabel = isBuyer ? 'Estimated commission saved' : 'Commission earned';
  // Monochrome pipeline ramp (light → dark) — kept minimal on purpose.
  const bars = [
    { label: 'Submitted', n: deals.filter((d) => d.status === 'submitted').length, color: colors.hairline },
    { label: 'Discussing', n: deals.filter((d) => d.status === 'in_discussion').length, color: colors.graphiteLight },
    { label: 'Closed', n: deals.filter((d) => d.status === 'closed_won').length, color: colors.ink },
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
            {isAdmin ? (
              <Pressable onPress={() => router.push('/admin')} className="flex-row items-center gap-1.5 rounded-full bg-ink px-3 py-2">
                <ShieldCheck size={15} color="#fff" /><Text className="text-[13px] font-semibold text-white">Admin</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.navigate('/account')} className="h-10 w-10 items-center justify-center rounded-full bg-ink">
              <Text className="text-[16px] font-semibold text-white">{firstName.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-[26px] font-semibold text-ink">Hi {firstName} 👋</Text>
        <Text className="text-[14.5px] text-graphite">{SUBTITLE[role]}</Text>
        {profile?.ref_code ? <Text className="mb-4 mt-1 text-[12px] text-graphite-light">Your ref: {profile.ref_code}</Text> : <View className="mb-4" />}

        {/* Hero metric */}
        <View className="mb-3 overflow-hidden rounded-[22px] bg-ink p-5">
          <View className="flex-row items-center gap-1.5"><TrendingUp size={15} color="rgba(255,255,255,0.75)" /><Text className="text-[13px] font-medium text-white/70">{heroLabel}</Text></View>
          <Text className="mt-1 text-[34px] font-bold text-white">{formatAed(heroValue)}</Text>
          <Text className="mt-1 text-[12.5px] text-white/55">{heroValue > 0 ? (isBuyer ? 'Commission you’ve avoided so far' : 'Paid out to you') : 'Grows as your deals close'}</Text>
        </View>

        {/* Mini chart */}
        <View className="mb-3 rounded-apple border border-white/60 bg-white/70 p-4">
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
        <Pressable onPress={() => router.push('/new-inquiry')} className="mb-3 flex-row items-center gap-3 rounded-apple bg-ink p-4">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-white/15"><Plus size={24} color="#fff" /></View>
          <View className="flex-1">
            <Text className="text-[15.5px] font-semibold text-white">{NEW_LABEL[role]}</Text>
            <Text className="text-[13px] text-white/70">Tell us what you want — we’ll take it from there.</Text>
          </View>
          <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>

        {/* Account manager */}
        <View className="mb-6 rounded-apple border border-white/60 bg-white/80 p-4">
          <Text className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-graphite-light">Account manager</Text>
          <View className="flex-row items-center gap-3">
            <Image source={{ uri: manager.photo }} style={{ width: 54, height: 54, borderRadius: 27 }} contentFit="cover" />
            <View className="flex-1">
              <Text className="text-[16px] font-semibold text-ink">{manager.name}</Text>
              <View className="mt-0.5 flex-row items-center gap-1.5"><View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.ink }} /><Text className="text-[12.5px] font-medium text-graphite">Available now</Text></View>
            </View>
          </View>
          <View className="mt-3.5 flex-row gap-2.5">
            <Pressable onPress={() => Linking.openURL(`https://wa.me/${CONTACT_WHATSAPP}`)} className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-ink py-3">
              <MessageCircle size={17} color="#fff" /><Text className="text-[14px] font-semibold text-white">WhatsApp</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(`tel:${CONTACT_PHONE}`)} className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-hairline bg-white py-3">
              <Phone size={16} color={colors.ink} /><Text className="text-[14px] font-semibold text-ink">Call</Text>
            </Pressable>
          </View>
        </View>

        {/* Highlights carousel */}
        <Text className="mb-2 text-[15px] font-semibold text-ink">Highlights</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-4" contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <Pressable key={h.id} onPress={() => h.route && router.push(h.route as never)} style={{ width: 230, minHeight: 132 }} className="justify-between rounded-[20px] border border-hairline bg-white p-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-mist"><Icon size={20} color={colors.ink} /></View>
                <View>
                  <Text className="text-[16px] font-bold leading-tight text-ink">{h.title}</Text>
                  <Text className="mt-1 text-[12.5px] text-graphite">{h.subtitle}</Text>
                  <Text className="mt-1.5 text-[12.5px] font-semibold text-ink">Learn more →</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Knowledge Hub — videos */}
        <Text className="mb-3 text-[15px] font-semibold text-ink">Knowledge Hub</Text>
        <View className="mb-6 gap-3">
          {VIDEOS.map((v) => (
            <Pressable key={v.id} onPress={() => Alert.alert('Coming soon', 'This video is on the way.')} className="flex-row items-center gap-3 rounded-apple border border-white/60 bg-white/75 p-2.5">
              <View style={{ width: 100, height: 66, backgroundColor: colors.mist }} className="items-center justify-center overflow-hidden rounded-2xl">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-ink"><Play size={15} color="#fff" fill="#fff" /></View>
              </View>
              <View className="flex-1 pr-1">
                <Text className="text-[14.5px] font-semibold text-ink" numberOfLines={2}>{v.title}</Text>
                <Text className="mt-1 text-[12px] text-graphite">{v.duration} · Video</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Recent inquiries */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-[15px] font-semibold text-ink">Recent inquiries</Text>
          <Pressable onPress={() => router.navigate('/inquiries')}><Text className="text-[13.5px] font-semibold text-ink">See all</Text></Pressable>
        </View>
        {loading ? (
          <ActivityIndicator className="mt-6" color={colors.graphite} />
        ) : recent.length === 0 ? (
          <View className="items-center gap-3 rounded-apple border border-white/60 bg-white/60 px-8 py-8">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-mist"><ClipboardList size={26} color={colors.ink} /></View>
            <Text className="text-center text-[14px] text-graphite">Tap ＋ to submit your first inquiry.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {recent.map((d) => (
              <Pressable key={d.id} onPress={() => router.push(`/deal/${d.id}`)} className="rounded-apple border border-white/60 bg-white/75 p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-[15px] font-semibold text-ink" numberOfLines={1}>{d.title || d.area || 'Inquiry'}</Text>
                  <StatusBadge status={d.status} />
                </View>
                <Text className="mt-1 text-[12.5px] text-graphite">{d.ref_code} · {d.area}{d.deal_value_aed ? ` · ${formatAed(d.deal_value_aed)}` : d.budget_aed ? ` · ${formatAed(d.budget_aed)}` : ''}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
