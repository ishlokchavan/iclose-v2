import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ShieldCheck, Landmark, BadgeCheck, Building2, Info, TrendingUp, ArrowUpRight,
} from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { formatAed } from '@/lib/shares';
import { availableTokens, fundedPct, minInvestmentAed } from '@/types/shares';
import type { ShareAsset } from '@/types/shares';

/** Persistent, unmissable disclaimer — this module is a demonstration. */
export function DemoBanner({ compact = false }: { compact?: boolean }) {
  return (
    <View className="mx-4 mt-3 flex-row items-start gap-2 rounded-2xl border border-amber-300/70 bg-amber-50/80 px-3.5 py-2.5">
      <Info size={15} color="#b45309" style={{ marginTop: 1 }} />
      <Text className="flex-1 text-[11.5px] leading-4 text-amber-800">
        {compact
          ? 'Demonstration only — no real money or securities.'
          : 'Demonstration of tokenized real estate. No real money, securities, or transactions are involved. Modeled on the Dubai Land Department / VARA framework.'}
      </Text>
    </View>
  );
}

/** Compliance signal chips — the regulatory stack a production build would use. */
export function ComplianceRow() {
  const items = [
    { icon: Landmark, label: 'DLD-tokenized title' },
    { icon: ShieldCheck, label: 'VARA framework' },
    { icon: Building2, label: 'Licensed custodian' },
    { icon: BadgeCheck, label: 'KYC verified' },
  ];
  return (
    <View className="mt-3 flex-row flex-wrap gap-2 px-4">
      {items.map((it) => (
        <View key={it.label} className="flex-row items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2.5 py-1.5">
          <it.icon size={13} color={colors.accent} />
          <Text className="text-[11.5px] font-medium text-ink700">{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Funding progress bar with sold/total label. */
export function FundingBar({ asset }: { asset: ShareAsset }) {
  const pct = fundedPct(asset);
  const funded = asset.status !== 'funding';
  return (
    <View>
      <View className="h-2 overflow-hidden rounded-full bg-black/8">
        <View
          style={{ width: `${Math.max(3, pct)}%`, backgroundColor: funded ? colors.journey.listing : colors.accent }}
          className="h-full rounded-full"
        />
      </View>
      <View className="mt-1.5 flex-row items-center justify-between">
        <Text className="text-[12px] font-medium text-ink">{pct.toFixed(0)}% funded</Text>
        <Text className="text-[12px] text-graphite">
          {funded ? 'Fully funded' : `${availableTokens(asset).toLocaleString()} shares left`}
        </Text>
      </View>
    </View>
  );
}

/** A small label/value stat block. */
export function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className="flex-1">
      <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">{label}</Text>
      <Text className={`mt-0.5 text-[15px] font-semibold ${accent ? 'text-accent' : 'text-ink'}`}>{value}</Text>
    </View>
  );
}

export function YieldChip({ asset }: { asset: ShareAsset }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1">
      <TrendingUp size={13} color="#059669" />
      <Text className="text-[12px] font-semibold text-emerald-700">{asset.grossYieldPct.toFixed(1)}% yield</Text>
    </View>
  );
}

/** Offering card used on the market + portfolio screens. */
export function AssetCard({ asset }: { asset: ShareAsset }) {
  return (
    <Pressable
      onPress={() => router.push(`/shares/${asset.symbol}`)}
      className="overflow-hidden rounded-apple border border-white/60 bg-white/75"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
    >
      <View className="relative">
        <Image source={{ uri: asset.coverImageUrl ?? undefined }} style={{ width: '100%', aspectRatio: 1.7 }} contentFit="cover" />
        <View className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full bg-black/45 px-2.5 py-1">
          <Text className="text-[11px] font-semibold tracking-wide text-white">{asset.symbol}</Text>
        </View>
        <View className="absolute right-3 top-3">
          <YieldChip asset={asset} />
        </View>
        {asset.status === 'funded' ? (
          <View className="absolute bottom-3 left-3 rounded-full bg-emerald-600/90 px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-white">Fully funded</Text>
          </View>
        ) : null}
      </View>
      <View className="p-4">
        <Text className="text-[15.5px] font-semibold text-ink" numberOfLines={1}>{asset.name}</Text>
        <Text className="text-[13px] text-graphite">{asset.community}, {asset.city}</Text>

        <View className="mt-3"><FundingBar asset={asset} /></View>

        <View className="mt-3.5 flex-row items-center justify-between border-t border-hairline/60 pt-3">
          <View>
            <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">From</Text>
            <Text className="text-[15px] font-semibold text-ink">{formatAed(minInvestmentAed(asset))}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">Property value</Text>
            <Text className="text-[15px] font-semibold text-ink">{formatAed(asset.propertyValueAed, { compact: true })}</Text>
          </View>
          <View className="flex-row items-center gap-0.5 self-end">
            <Text className="text-[12.5px] font-medium text-accent">View</Text>
            <ArrowUpRight size={13} color={colors.accent} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
