import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Wallet, Coins, Gift, ArrowUpRight, ScrollText, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useShares } from '@/store/shares';
import { GlassBg } from '@/components/Glass';
import { Metric } from '@/components/SharesUI';
import { claimDividends, getMyOrders, cancelOrder, formatAed } from '@/lib/shares';
import type { ShareOrder } from '@/types/shares';
import { colors } from '@/theme/tokens';

export default function PortfolioScreen() {
  const s = useShares();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<ShareOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const reloadOrders = useCallback(async () => setOrders(await getMyOrders()), []);
  useEffect(() => { reloadOrders(); }, [reloadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([s.refresh(), reloadOrders()]); } finally { setRefreshing(false); }
  }, [s, reloadOrders]);

  const value = s.holdings.reduce((sum, h) => { const a = s.byId(h.assetId); return sum + (a ? h.tokens * a.tokenPriceAed : 0); }, 0);
  const invested = s.holdings.reduce((sum, h) => sum + h.tokens * h.avgCostAed, 0);
  const monthly = s.holdings.reduce((sum, h) => { const a = s.byId(h.assetId); return sum + (a ? (h.tokens * a.tokenPriceAed * a.netYieldPct) / 100 / 12 : 0); }, 0);
  const pl = value - invested;
  const openOrders = orders.filter((o) => o.status === 'open' || o.status === 'partial');

  async function claim() {
    setClaiming(true); setClaimMsg(null);
    try {
      const total = await claimDividends();
      const amt = Number(total) || 0;
      await s.refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setClaimMsg(amt > 0 ? `🎉 Your rent is in! +${formatAed(amt)} added to your wallet.` : 'No new rent to collect just yet — check back next month.');
    } catch (e) {
      setClaimMsg(e instanceof Error ? e.message : 'Could not claim right now.');
    } finally { setClaiming(false); }
  }

  async function doCancel(id: string) {
    try { await cancelOrder(id); await Promise.all([reloadOrders(), s.refreshUser()]); Haptics.selectionAsync(); } catch { /* noop */ }
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
        <View className="flex-row items-center justify-between px-4">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text className="text-[17px] font-semibold text-ink">Portfolio</Text>
          <Pressable onPress={() => router.push('/shares/wallet')} className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
            <Wallet size={18} color={colors.ink} />
          </Pressable>
        </View>

        {/* Summary */}
        <View className="mx-4 mt-3 rounded-apple border border-white/60 bg-white/80 p-5">
          <Text className="text-[12px] uppercase tracking-wide text-graphiteLight">Total value</Text>
          <Text className="mt-1 text-[30px] font-semibold text-ink">{formatAed(value)}</Text>
          <Text className={`mt-1 text-[13px] font-medium ${pl >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {pl >= 0 ? '+' : ''}{formatAed(pl)} all-time
          </Text>
          <View className="mt-4 flex-row gap-3 border-t border-hairline/60 pt-3">
            <Metric label="Invested" value={formatAed(invested)} />
            <Metric label="Income / mo" value={formatAed(monthly)} accent />
            <Metric label="Wallet" value={formatAed(s.wallet?.cashBalanceAed ?? 0, { compact: true })} />
          </View>
        </View>

        {/* Claim dividends */}
        <Pressable onPress={claim} disabled={claiming || s.holdings.length === 0}
          className="mx-4 mt-3 flex-row items-center gap-3 rounded-apple border border-emerald-200 bg-emerald-50/80 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
            {claiming ? <ActivityIndicator color="#059669" /> : <Gift size={18} color="#059669" />}
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-emerald-800">Collect your rent</Text>
            <Text className="text-[12px] text-emerald-700">{claimMsg ?? 'Your share of the rent is waiting — tap to collect.'}</Text>
          </View>
          <ArrowUpRight size={18} color="#059669" />
        </Pressable>

        {/* Holdings */}
        <Text className="px-4 pb-2 pt-5 text-[15px] font-semibold text-ink">Your shares</Text>
        {s.holdings.length ? (
          <View className="gap-2.5 px-4">
            {s.holdings.map((h) => {
              const a = s.byId(h.assetId); if (!a) return null;
              const hv = h.tokens * a.tokenPriceAed; const hpl = hv - h.tokens * h.avgCostAed;
              return (
                <Pressable key={h.id} onPress={() => router.push(`/shares/${a.symbol}`)}
                  className="flex-row items-center gap-3 rounded-apple border border-white/60 bg-white/75 p-3">
                  <Image source={{ uri: a.coverImageUrl ?? undefined }} style={{ width: 56, height: 56, borderRadius: 14 }} contentFit="cover" />
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-ink" numberOfLines={1}>{a.name}</Text>
                    <Text className="text-[12px] text-graphite">{h.tokens.toLocaleString()} shares · {a.grossYieldPct.toFixed(1)}% yield</Text>
                    <Text className={`text-[12px] font-medium ${hpl >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{hpl >= 0 ? '+' : ''}{formatAed(hpl)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[15px] font-semibold text-ink">{formatAed(hv)}</Text>
                    <View className="mt-1 flex-row items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5">
                      <Coins size={11} color={colors.accent} /><Text className="text-[11px] font-medium text-accent">Manage</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View className="mx-4 items-center rounded-apple border border-white/60 bg-white/70 py-8">
            <Text className="text-[13.5px] text-graphite">You don’t own any shares yet.</Text>
            <Pressable onPress={() => router.push('/(tabs)/shares')} className="mt-3 rounded-full bg-accent px-4 py-2">
              <Text className="text-[13px] font-semibold text-white">Browse offerings</Text>
            </Pressable>
          </View>
        )}

        {/* Open market listings */}
        {openOrders.length ? (
          <>
            <Text className="px-4 pb-2 pt-6 text-[15px] font-semibold text-ink">Your market listings</Text>
            <View className="gap-2.5 px-4">
              {openOrders.map((o) => {
                const a = s.byId(o.assetId);
                return (
                  <View key={o.id} className="flex-row items-center justify-between rounded-apple border border-white/60 bg-white/75 p-3.5">
                    <View className="flex-1">
                      <Text className="text-[13.5px] font-semibold text-ink">{a?.symbol ?? 'Asset'} · sell</Text>
                      <Text className="text-[12px] text-graphite">{o.tokensRemaining.toLocaleString()} shares @ {formatAed(o.pricePerTokenAed)}</Text>
                    </View>
                    <Pressable onPress={() => doCancel(o.id)} className="flex-row items-center gap-1 rounded-full bg-black/5 px-3 py-1.5">
                      <XCircle size={14} color={colors.graphite} /><Text className="text-[12px] font-medium text-graphite">Cancel</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        <Pressable onPress={() => router.push('/shares/ledger')} className="mx-4 mt-6 flex-row items-center justify-center gap-2 rounded-full border border-hairline bg-white/70 py-3">
          <ScrollText size={15} color={colors.ink} /><Text className="text-[13.5px] font-medium text-ink">View on-chain ledger</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
