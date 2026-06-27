import { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Minus, Plus, CheckCircle2, Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useShares } from '@/store/shares';
import { GlassBg } from '@/components/Glass';
import { buyShares, sellShares, formatAed, shortHash, effectivePrice } from '@/lib/shares';
import { availableTokens } from '@/types/shares';
import { colors } from '@/theme/tokens';

export default function InvestModal() {
  const { symbol, mode: modeParam } = useLocalSearchParams<{ symbol: string; mode?: string }>();
  const mode: 'buy' | 'sell' = modeParam === 'sell' ? 'sell' : 'buy';
  const s = useShares();
  const insets = useSafeAreaInsets();
  const asset = s.bySymbol(String(symbol));
  const holding = asset ? s.holdingFor(asset.id) : undefined;

  const [tokens, setTokens] = useState(mode === 'sell' ? Math.min(10, holding?.tokens ?? 1) : 20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ hash: string; tokens: number; total: number } | null>(null);

  const maxTokens = mode === 'sell' ? (holding?.tokens ?? 0) : (availableTokens(asset!) || 0);
  // Buy at the discounted (effective) price; sell back at par — the discount is upside.
  const unit = asset ? (mode === 'buy' ? effectivePrice(asset) : asset.tokenPriceAed) : 0;
  const cost = unit * tokens;
  const balance = s.wallet?.cashBalanceAed ?? 0;

  const annualRent = useMemo(() => (asset ? (cost * asset.netYieldPct) / 100 : 0), [asset, cost]);
  const projected = annualRent / 12;

  if (!asset) return null;

  const tooMany = tokens > maxTokens;
  const tooPoor = mode === 'buy' && cost > balance;
  const canSubmit = tokens > 0 && !tooMany && !tooPoor && !busy;

  async function submit() {
    if (!asset || !canSubmit) return;
    setBusy(true); setError(null);
    try {
      const entry = mode === 'buy'
        ? await buyShares(asset.id, tokens)
        : await sellShares(asset.id, tokens);
      await Promise.all([s.refreshUser(), s.refresh()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // entry may be array-wrapped depending on PostgREST; normalize.
      const e = Array.isArray(entry) ? entry[0] : entry;
      setReceipt({ hash: e?.txHash ?? e?.tx_hash ?? '0x…', tokens, total: cost });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  }

  // Success receipt
  if (receipt) {
    return (
      <View className="flex-1">
        <GlassBg />
        <View style={{ paddingTop: insets.top + 8 }} className="flex-row justify-end px-4">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-500/12">
            <CheckCircle2 size={48} color="#059669" />
          </View>
          <Text className="mt-5 text-[22px] font-semibold text-ink">
            {mode === 'buy' ? 'Shares purchased' : 'Shares sold'}
          </Text>
          <Text className="mt-1 text-center text-[14px] text-graphite">
            {receipt.tokens.toLocaleString()} shares of {asset.symbol} · {formatAed(receipt.total)}
          </Text>

          <View className="mt-5 w-full rounded-2xl border border-white/60 bg-white/75 px-4 py-3.5">
            <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">Transaction hash</Text>
            <Text className="mt-0.5 text-[13px] font-medium text-ink">{shortHash(receipt.hash)}</Text>
          </View>

          <Pressable onPress={() => { router.back(); router.push('/shares/ledger'); }} className="mt-3">
            <Text className="text-[13.5px] font-medium text-accent">View on ledger explorer →</Text>
          </Pressable>

          <Pressable onPress={() => router.back()} className="mt-8 w-full items-center rounded-full bg-accent py-3.5">
            <Text className="text-[15px] font-semibold text-white">Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-1">
        <Text className="text-[18px] font-semibold text-ink">{mode === 'buy' ? 'Invest' : 'Sell shares'}</Text>
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <Text className="text-[15px] font-semibold text-ink">{asset.name}</Text>
        <Text className="text-[13px] text-graphite">{asset.symbol} · {formatAed(asset.tokenPriceAed)} / share</Text>

        {/* Stepper */}
        <View className="mt-5 flex-row items-center justify-between rounded-apple border border-white/60 bg-white/75 p-4">
          <Pressable onPress={() => setTokens((n) => Math.max(1, n - 10))} className="h-11 w-11 items-center justify-center rounded-full bg-black/5">
            <Minus size={18} color={colors.ink} />
          </Pressable>
          <View className="items-center">
            <Text className="text-[28px] font-semibold text-ink">{tokens.toLocaleString()}</Text>
            <Text className="text-[12px] text-graphite">shares</Text>
          </View>
          <Pressable onPress={() => setTokens((n) => n + 10)} className="h-11 w-11 items-center justify-center rounded-full bg-black/5">
            <Plus size={18} color={colors.ink} />
          </Pressable>
        </View>

        <View className="mt-3 flex-row gap-2">
          {(mode === 'sell'
            ? [25, 50, 100].map((p) => ({ label: `${p}%`, val: Math.max(1, Math.floor((maxTokens * p) / 100)) }))
            : [20, 50, 100, 200].map((q) => ({ label: String(q), val: q }))
          ).map((c) => (
            <Pressable key={c.label} onPress={() => setTokens(c.val)} className="flex-1 items-center rounded-full border border-hairline/70 bg-white/70 py-2">
              <Text className="text-[12.5px] font-medium text-ink700">{c.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Breakdown */}
        <View className="mt-5 rounded-apple border border-white/60 bg-white/75 p-4">
          <Row label={mode === 'buy' ? 'Maximum available' : 'Your holding'} value={`${maxTokens.toLocaleString()} shares`} />
          {mode === 'buy' ? <Row label="Minimum purchase" value={`${asset.minTokens} share · ${formatAed(unit * asset.minTokens)}`} /> : null}
          <View className="my-2 h-px bg-hairline/60" />
          <Row label={mode === 'buy' ? 'Payment amount' : 'You receive'} value={formatAed(cost)} bold />
          <Row label="Platform fee" value="AED 0 (demo)" />
          {mode === 'buy' ? <Row label="Est. annual rent" value={formatAed(annualRent)} accent /> : null}
          {mode === 'buy' ? <Row label="Est. monthly income" value={formatAed(projected)} /> : null}
          <View className="my-2 h-px bg-hairline/60" />
          <Row
            label="Wallet balance"
            value={formatAed(balance)}
            icon={<Wallet size={14} color={colors.graphite} />}
          />
        </View>

        {tooPoor ? (
          <Pressable onPress={() => router.push('/shares/wallet')} className="mt-3 items-center rounded-2xl border border-amber-300/70 bg-amber-50/80 py-3">
            <Text className="text-[13px] font-medium text-amber-800">Not enough balance — add demo funds</Text>
          </Pressable>
        ) : null}
        {tooMany ? (
          <Text className="mt-3 text-center text-[13px] text-rose-600">
            Only {maxTokens.toLocaleString()} shares {mode === 'sell' ? 'in your holding' : 'available'}.
          </Text>
        ) : null}
        {error ? <Text className="mt-3 text-center text-[13px] text-rose-600">{error}</Text> : null}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 12 }} className="border-t border-hairline/50 bg-white/90 px-4 pt-3">
        <Pressable
          disabled={!canSubmit}
          onPress={submit}
          className={`flex-row items-center justify-center gap-2 rounded-full py-4 ${canSubmit ? 'bg-accent' : 'bg-black/15'}`}
        >
          {busy ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-[15px] font-semibold text-white">
              {mode === 'buy' ? `Confirm — ${formatAed(cost)}` : `Sell ${tokens.toLocaleString()} shares`}
            </Text>
          )}
        </Pressable>
        <Text className="mt-2 text-center text-[10.5px] text-graphiteLight">
          Demonstration — no real money or securities change hands.
        </Text>
      </View>
    </View>
  );
}

function Row({ label, value, bold, accent, icon }: { label: string; value: string; bold?: boolean; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-[13px] text-graphite">{label}</Text>
      </View>
      <Text className={`text-[13.5px] ${bold ? 'font-semibold' : 'font-medium'} ${accent ? 'text-accent' : 'text-ink'}`}>{value}</Text>
    </View>
  );
}
