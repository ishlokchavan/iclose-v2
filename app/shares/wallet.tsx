import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Wallet, Plus, BadgeCheck, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useShares } from '@/store/shares';
import { GlassBg } from '@/components/Glass';
import { addDemoFunds, getMyLedger, formatAed, shortHash, shortAddr } from '@/lib/shares';
import type { ShareLedgerEntry } from '@/types/shares';
import { colors } from '@/theme/tokens';

const TINT: Record<string, string> = {
  buy: '#0071e3', sell: '#b45309', dividend: '#059669', transfer: '#7c3aed', deposit: '#6e6e73',
};

export default function WalletModal() {
  const s = useShares();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<ShareLedgerEntry[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (s.wallet?.walletAddress) setHistory(await getMyLedger(s.wallet.walletAddress));
  }, [s.wallet?.walletAddress]);

  useEffect(() => { reload(); }, [reload]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await s.refreshUser(); await reload(); } finally { setRefreshing(false); }
  }, [s, reload]);

  async function topUp(amount: number) {
    setBusy(true);
    try {
      await addDemoFunds(amount);
      await s.refreshUser();
      await reload();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { /* surfaced rarely; ignore */ } finally { setBusy(false); }
  }

  if (!s.signedIn) {
    return (
      <View className="flex-1">
        <GlassBg />
        <Closer insets={insets} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-[15px] text-graphite">Sign in to open your wallet.</Text>
          <Pressable onPress={() => { router.back(); router.push('/(tabs)/profile'); }} className="mt-4 rounded-full bg-accent px-5 py-3">
            <Text className="font-semibold text-white">Go to sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4">
        <Text className="text-[18px] font-semibold text-ink">Wallet</Text>
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
        {/* Balance card */}
        <View className="overflow-hidden rounded-apple border border-white/60 bg-white/80 p-5">
          <View className="flex-row items-center gap-2">
            <Wallet size={16} color={colors.accent} />
            <Text className="text-[12px] uppercase tracking-wide text-graphiteLight">Available balance</Text>
          </View>
          <Text className="mt-1 text-[30px] font-semibold text-ink">{formatAed(s.wallet?.cashBalanceAed ?? 0)}</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <Text className="text-[12px] text-graphite">{shortAddr(s.wallet?.walletAddress)}</Text>
            {s.wallet?.kycStatus === 'verified' ? (
              <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5">
                <BadgeCheck size={12} color="#059669" /><Text className="text-[10.5px] font-semibold text-emerald-700">KYC verified</Text>
              </View>
            ) : (
              <Pressable onPress={() => { router.back(); router.push('/shares/kyc'); }} className="flex-row items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5">
                <ShieldAlert size={12} color="#b45309" /><Text className="text-[10.5px] font-semibold text-amber-700">Verify now</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Add funds */}
        <Text className="mb-2 mt-5 text-[13px] font-semibold text-ink">Add funds</Text>
        <View className="flex-row gap-2.5">
          {[10000, 50000, 100000].map((amt) => (
            <Pressable key={amt} disabled={busy} onPress={() => topUp(amt)}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-2xl border border-white/60 bg-white/75 py-3.5">
              <Plus size={14} color={colors.accent} />
              <Text className="text-[13px] font-semibold text-ink">{formatAed(amt, { compact: true })}</Text>
            </Pressable>
          ))}
        </View>
        {busy ? <ActivityIndicator className="mt-3" color={colors.accent} /> : null}

        {/* History */}
        <Text className="mb-2 mt-6 text-[13px] font-semibold text-ink">Transaction history</Text>
        {history.length ? history.map((e) => (
          <View key={e.txHash} className="mb-2 flex-row items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-3.5 py-3">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <View style={{ backgroundColor: `${TINT[e.type]}1A` }} className="rounded-full px-2 py-0.5">
                  <Text style={{ color: TINT[e.type] }} className="text-[10.5px] font-semibold uppercase">{e.type}</Text>
                </View>
                <Text className="text-[12px] text-graphite">#{e.blockNumber}</Text>
              </View>
              <Text className="mt-1 text-[11px] text-graphiteLight">{shortHash(e.txHash)}</Text>
            </View>
            <View className="items-end">
              {e.tokens > 0 ? <Text className="text-[13px] font-semibold text-ink">{e.tokens.toLocaleString()} shares</Text> : null}
              <Text className={`text-[12px] ${e.type === 'dividend' || e.type === 'deposit' || e.type === 'sell' ? 'text-emerald-700' : 'text-graphite'}`}>
                {e.type === 'dividend' || e.type === 'deposit' || e.type === 'sell' ? '+' : '−'}{formatAed(e.totalAed)}
              </Text>
            </View>
          </View>
        )) : (
          <View className="items-center rounded-apple border border-white/60 bg-white/70 py-8">
            <Text className="text-[13px] text-graphite">No transactions yet.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Closer({ insets }: { insets: { top: number } }) {
  return (
    <View style={{ paddingTop: insets.top + 8 }} className="flex-row justify-end px-4">
      <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
        <X size={20} color={colors.ink} />
      </Pressable>
    </View>
  );
}
