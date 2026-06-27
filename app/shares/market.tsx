import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, Tag, ArrowLeftRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useShares } from '@/store/shares';
import { GlassBg } from '@/components/Glass';
import { getOrderBook, placeOrder, fillOrder, formatAed, shortAddr } from '@/lib/shares';
import type { ShareOrder } from '@/types/shares';
import { colors } from '@/theme/tokens';

export default function SecondaryMarket() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const s = useShares();
  const insets = useSafeAreaInsets();
  const asset = s.bySymbol(String(symbol));
  const holding = asset ? s.holdingFor(asset.id) : undefined;

  const [book, setBook] = useState<ShareOrder[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [listing, setListing] = useState(false);
  const [tokens, setTokens] = useState(10);
  const [price, setPrice] = useState(String(asset?.tokenPriceAed ?? 500));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (asset && /^[0-9a-f-]{36}$/i.test(asset.id)) setBook(await getOrderBook(asset.id));
  }, [asset]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUid(data.session?.user.id ?? null));
    reload();
  }, [reload]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([reload(), s.refreshUser()]); } finally { setRefreshing(false); }
  }, [reload, s]);

  if (!asset) return null;

  const ownedAvailable = holding?.tokens ?? 0;

  async function list() {
    if (!asset) return;
    const p = Number(price);
    if (!p || p <= 0 || tokens <= 0 || tokens > ownedAvailable) { setMsg('Check the amount and price.'); return; }
    setBusy(true); setMsg(null);
    try {
      await placeOrder(asset.id, tokens, p);
      await Promise.all([reload(), s.refreshUser()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setListing(false); setMsg('Listed for sale.');
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Could not list.'); }
    finally { setBusy(false); }
  }

  async function buy(o: ShareOrder) {
    if (!s.signedIn) { router.push('/(tabs)/profile'); return; }
    if (s.wallet?.kycStatus !== 'verified') { router.push('/shares/kyc'); return; }
    setBusy(true); setMsg(null);
    try {
      await fillOrder(o.id, o.tokensRemaining);
      await Promise.all([reload(), s.refreshUser()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMsg('Purchase complete.');
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Could not buy.'); }
    finally { setBusy(false); }
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
          <Text className="text-[17px] font-semibold text-ink">Secondary market</Text>
          <View className="w-10" />
        </View>

        <View className="mx-4 mt-2">
          <Text className="text-[15px] font-semibold text-ink">{asset.name}</Text>
          <Text className="text-[12.5px] text-graphite">{asset.symbol} · primary price {formatAed(asset.tokenPriceAed)}/share</Text>
        </View>

        {/* List for sale */}
        {ownedAvailable > 0 ? (
          <View className="mx-4 mt-4 rounded-apple border border-white/60 bg-white/75 p-4">
            {!listing ? (
              <Pressable onPress={() => setListing(true)} className="flex-row items-center justify-center gap-2 rounded-full bg-black/5 py-3">
                <Tag size={16} color={colors.ink} /><Text className="text-[14px] font-semibold text-ink">List your shares for sale</Text>
              </Pressable>
            ) : (
              <View>
                <Text className="text-[13px] font-semibold text-ink">List {asset.symbol} shares</Text>
                <Text className="mt-0.5 text-[12px] text-graphite">You hold {ownedAvailable.toLocaleString()} shares</Text>
                <View className="mt-3 flex-row items-center justify-between">
                  <Pressable onPress={() => setTokens((n) => Math.max(1, n - 10))} className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
                    <Minus size={18} color={colors.ink} />
                  </Pressable>
                  <View className="items-center"><Text className="text-[22px] font-semibold text-ink">{tokens.toLocaleString()}</Text><Text className="text-[11px] text-graphite">shares</Text></View>
                  <Pressable onPress={() => setTokens((n) => Math.min(ownedAvailable, n + 10))} className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
                    <Plus size={18} color={colors.ink} />
                  </Pressable>
                </View>
                <Text className="mb-1.5 mt-3 text-[12px] font-medium text-ink700">Price per share (AED)</Text>
                <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad"
                  className="rounded-2xl border border-hairline bg-white/80 px-4 py-3 text-[15px] text-ink" />
                <View className="mt-3 flex-row gap-2.5">
                  <Pressable onPress={() => setListing(false)} className="flex-1 items-center rounded-full border border-hairline bg-white py-3">
                    <Text className="text-[13.5px] font-medium text-ink">Cancel</Text>
                  </Pressable>
                  <Pressable disabled={busy} onPress={list} className="flex-1 items-center rounded-full bg-accent py-3">
                    {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-[13.5px] font-semibold text-white">List for {formatAed(tokens * (Number(price) || 0))}</Text>}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ) : null}

        {msg ? <Text className="mt-3 px-4 text-center text-[12.5px] text-accent">{msg}</Text> : null}

        {/* Order book */}
        <Text className="px-4 pb-2 pt-5 text-[15px] font-semibold text-ink">Shares for sale</Text>
        {book.length ? (
          <View className="gap-2.5 px-4">
            {book.map((o) => {
              const mine = uid && o.userId === uid;
              const discount = ((o.pricePerTokenAed / asset.tokenPriceAed) - 1) * 100;
              return (
                <View key={o.id} className="flex-row items-center justify-between rounded-apple border border-white/60 bg-white/75 p-3.5">
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-ink">{o.tokensRemaining.toLocaleString()} shares @ {formatAed(o.pricePerTokenAed)}</Text>
                    <Text className="text-[12px] text-graphite">
                      {shortAddr(`0x${o.id.replace(/-/g, '').slice(0, 8)}`)} · {discount >= 0 ? '+' : ''}{discount.toFixed(1)}% vs primary
                    </Text>
                  </View>
                  {mine ? (
                    <View className="rounded-full bg-black/5 px-3 py-1.5"><Text className="text-[12px] font-medium text-graphite">Your listing</Text></View>
                  ) : (
                    <Pressable disabled={busy} onPress={() => buy(o)} className="flex-row items-center gap-1 rounded-full bg-accent px-4 py-2">
                      <ArrowLeftRight size={13} color="#fff" /><Text className="text-[13px] font-semibold text-white">Buy</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="mx-4 items-center rounded-apple border border-white/60 bg-white/70 py-8">
            <Text className="text-[13.5px] text-graphite">No shares listed for resale yet.</Text>
            {ownedAvailable > 0 ? <Text className="text-[12px] text-graphiteLight">List yours above to be first.</Text> : null}
          </View>
        )}

        <Text className="px-5 pt-5 text-center text-[11px] leading-4 text-graphiteLight">
          Peer-to-peer resale at a price you set — a demonstration of on-platform liquidity. No real funds move.
        </Text>
      </ScrollView>
    </View>
  );
}
